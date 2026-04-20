import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { User } from '../../entities/user.entity';
import { Follow } from '../../entities/follow.entity';
import { UserRole, UserStatus } from '../../common/enums';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PaginationDto, paginateQuery } from '../../common/helpers/pagination.helper';
import { PaginatedResult } from '../../common/interceptors/transform.interceptor';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id, deleted_at: undefined },
      relations: ['city'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { username, deleted_at: undefined },
      relations: ['city'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check profile visibility
    if (user.profile_visibility === 'private') {
      throw new ForbiddenException('This profile is private');
    }

    return user;
  }

  async getProfile(userId: string): Promise<User> {
    return this.findById(userId);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(userId);

    // Check username uniqueness if being changed
    if (dto.username && dto.username !== user.username) {
      const existing = await this.userRepo.findOne({
        where: { username: dto.username },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Username is already taken');
      }
    }

    Object.assign(user, dto);
    const updated = await this.userRepo.save(user);

    this.logger.log(`Profile updated for user: ${userId}`);
    return updated;
  }

  async updateAvatar(userId: string, avatarUrl: string): Promise<User> {
    await this.userRepo.update(userId, { avatar_url: avatarUrl });
    return this.findById(userId);
  }

  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.findById(userId);

    // Soft delete
    await this.userRepo.update(userId, {
      deleted_at: new Date(),
      status: UserStatus.DELETED as any,
      email: `deleted_${userId}@deleted.ev-trips.com`,
      username: `deleted_${userId.slice(0, 8)}`,
    });

    this.logger.warn(`Account soft-deleted: ${userId} (was ${user.email})`);
    return { message: 'Account deleted successfully' };
  }

  async searchUsers(
    query: string,
    pagination: PaginationDto,
  ): Promise<PaginatedResult<User>> {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .where('user.deleted_at IS NULL')
      .andWhere('user.profile_visibility = :vis', { vis: 'public' })
      .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
      .andWhere(
        "(user.full_name ILIKE :q OR user.username ILIKE :q OR user.email ILIKE :q)",
        { q: `%${query}%` },
      )
      .orderBy('user.total_trips', 'DESC')
      .addOrderBy('user.contributor_points', 'DESC')
      .select([
        'user.id',
        'user.full_name',
        'user.username',
        'user.avatar_url',
        'user.bio',
        'user.country',
        'user.total_trips',
        'user.contributor_points',
        'user.created_at',
      ]);

    return paginateQuery(qb, pagination.page ?? 1, pagination.limit ?? 20);
  }

  async getFollowers(userId: string, pagination: PaginationDto): Promise<PaginatedResult<User>> {
    await this.findById(userId); // Ensure user exists

    const qb = this.userRepo
      .createQueryBuilder('user')
      .innerJoin(Follow, 'follow', 'follow.follower_id = user.id')
      .where('follow.following_id = :userId', { userId })
      .andWhere('user.deleted_at IS NULL')
      .select([
        'user.id',
        'user.full_name',
        'user.username',
        'user.avatar_url',
        'user.bio',
        'user.total_trips',
      ]);

    return paginateQuery(qb, pagination.page ?? 1, pagination.limit ?? 20);
  }

  async getFollowing(userId: string, pagination: PaginationDto): Promise<PaginatedResult<User>> {
    await this.findById(userId);

    const qb = this.userRepo
      .createQueryBuilder('user')
      .innerJoin(Follow, 'follow', 'follow.following_id = user.id')
      .where('follow.follower_id = :userId', { userId })
      .andWhere('user.deleted_at IS NULL')
      .select([
        'user.id',
        'user.full_name',
        'user.username',
        'user.avatar_url',
        'user.bio',
        'user.total_trips',
      ]);

    return paginateQuery(qb, pagination.page ?? 1, pagination.limit ?? 20);
  }

  async followUser(followerId: string, targetId: string): Promise<{ message: string }> {
    if (followerId === targetId) {
      throw new ForbiddenException('You cannot follow yourself');
    }

    await this.findById(targetId);

    const existing = await this.followRepo.findOne({
      where: { follower_id: followerId, following_id: targetId },
    });

    if (existing) {
      throw new ConflictException('You are already following this user');
    }

    await this.followRepo.save(
      this.followRepo.create({ follower_id: followerId, following_id: targetId }),
    );

    return { message: 'Successfully followed user' };
  }

  async unfollowUser(followerId: string, targetId: string): Promise<{ message: string }> {
    const follow = await this.followRepo.findOne({
      where: { follower_id: followerId, following_id: targetId },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.followRepo.remove(follow);
    return { message: 'Successfully unfollowed user' };
  }

  async getUserStats(userId: string): Promise<Record<string, number>> {
    const user = await this.findById(userId);
    return {
      total_trips: user.total_trips,
      total_views: user.total_views,
      total_favorites: user.total_favorites,
      contributor_points: user.contributor_points,
    };
  }
}
