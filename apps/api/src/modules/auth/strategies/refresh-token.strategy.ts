import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { JwtPayload } from '../decorators/current-user.decorator';

export interface RefreshJwtPayload extends JwtPayload {
  refreshToken: string;
}

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try header first
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        // Then try body
        (request: Request) => request?.body?.refreshToken,
        // Then try cookie
        (request: Request) => request?.cookies?.['refresh_token'],
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(request: Request, payload: JwtPayload): Promise<RefreshJwtPayload> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const refreshToken =
      request.headers.authorization?.replace('Bearer ', '') ||
      request.body?.refreshToken ||
      request.cookies?.['refresh_token'];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
