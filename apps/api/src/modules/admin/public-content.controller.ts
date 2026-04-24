import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Public } from '../auth/guards/jwt-auth.guard';
import { Banner } from '../../entities/banner.entity';
import { StaticPage } from '../../entities/static-page.entity';
import { User } from '../../entities/user.entity';
import { Trip } from '../../entities/trip.entity';
import { Route } from '../../entities/route.entity';
import { City } from '../../entities/city.entity';
import {
  BannerStatus,
  PageStatus,
  TripStatus,
  UserStatus,
} from '../../common/enums';

@ApiTags('Public Content')
@Public()
@Controller({ path: '', version: '1' })
export class PublicContentController {
  constructor(
    @InjectRepository(Banner) private readonly bannerRepo: Repository<Banner>,
    @InjectRepository(StaticPage) private readonly pageRepo: Repository<StaticPage>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    @InjectRepository(Trip) private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Route) private readonly routeRepo: Repository<Route>,
    @InjectRepository(City) private readonly cityRepo: Repository<City>,
  ) {}

  // ─── Active Banners ──────────────────────────────────────────────────────
  @Get('banners')
  @ApiOperation({ summary: 'Get active banners (public)' })
  @ApiQuery({ name: 'position', required: false })
  async getActiveBanners(@Query('position') _position?: string) {
    const now = new Date();
    const qb = this.bannerRepo
      .createQueryBuilder('b')
      .where('b.status = :status', { status: BannerStatus.ACTIVE })
      .andWhere('(b.starts_at IS NULL OR b.starts_at <= :now)', { now })
      .andWhere('(b.ends_at IS NULL OR b.ends_at >= :now)', { now })
      .orderBy('b.sort_order', 'ASC')
      .addOrderBy('b.created_at', 'DESC');

    const banners = await qb.getMany();
    return banners.map((b) => ({
      id: b.id,
      title: b.title,
      title_ar: b.title_ar,
      body: b.body,
      body_ar: b.body_ar,
      image_url: b.image_url,
      link_url: b.link_url,
      sort_order: b.sort_order,
    }));
  }

  // ─── Static Page by key ──────────────────────────────────────────────────
  @Get('pages/:key')
  @ApiOperation({ summary: 'Get a published static page by key (public)' })
  @ApiParam({ name: 'key' })
  async getPage(@Param('key') key: string) {
    const page = await this.pageRepo.findOne({ where: { key } });
    if (!page || page.status !== PageStatus.PUBLISHED) {
      throw new NotFoundException('Page not found');
    }
    return {
      key: page.key,
      title: page.title,
      title_ar: page.title_ar,
      content: page.content,
      content_ar: page.content_ar,
      updated_at: page.updated_at,
    };
  }

  // ─── Public platform stats ───────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Get public platform statistics' })
  async getPublicStats() {
    const [trips, routes, cities, members] = await Promise.all([
      this.tripRepo.count({
        where: { status: TripStatus.PUBLISHED as any, deleted_at: null as any },
      }),
      this.routeRepo.count({ where: { is_active: true } }),
      this.cityRepo.count({ where: { is_active: true } }),
      this.userRepo.count({
        where: { status: UserStatus.ACTIVE as any, deleted_at: null as any },
      }),
    ]);
    return { trips, routes, cities, members };
  }

  // ─── Popular routes ──────────────────────────────────────────────────────
  @Get('popular-routes')
  @ApiOperation({ summary: 'Get top routes by trip count' })
  @ApiQuery({ name: 'limit', required: false })
  async getPopularRoutes(@Query('limit') limitRaw?: string) {
    const limit = Math.min(Math.max(parseInt(limitRaw || '6', 10) || 6, 1), 24);

    // Aggregate from published trips, grouped by city pair. This avoids
    // relying on the cached `routes.trip_count` (which may drift) and
    // includes avg arrival-battery per pair.
    const rows = await this.tripRepo
      .createQueryBuilder('t')
      .leftJoin('t.departure_city', 'dep')
      .leftJoin('t.destination_city', 'dst')
      .select('t.departure_city_id', 'departure_city_id')
      .addSelect('t.destination_city_id', 'destination_city_id')
      .addSelect('dep.name_ar', 'from_ar')
      .addSelect('dep.name', 'from_en')
      .addSelect('dst.name_ar', 'to_ar')
      .addSelect('dst.name', 'to_en')
      .addSelect('COUNT(t.id)', 'trip_count')
      .addSelect('ROUND(AVG(t.arrival_battery_pct))', 'avg_arrival_battery')
      .addSelect('ROUND(AVG(t.total_distance_km))', 'avg_distance_km')
      .where('t.status = :status', { status: TripStatus.PUBLISHED })
      .andWhere('t.deleted_at IS NULL')
      .andWhere('t.departure_city_id IS NOT NULL')
      .andWhere('t.destination_city_id IS NOT NULL')
      .groupBy('t.departure_city_id')
      .addGroupBy('t.destination_city_id')
      .addGroupBy('dep.name_ar')
      .addGroupBy('dep.name')
      .addGroupBy('dst.name_ar')
      .addGroupBy('dst.name')
      .orderBy('trip_count', 'DESC')
      .limit(limit)
      .getRawMany();

    return rows.map((r: any) => ({
      from_ar: r.from_ar,
      from_en: r.from_en,
      to_ar: r.to_ar,
      to_en: r.to_en,
      trip_count: Number(r.trip_count) || 0,
      avg_arrival_battery: r.avg_arrival_battery != null ? Number(r.avg_arrival_battery) : null,
      avg_distance_km: r.avg_distance_km != null ? Number(r.avg_distance_km) : null,
    }));
  }
}
