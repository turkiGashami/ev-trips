import { Injectable, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

import { City } from '../../entities/city.entity';
import { CarBrand } from '../../entities/car-brand.entity';
import { CarModel } from '../../entities/car-model.entity';
import { CarTrim } from '../../entities/car-trim.entity';
import { Badge } from '../../entities/badge.entity';

const CACHE_TTL_SECONDS = 300; // 5 minutes

@Injectable()
export class LookupService {
  private readonly logger = new Logger(LookupService.name);

  constructor(
    @InjectRepository(City)
    private readonly cityRepo: Repository<City>,
    @InjectRepository(CarBrand)
    private readonly brandRepo: Repository<CarBrand>,
    @InjectRepository(CarModel)
    private readonly modelRepo: Repository<CarModel>,
    @InjectRepository(CarTrim)
    private readonly trimRepo: Repository<CarTrim>,
    @InjectRepository(Badge)
    private readonly badgeRepo: Repository<Badge>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async getCities(search?: string): Promise<City[]> {
    const cacheKey = `lookup:cities:${search ?? 'all'}`;
    const cached = await this.cacheManager.get<City[]>(cacheKey);
    if (cached) return cached;

    const qb = this.cityRepo
      .createQueryBuilder('city')
      .where('city.is_active = true')
      .orderBy('city.name', 'ASC');

    if (search) {
      qb.andWhere('(city.name ILIKE :q OR city.name_ar ILIKE :q)', { q: `%${search}%` });
    }

    const cities = await qb.getMany();
    await this.cacheManager.set(cacheKey, cities, CACHE_TTL_SECONDS * 1000);
    return cities;
  }

  /**
   * Find a city by name (case-insensitive, Arabic or English) or create it.
   * Used when a user types a city that isn't in the suggestions list.
   */
  async findOrCreateCity(nameAr: string, nameEn?: string): Promise<City> {
    const trimmedAr = nameAr.trim();
    const trimmedEn = (nameEn || trimmedAr).trim();

    // Try to find existing (case-insensitive match on either name)
    const existing = await this.cityRepo
      .createQueryBuilder('city')
      .where('LOWER(city.name_ar) = LOWER(:nameAr)', { nameAr: trimmedAr })
      .orWhere('LOWER(city.name) = LOWER(:nameEn)', { nameEn: trimmedEn })
      .getOne();
    if (existing) return existing;

    // Generate a slug from the English name (fallback to transliteration-free)
    const baseSlug = trimmedEn
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 80) || `city-${Date.now()}`;

    let slug = baseSlug;
    let suffix = 1;
    while (await this.cityRepo.findOne({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const city = this.cityRepo.create({
      name: trimmedEn,
      name_ar: trimmedAr,
      slug,
      country: 'SA',
      is_active: true,
    });
    const saved = await this.cityRepo.save(city);

    // Bust the cities cache so new city shows up in suggestions
    await this.cacheManager.del('lookup:cities:all');
    return saved;
  }

  async getBrands(active?: boolean): Promise<CarBrand[]> {
    const cacheKey = `lookup:brands:${active ?? 'all'}`;
    const cached = await this.cacheManager.get<CarBrand[]>(cacheKey);
    if (cached) return cached;

    const qb = this.brandRepo
      .createQueryBuilder('brand')
      .orderBy('brand.name', 'ASC');

    if (active !== false) {
      qb.where('brand.is_active = true');
    }

    const brands = await qb.getMany();
    await this.cacheManager.set(cacheKey, brands, CACHE_TTL_SECONDS * 1000);
    return brands;
  }

  async getModelsByBrand(brandId: string): Promise<CarModel[]> {
    const cacheKey = `lookup:models:${brandId}`;
    const cached = await this.cacheManager.get<CarModel[]>(cacheKey);
    if (cached) return cached;

    const models = await this.modelRepo.find({
      where: { brand_id: brandId, is_active: true },
      order: { name: 'ASC' },
    });

    await this.cacheManager.set(cacheKey, models, CACHE_TTL_SECONDS * 1000);
    return models;
  }

  async getTrimsByModel(modelId: string): Promise<CarTrim[]> {
    const cacheKey = `lookup:trims:${modelId}`;
    const cached = await this.cacheManager.get<CarTrim[]>(cacheKey);
    if (cached) return cached;

    const trims = await this.trimRepo.find({
      where: { model_id: modelId, is_active: true },
      order: { name: 'ASC' },
    });

    await this.cacheManager.set(cacheKey, trims, CACHE_TTL_SECONDS * 1000);
    return trims;
  }

  async getBadges(): Promise<Badge[]> {
    const cacheKey = 'lookup:badges';
    const cached = await this.cacheManager.get<Badge[]>(cacheKey);
    if (cached) return cached;

    const badges = await this.badgeRepo.find({ order: { name: 'ASC' } });
    await this.cacheManager.set(cacheKey, badges, CACHE_TTL_SECONDS * 1000);
    return badges;
  }

  async getEnums(): Promise<Record<string, string[]>> {
    return {
      luggage_level: ['none', 'light', 'medium', 'heavy', 'full'],
      ac_usage: ['off', 'partial', 'full'],
      weather_condition: ['sunny', 'cloudy', 'rainy', 'foggy', 'windy', 'extreme_heat', 'cold', 'sandstorm'],
      driving_style: ['eco', 'calm', 'normal', 'sporty', 'aggressive'],
      drivetrain_type: ['rwd', 'fwd', 'awd', 'single_motor', 'dual_motor', 'tri_motor'],
      charger_type: ['ac_level1', 'ac_level2', 'dc_fast', 'supercharger', 'ccs', 'chademo', 'type2'],
      report_type: ['misleading_data', 'false_battery_info', 'inappropriate_media', 'spam', 'abuse', 'duplicate', 'off_topic'],
      reaction_type: ['helpful', 'not_helpful'],
    };
  }

  async invalidateCache(prefix: string): Promise<void> {
    this.logger.log(`Cache invalidation requested for prefix: ${prefix}`);
    // Pattern-based invalidation depends on Redis; individual keys are deleted on update
  }
}
