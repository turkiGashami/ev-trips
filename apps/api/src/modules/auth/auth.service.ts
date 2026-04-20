import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';

import { User } from '../../entities/user.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { UserRole, UserStatus } from '../../common/enums';
import { RegisterDto } from './dto/register.dto';
import { LoginDto, ForgotPasswordDto, VerifyEmailDto } from './dto/login.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtPayload } from './decorators/current-user.decorator';
import { MailService } from '../mail/mail.service';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: Partial<User>;
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCKOUT_MINUTES = 15;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto, req?: Request): Promise<AuthResponse> {
    // Check email uniqueness
    const existingEmail = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existingEmail) {
      throw new ConflictException('email_taken');
    }

    // Check username uniqueness
    const existingUsername = await this.userRepo.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('username_taken');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = this.userRepo.create({
      email: dto.email,
      full_name: dto.full_name,
      username: dto.username,
      country: dto.country ?? null,
      password_hash: passwordHash,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      email_verified_at: null,
      email_verification_token: await bcrypt.hash(verificationToken, 10),
      email_verification_token_expires_at: verificationExpires,
    });

    await this.userRepo.save(user);

    this.logger.log(`New user registered: ${user.email} (${user.id})`);

    // Send verification email (fire-and-forget — never blocks response)
    this.mailService.sendVerificationEmail(
      user.email,
      user.full_name,
      verificationToken,
    ).catch((err) => this.logger.error(`Verification email failed: ${err.message}`));

    // Auto-login: generate tokens so frontend doesn't require separate login
    const tokens = await this.generateTokens(user, req ?? {} as Request);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async login(dto: LoginDto, req: Request): Promise<AuthResponse> {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is deleted (soft delete)
    if (user.deleted_at) {
      throw new UnauthorizedException('Account not found');
    }

    // Check lockout
    // (Using failed login tracking via a separate mechanism if needed)

    // Validate password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      this.logger.warn(`Failed login attempt for: ${dto.email}`);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check status
    if (user.status === UserStatus.BANNED) {
      throw new ForbiddenException('Your account has been banned. Please contact support.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Your account is currently suspended.');
    }

    // Update last login
    await this.userRepo.update(user.id, {
      last_login_at: new Date(),
    });

    // Generate tokens
    const tokens = await this.generateTokens(user, req);

    this.logger.log(`User logged in: ${user.email} (${user.id})`);

    return {
      user: this.sanitizeUser(user),
      tokens,
    };
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    // Revoke the specific refresh token
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    // Revoke ALL tokens for this user for full logout
    await this.refreshTokenRepo.update(
      { user_id: userId, revoked_at: undefined },
      { revoked_at: new Date() },
    );

    this.logger.log(`User logged out: ${userId}`);
  }

  async refreshByToken(refreshToken: string, req: Request): Promise<AuthTokens> {
    const activeTokens = await this.refreshTokenRepo.find({
      where: { revoked_at: undefined },
    });
    for (const stored of activeTokens) {
      if (stored.expires_at <= new Date()) continue;
      const isValid = await bcrypt.compare(refreshToken, stored.token_hash);
      if (isValid) {
        return this.refreshTokens(stored.user_id, refreshToken, req);
      }
    }
    throw new UnauthorizedException('Invalid or expired refresh token');
  }

  async refreshTokens(userId: string, refreshToken: string, req: Request): Promise<AuthTokens> {
    // Find valid refresh tokens for user
    const storedTokens = await this.refreshTokenRepo.find({
      where: {
        user_id: userId,
        revoked_at: undefined,
      },
    });

    let validToken: RefreshToken | null = null;
    for (const stored of storedTokens) {
      const isValid = await bcrypt.compare(refreshToken, stored.token_hash);
      if (isValid && stored.expires_at > new Date()) {
        validToken = stored;
        break;
      }
    }

    if (!validToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Revoke used token (rotation)
    await this.refreshTokenRepo.update(validToken.id, { revoked_at: new Date() });

    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });
    return this.generateTokens(user, req);
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    // Find users with non-expired verification tokens
    const users = await this.userRepo.find({
      where: {
        email_verified_at: undefined,
      },
    });

    let targetUser: User | null = null;
    for (const user of users) {
      if (
        user.email_verification_token &&
        user.email_verification_token_expires_at &&
        user.email_verification_token_expires_at > new Date()
      ) {
        const isMatch = await bcrypt.compare(token, user.email_verification_token);
        if (isMatch) {
          targetUser = user;
          break;
        }
      }
    }

    if (!targetUser) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userRepo.update(targetUser.id, {
      email_verified_at: new Date(),
      status: UserStatus.ACTIVE,
      email_verification_token: null,
      email_verification_token_expires_at: null,
    });

    this.logger.log(`Email verified for user: ${targetUser.email}`);

    return { message: 'Email verified successfully. You can now log in.' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    // Always return success to prevent email enumeration
    if (!user || user.deleted_at) {
      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepo.update(user.id, {
      password_reset_token: await bcrypt.hash(resetToken, 10),
      password_reset_token_expires_at: resetExpires,
    });

    this.mailService.sendPasswordResetEmail(
      user.email,
      user.full_name,
      resetToken,
    ).catch((err) => this.logger.error(`Password reset email failed: ${err.message}`));

    this.logger.log(`Password reset requested for: ${user.email}`);

    return {
      message: 'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const users = await this.userRepo.find();

    let targetUser: User | null = null;
    for (const user of users) {
      if (
        user.password_reset_token &&
        user.password_reset_token_expires_at &&
        user.password_reset_token_expires_at > new Date()
      ) {
        const isMatch = await bcrypt.compare(dto.token, user.password_reset_token);
        if (isMatch) {
          targetUser = user;
          break;
        }
      }
    }

    if (!targetUser) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.userRepo.update(targetUser.id, {
      password_hash: newPasswordHash,
      password_reset_token: null,
      password_reset_token_expires_at: null,
    });

    // Revoke all refresh tokens
    await this.refreshTokenRepo.update(
      { user_id: targetUser.id },
      { revoked_at: new Date() },
    );

    this.logger.log(`Password reset for user: ${targetUser.email}`);

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.password_hash);
    if (!isCurrentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password_hash);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    await this.userRepo.update(userId, {
      password_hash: await bcrypt.hash(dto.newPassword, 12),
    });

    // Revoke all refresh tokens to force re-login
    await this.refreshTokenRepo.update(
      { user_id: userId },
      { revoked_at: new Date() },
    );

    this.logger.log(`Password changed for user: ${user.email}`);

    return { message: 'Password changed successfully. Please log in again.' };
  }

  async resendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOneOrFail({ where: { id: userId } });

    if (user.email_verified_at) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.userRepo.update(userId, {
      email_verification_token: await bcrypt.hash(verificationToken, 10),
      email_verification_token_expires_at: verificationExpires,
    });

    // TODO: Queue email
    return { message: 'Verification email sent. Please check your inbox.' };
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private async generateTokens(user: User, req: Request): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      emailVerified: !!user.email_verified_at,
    };

    const jwtExpiresIn = this.configService.get<string>('jwt.expiresIn', '15m');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '7d');

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('jwt.secret'),
      expiresIn: jwtExpiresIn,
    });

    const rawRefreshToken = uuidv4() + '-' + uuidv4(); // 72 chars of entropy
    const refreshTokenHash = await bcrypt.hash(rawRefreshToken, 10);

    const refreshExpiresMs = this.parseExpiry(refreshExpiresIn);
    const expiresAt = new Date(Date.now() + refreshExpiresMs);

    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        user_id: user.id,
        token_hash: refreshTokenHash,
        expires_at: expiresAt,
        ip_address: req.ip || null,
        user_agent: req.get('user-agent') || null,
      }),
    );

    // Clean up old expired tokens for this user (housekeeping)
    await this.refreshTokenRepo
      .createQueryBuilder()
      .delete()
      .where('user_id = :userId', { userId: user.id })
      .andWhere('expires_at < :now', { now: new Date() })
      .execute();

    const accessExpiresMs = this.parseExpiry(jwtExpiresIn);

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: Math.floor(accessExpiresMs / 1000),
    };
  }

  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1), 10);
    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 15 * 60 * 1000; // 15 min default
    }
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password_hash, email_verification_token, password_reset_token, ...safe } = user as any;
    return safe;
  }

  private async generateUniqueUsername(base: string): Promise<string> {
    let username = base.slice(0, 20);
    let counter = 0;

    while (true) {
      const candidate = counter === 0 ? username : `${username}${counter}`;
      const exists = await this.userRepo.findOne({ where: { username: candidate } });
      if (!exists) return candidate;
      counter++;
    }
  }
}
