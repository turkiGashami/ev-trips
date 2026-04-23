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
import { BannerStatus, PageStatus } from '../../common/enums';

@ApiTags('Public Content')
@Public()
@Controller({ path: '', version: '1' })
export class PublicContentController {
  constructor(
    @InjectRepository(Banner) private readonly bannerRepo: Repository<Banner>,
    @InjectRepository(StaticPage) private readonly pageRepo: Repository<StaticPage>,
  ) {}

  // ─── Active Banners ──────────────────────────────────────────────────────
  @Get('banners')
  @ApiOperation({ summary: 'Get active banners (public)' })
  @ApiQuery({ name: 'position', required: false, description: 'Optional position filter (currently accepted but not stored)' })
  async getActiveBanners(@Query('position') _position?: string) {
    // `position` is accepted but the column does not currently exist on the
    // Banner entity — we simply return all active, currently-valid banners
    // ordered by sort_order. The frontend can then choose which ones to
    // show in each slot.
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
  @ApiParam({ name: 'key', description: 'Page key (e.g. about, privacy, terms, faq)' })
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
}
