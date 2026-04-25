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
import { Trip } from '../../entities/trip.entity';
import { UserRole, UserStatus, TripStatus } from '../../common/enums';
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
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
  ) {}

  /** Aggregated public stats for a user. */
  async getPublicProfileWithStats(username: string) {
    const user = await this.findByUsername(username);

    const [tripsCount, helpfulSum, viewsSum] = await Promise.all([
      this.tripRepo.count({
        where: {
          user_id: user.id,
          status: TripStatus.PUBLISHED as any,
          deleted_at: null as any,
        },
      }),
      this.tripRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.helpful_count), 0)', 'sum')
        .where('t.user_id = :uid', { uid: user.id })
        .andWhere('t.status = :s', { s: TripStatus.PUBLISHED })
        .andWhere('t.deleted_at IS NULL')
        .getRawOne<{ sum: string }>(),
      this.tripRepo
        .createQueryBuilder('t')
        .select('COALESCE(SUM(t.view_count), 0)', 'sum')
        .where('t.user_id = :uid', { uid: user.id })
        .andWhere('t.status = :s', { s: TripStatus.PUBLISHED })
        .andWhere('t.deleted_at IS NULL')
        .getRawOne<{ sum: string }>(),
    ]);

    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      bio: user.bio,
      city: user.city,
      created_at: user.created_at,
      profile_visibility: user.profile_visibility,
      stats: {
        tripsCount: Number(tripsCount) || 0,
        helpfulCount: Number(helpfulSum?.sum) || 0,
        viewsCount: Number(viewsSum?.sum) || 0,
      },
    };
  }

  /** Public list of a user's published trips. */
  async getUserPublishedTrips(username: string, limit = 12, page = 1) {
    const user = await this.findByUsername(username);
    const safeLimit = Math.min(Math.max(Number(limit) || 12, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);
    const qb = this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.departure_city', 'dep_city')
      .leftJoinAndSelect('trip.destination_city', 'dest_city')
      .where('trip.user_id = :uid', { uid: user.id })
      .andWhere('trip.status = :s', { s: TripStatus.PUBLISHED })
      .andWhere('trip.deleted_at IS NULL')
      .orderBy('trip.published_at', 'DESC')
      .loadRelationCountAndMap('trip.stops_count', 'trip.stops');

    const [items, total] = await qb
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();
    const enriched = items.map((t: any) => ({ ...t, stop_count: t.stops_count ?? 0 }));
    return { items: enriched, meta: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) } };
  }

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
