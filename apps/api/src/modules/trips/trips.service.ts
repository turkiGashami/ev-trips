import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';

import { Trip } from '../../entities/trip.entity';
import { TripStop } from '../../entities/trip-stop.entity';
import { TripMedia } from '../../entities/trip-media.entity';
import { TripReaction } from '../../entities/trip-reaction.entity';
import { Favorite } from '../../entities/favorite.entity';
import { UserVehicle } from '../../entities/user-vehicle.entity';
import { Report } from '../../entities/report.entity';
import { SystemSetting } from '../../entities/system-setting.entity';

import { TripStatus, ReactionType, ReportStatus } from '../../common/enums';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { SearchTripsDto } from './dto/search-trips.dto';
import { CreateTripStopDto } from './dto/create-trip-stop.dto';
import { PaginatedResult, PaginationMeta } from '../../common/interceptors/transform.interceptor';
import { generateSlug } from '../../common/helpers/slug.helper';

@Injectable()
export class TripsService {
  private readonly logger = new Logger(TripsService.name);

  constructor(
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(TripStop)
    private readonly stopRepo: Repository<TripStop>,
    @InjectRepository(TripMedia)
    private readonly mediaRepo: Repository<TripMedia>,
    @InjectRepository(TripReaction)
    private readonly reactionRepo: Repository<TripReaction>,
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(UserVehicle)
    private readonly vehicleRepo: Repository<UserVehicle>,
    @InjectRepository(Report)
    private readonly reportRepo: Repository<Report>,
    @InjectRepository(SystemSetting)
    private readonly settingRepo: Repository<SystemSetting>,
    private readonly dataSource: DataSource,
  ) {}

  /** Read a boolean system setting (true if value === 'true'). */
  private async getBoolSetting(key: string, defaultValue = false): Promise<boolean> {
    const row = await this.settingRepo.findOne({ where: { key } });
    if (!row) return defaultValue;
    return String(row.value).toLowerCase() === 'true';
  }

  /** Look up a city's display name (Arabic-preferred) by id. */
  private async cityNameById(id: string): Promise<string | null> {
    if (!id) return null;
    const row: { name_ar: string | null; name: string | null } | undefined =
      await this.dataSource
        .createQueryBuilder()
        .select('c.name_ar', 'name_ar')
        .addSelect('c.name', 'name')
        .from('cities', 'c')
        .where('c.id = :id', { id })
        .getRawOne();
    if (!row) return null;
    return row.name_ar || row.name || null;
  }

  // ─── CRUD ──────────────────────────────────────────────────────────────────

  async createDraft(userId: string, dto: CreateTripDto): Promise<Trip> {
    // Default the title to a route description so the public site doesn't
    // surface a placeholder like "Untitled Trip" when the user skipped the
    // title field.
    let title = dto.title?.trim();
    if (!title) {
      const [from, to] = await Promise.all([
        dto.departure_city_id
          ? this.cityNameById(dto.departure_city_id)
          : Promise.resolve<string | null>(dto.departure_city_name ?? null),
        dto.destination_city_id
          ? this.cityNameById(dto.destination_city_id)
          : Promise.resolve<string | null>(dto.destination_city_name ?? null),
      ]);
      if (from && to) title = `${from} ← ${to}`;
      else title = 'رحلة جديدة';
    }
    const slug = await this.generateUniqueSlug(title, userId);

    const trip = this.tripRepo.create({
      user_id: userId,
      vehicle_id: dto.vehicle_id ?? null,
      departure_city_id: dto.departure_city_id ?? null as any,
      destination_city_id: dto.destination_city_id ?? null as any,
      title,
      slug,
      trip_date: dto.trip_date as any,
      departure_time: dto.departure_time ?? null,
      arrival_time: dto.arrival_time ?? null,
      duration_minutes: dto.duration_minutes ?? null,
      distance_km: dto.distance_km ?? null,
      departure_battery_pct: dto.departure_battery_pct ?? 0,
      arrival_battery_pct: dto.arrival_battery_pct ?? 0,
      estimated_range_at_departure_km: dto.estimated_range_at_departure_km ?? null,
      remaining_range_at_arrival_km: dto.remaining_range_at_arrival_km ?? null,
      consumption_rate: dto.consumption_rate ?? null,
      passengers_count: dto.passengers_count ?? 1,
      luggage_level: dto.luggage_level ?? null,
      ac_usage: dto.ac_usage ?? null,
      weather_condition: dto.weather_condition ?? null,
      average_speed_kmh: dto.average_speed_kmh ?? null,
      driving_style: dto.driving_style ?? null,
      outside_temperature_c: dto.outside_temperature_c ?? null,
      wind_speed_kmh: dto.wind_speed_kmh ?? null,
      road_condition: dto.road_condition ?? null,
      route_notes: dto.route_notes ?? null,
      trip_notes: dto.trip_notes ?? null,
      status: TripStatus.DRAFT,
    });

    const saved = await this.tripRepo.save(trip);
    this.logger.log(`Trip draft created: ${saved.id} by user ${userId}`);
    return this.findFullById(saved.id);
  }

  async updateTrip(userId: string, tripId: string, dto: UpdateTripDto): Promise<Trip> {
    const trip = await this.findOwnedTrip(userId, tripId);

    if (![TripStatus.DRAFT, TripStatus.REJECTED].includes(trip.status)) {
      throw new ForbiddenException(
        'Only draft or rejected trips can be edited directly. Use the edit flow for published trips.',
      );
    }

    if (dto.title && dto.title !== trip.title) {
      trip.slug = await this.generateUniqueSlug(dto.title, userId, tripId);
    }

    Object.assign(trip, {
      vehicle_id: dto.vehicle_id !== undefined ? dto.vehicle_id : trip.vehicle_id,
      departure_city_id: dto.departure_city_id ?? trip.departure_city_id,
      destination_city_id: dto.destination_city_id ?? trip.destination_city_id,
      title: dto.title ?? trip.title,
      trip_date: dto.trip_date !== undefined ? (dto.trip_date as any) : trip.trip_date,
      departure_time: dto.departure_time !== undefined ? dto.departure_time : trip.departure_time,
      arrival_time: dto.arrival_time !== undefined ? dto.arrival_time : trip.arrival_time,
      duration_minutes: dto.duration_minutes !== undefined ? dto.duration_minutes : trip.duration_minutes,
      distance_km: dto.distance_km !== undefined ? dto.distance_km : trip.distance_km,
      departure_battery_pct: dto.departure_battery_pct !== undefined ? dto.departure_battery_pct : trip.departure_battery_pct,
      arrival_battery_pct: dto.arrival_battery_pct !== undefined ? dto.arrival_battery_pct : trip.arrival_battery_pct,
      estimated_range_at_departure_km: dto.estimated_range_at_departure_km !== undefined ? dto.estimated_range_at_departure_km : trip.estimated_range_at_departure_km,
      remaining_range_at_arrival_km: dto.remaining_range_at_arrival_km !== undefined ? dto.remaining_range_at_arrival_km : trip.remaining_range_at_arrival_km,
      consumption_rate: dto.consumption_rate !== undefined ? dto.consumption_rate : trip.consumption_rate,
      passengers_count: dto.passengers_count ?? trip.passengers_count,
      luggage_level: dto.luggage_level !== undefined ? dto.luggage_level : trip.luggage_level,
      ac_usage: dto.ac_usage !== undefined ? dto.ac_usage : trip.ac_usage,
      weather_condition: dto.weather_condition !== undefined ? dto.weather_condition : trip.weather_condition,
      average_speed_kmh: dto.average_speed_kmh !== undefined ? dto.average_speed_kmh : trip.average_speed_kmh,
      driving_style: dto.driving_style !== undefined ? dto.driving_style : trip.driving_style,
      outside_temperature_c: dto.outside_temperature_c !== undefined ? dto.outside_temperature_c : trip.outside_temperature_c,
      wind_speed_kmh: dto.wind_speed_kmh !== undefined ? dto.wind_speed_kmh : trip.wind_speed_kmh,
      road_condition: dto.road_condition !== undefined ? dto.road_condition : trip.road_condition,
      route_notes: dto.route_notes !== undefined ? dto.route_notes : trip.route_notes,
      trip_notes: dto.trip_notes !== undefined ? dto.trip_notes : trip.trip_notes,
    });

    const saved = await this.tripRepo.save(trip);
    this.logger.log(`Trip ${tripId} updated by user ${userId}`);
    return this.findFullById(saved.id);
  }

  async submitTrip(userId: string, tripId: string): Promise<Trip> {
    const trip = await this.findOwnedTrip(userId, tripId);

    if (![TripStatus.DRAFT, TripStatus.REJECTED].includes(trip.status)) {
      throw new BadRequestException('Only draft or rejected trips can be submitted for review');
    }

    this.validateRequiredFieldsForSubmit(trip);

    // Take vehicle snapshot
    if (trip.vehicle_id) {
      const vehicle = await this.vehicleRepo.findOne({
        where: { id: trip.vehicle_id },
        relations: ['brand', 'model', 'trim'],
      });

      if (vehicle) {
        trip.snap_brand_name = vehicle.brand?.name ?? null;
        trip.snap_model_name = vehicle.model?.name ?? null;
        trip.snap_trim_name = vehicle.trim?.name ?? null;
        trip.snap_year = vehicle.year;
        trip.snap_battery_capacity_kwh = vehicle.battery_capacity_kwh ?? null;
        trip.snap_drivetrain = vehicle.drivetrain ?? null;
      }
    }

    trip.submitted_at = new Date();
    trip.rejection_reason = null;

    // Auto-approve if either of the related system settings is enabled.
    const autoApprove =
      (await this.getBoolSetting('auto_approve_trips', false)) ||
      (await this.getBoolSetting('moderation_auto_approve', false));

    if (autoApprove) {
      trip.status = TripStatus.PUBLISHED;
      trip.published_at = new Date();
      trip.is_admin_reviewed = true;
    } else {
      trip.status = TripStatus.PENDING_REVIEW;
    }

    const saved = await this.tripRepo.save(trip);
    this.logger.log(
      `Trip ${tripId} ${autoApprove ? 'auto-published' : 'submitted for review'} by user ${userId}`,
    );
    return this.findFullById(saved.id);
  }

  async publishTrip(adminId: string, tripId: string): Promise<Trip> {
    const trip = await this.findById(tripId);

    if (trip.status !== TripStatus.PENDING_REVIEW) {
      throw new BadRequestException('Only pending review trips can be published');
    }

    trip.status = TripStatus.PUBLISHED;
    trip.published_at = new Date();
    trip.is_admin_reviewed = true;

    const saved = await this.tripRepo.save(trip);
    this.logger.log(`Trip ${tripId} published by admin ${adminId}`);
    return this.findFullById(saved.id);
  }

  async rejectTrip(adminId: string, tripId: string, reason: string): Promise<Trip> {
    const trip = await this.findById(tripId);

    if (trip.status !== TripStatus.PENDING_REVIEW) {
      throw new BadRequestException('Only pending review trips can be rejected');
    }

    trip.status = TripStatus.REJECTED;
    trip.rejection_reason = reason;
    trip.is_admin_reviewed = true;

    const saved = await this.tripRepo.save(trip);
    this.logger.log(`Trip ${tripId} rejected by admin ${adminId}`);
    return this.findFullById(saved.id);
  }

  async hideTrip(adminId: string, tripId: string): Promise<Trip> {
    const trip = await this.findById(tripId);
    trip.status = TripStatus.HIDDEN;

    const saved = await this.tripRepo.save(trip);
    this.logger.log(`Trip ${tripId} hidden by admin ${adminId}`);
    return this.findFullById(saved.id);
  }

  async deleteTrip(userId: string, tripId: string): Promise<{ message: string }> {
    const trip = await this.findOwnedTrip(userId, tripId);
    await this.tripRepo.update(tripId, { deleted_at: new Date() });
    this.logger.log(`Trip ${tripId} soft-deleted by user ${userId}`);
    return { message: 'Trip deleted successfully' };
  }

  async archiveTrip(userId: string, tripId: string): Promise<Trip> {
    const trip = await this.findOwnedTrip(userId, tripId);
    trip.status = TripStatus.ARCHIVED;
    const saved = await this.tripRepo.save(trip);
    this.logger.log(`Trip ${tripId} archived by user ${userId}`);
    return this.findFullById(saved.id);
  }

  async duplicateTrip(userId: string, tripId: string): Promise<Trip> {
    const original = await this.findById(tripId);

    if (original.user_id !== userId) {
      throw new ForbiddenException('You can only duplicate your own trips');
    }

    const title = `Copy of ${original.title}`;
    const slug = await this.generateUniqueSlug(title, userId);

    const newTrip = this.tripRepo.create({
      user_id: userId,
      vehicle_id: original.vehicle_id,
      departure_city_id: original.departure_city_id,
      destination_city_id: original.destination_city_id,
      title,
      slug,
      trip_date: original.trip_date,
      departure_time: original.departure_time,
      arrival_time: original.arrival_time,
      duration_minutes: original.duration_minutes,
      distance_km: original.distance_km,
      departure_battery_pct: original.departure_battery_pct,
      arrival_battery_pct: original.arrival_battery_pct,
      estimated_range_at_departure_km: original.estimated_range_at_departure_km,
      remaining_range_at_arrival_km: original.remaining_range_at_arrival_km,
      consumption_rate: original.consumption_rate,
      passengers_count: original.passengers_count,
      luggage_level: original.luggage_level,
      ac_usage: original.ac_usage,
      weather_condition: original.weather_condition,
      average_speed_kmh: original.average_speed_kmh,
      driving_style: original.driving_style,
      route_notes: original.route_notes,
      trip_notes: original.trip_notes,
      status: TripStatus.DRAFT,
    });

    const saved = await this.tripRepo.save(newTrip);
    this.logger.log(`Trip ${tripId} duplicated as ${saved.id} by user ${userId}`);
    return this.findFullById(saved.id);
  }

  async searchTrips(dto: SearchTripsDto): Promise<PaginatedResult<Trip>> {
    const page = dto.page ?? 1;
    const limit = Math.min(dto.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const validSortFields = ['published_at', 'view_count', 'helpful_count', 'favorite_count', 'trip_date'];
    const sortField = validSortFields.includes(dto.sort_by ?? '') ? dto.sort_by! : 'published_at';
    const sortOrder = dto.sort_order === 'ASC' ? 'ASC' : 'DESC';

    const qb = this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.user', 'user')
      .leftJoinAndSelect('trip.departure_city', 'dep_city')
      .leftJoinAndSelect('trip.destination_city', 'dest_city')
      .leftJoinAndSelect('trip.vehicle', 'vehicle')
      .leftJoinAndSelect('vehicle.brand', 'brand')
      .leftJoinAndSelect('vehicle.model', 'model')
      .leftJoinAndSelect('vehicle.trim', 'trim')
      .where('trip.deleted_at IS NULL')
      .andWhere('trip.status = :status', { status: TripStatus.PUBLISHED });

    if (dto.from_city_id) {
      qb.andWhere('trip.departure_city_id = :from_city_id', { from_city_id: dto.from_city_id });
    }

    if (dto.to_city_id) {
      qb.andWhere('trip.destination_city_id = :to_city_id', { to_city_id: dto.to_city_id });
    }

    if (dto.brand_id) {
      qb.andWhere('vehicle.brand_id = :brand_id', { brand_id: dto.brand_id });
    }

    if (dto.model_id) {
      qb.andWhere('vehicle.model_id = :model_id', { model_id: dto.model_id });
    }

    if (dto.trim_id) {
      qb.andWhere('vehicle.trim_id = :trim_id', { trim_id: dto.trim_id });
    }

    if (dto.year) {
      qb.andWhere('vehicle.year = :year', { year: dto.year });
    }

    if (dto.date_from) {
      qb.andWhere('trip.trip_date >= :date_from', { date_from: dto.date_from });
    }

    if (dto.date_to) {
      qb.andWhere('trip.trip_date <= :date_to', { date_to: dto.date_to });
    }

    if (dto.min_departure_battery !== undefined) {
      qb.andWhere('trip.departure_battery_pct >= :min_dep_bat', { min_dep_bat: dto.min_departure_battery });
    }

    if (dto.max_departure_battery !== undefined) {
      qb.andWhere('trip.departure_battery_pct <= :max_dep_bat', { max_dep_bat: dto.max_departure_battery });
    }

    if (dto.min_arrival_battery !== undefined) {
      qb.andWhere('trip.arrival_battery_pct >= :min_arr_bat', { min_arr_bat: dto.min_arrival_battery });
    }

    if (dto.luggage_level) {
      qb.andWhere('trip.luggage_level = :luggage_level', { luggage_level: dto.luggage_level });
    }

    if (dto.ac_usage) {
      qb.andWhere('trip.ac_usage = :ac_usage', { ac_usage: dto.ac_usage });
    }

    if (dto.weather_condition) {
      qb.andWhere('trip.weather_condition = :weather_condition', { weather_condition: dto.weather_condition });
    }

    if (dto.driving_style) {
      qb.andWhere('trip.driving_style = :driving_style', { driving_style: dto.driving_style });
    }

    if (dto.passengers_count) {
      qb.andWhere('trip.passengers_count = :passengers_count', { passengers_count: dto.passengers_count });
    }

    if (dto.is_featured !== undefined) {
      qb.andWhere('trip.is_featured = :is_featured', { is_featured: dto.is_featured });
    }

    if (dto.q) {
      // Split the query on whitespace and require each term to match
      // some searchable field. That way "الرياض دبي" matches a trip
      // whose departure_city is Riyadh and destination_city is Dubai
      // even though no single column contains both words.
      const terms = dto.q
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      terms.forEach((term, i) => {
        const param = `q${i}`;
        qb.andWhere(
          `(
            trip.title ILIKE :${param} OR
            trip.route_notes ILIKE :${param} OR
            trip.trip_notes ILIKE :${param} OR
            trip.snap_brand_name ILIKE :${param} OR
            trip.snap_model_name ILIKE :${param} OR
            trip.snap_trim_name ILIKE :${param} OR
            brand.name ILIKE :${param} OR
            brand.name_ar ILIKE :${param} OR
            model.name ILIKE :${param} OR
            trim.name ILIKE :${param} OR
            dep_city.name ILIKE :${param} OR
            dep_city.name_ar ILIKE :${param} OR
            dest_city.name ILIKE :${param} OR
            dest_city.name_ar ILIKE :${param}
          )`,
          { [param]: `%${term}%` },
        );
      });
    }

    qb.orderBy(`trip.${sortField}`, sortOrder);

    // Surface a stops_count alias so trip cards can render the correct
    // number without loading every stop row.
    qb.loadRelationCountAndMap('trip.stops_count', 'trip.stops');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    // Mirror the alias under the legacy `stop_count` name expected by
    // existing components.
    const enriched = items.map((t: any) => ({ ...t, stop_count: t.stops_count ?? 0 }));

    return {
      items: enriched as any,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyTrips(userId: string, page: number = 1, limit: number = 20): Promise<PaginatedResult<Trip>> {
    page = Number(page) || 1;
    limit = Number(limit) || 20;
    const skip = (page - 1) * limit;

    const qb = this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndSelect('trip.departure_city', 'dep_city')
      .leftJoinAndSelect('trip.destination_city', 'dest_city')
      .where('trip.user_id = :uid', { uid: userId })
      .andWhere('trip.deleted_at IS NULL')
      .orderBy('trip.created_at', 'DESC')
      .loadRelationCountAndMap('trip.stops_count', 'trip.stops');

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();
    const enriched = items.map((t: any) => ({ ...t, stop_count: t.stops_count ?? 0 }));

    return {
      items: enriched as any,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string): Promise<Trip> {
    const trip = await this.tripRepo.findOne({
      where: { slug, deleted_at: IsNull() },
      relations: [
        'user',
        'departure_city',
        'destination_city',
        'vehicle',
        'vehicle.brand',
        'vehicle.model',
        'vehicle.trim',
        'stops',
        'stops.charging_station',
        'stops.city',
        'media',
      ],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (![TripStatus.PUBLISHED, TripStatus.HIDDEN].includes(trip.status)) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async getRouteInsights(fromCityId: string, toCityId: string, filters: Record<string, any> = {}): Promise<Record<string, any>> {
    const qb = this.tripRepo
      .createQueryBuilder('trip')
      .select([
        'COUNT(trip.id)::int AS total_trips',
        'AVG(trip.departure_battery_pct)::numeric(5,2) AS avg_departure_battery',
        'AVG(trip.arrival_battery_pct)::numeric(5,2) AS avg_arrival_battery',
        'AVG(trip.distance_km)::numeric(8,2) AS avg_distance_km',
        'AVG(trip.duration_minutes)::numeric(8,2) AS avg_duration_minutes',
        'AVG(trip.consumption_rate)::numeric(6,3) AS avg_consumption_rate',
        'MIN(trip.arrival_battery_pct) AS min_arrival_battery',
        'MAX(trip.arrival_battery_pct) AS max_arrival_battery',
        'AVG(trip.average_speed_kmh)::numeric(5,1) AS avg_speed_kmh',
      ])
      .where('trip.departure_city_id = :fromCityId', { fromCityId })
      .andWhere('trip.destination_city_id = :toCityId', { toCityId })
      .andWhere('trip.status = :status', { status: TripStatus.PUBLISHED })
      .andWhere('trip.deleted_at IS NULL');

    if (filters.brand_id) {
      qb.innerJoin('trip.vehicle', 'v').andWhere('v.brand_id = :brand_id', { brand_id: filters.brand_id });
    }

    if (filters.model_id) {
      qb.andWhere('trip.vehicle.model_id = :model_id', { model_id: filters.model_id });
    }

    const result = await qb.getRawOne();
    return result ?? {};
  }

  // ─── Stops ─────────────────────────────────────────────────────────────────

  async addStop(userId: string, tripId: string, dto: CreateTripStopDto): Promise<TripStop> {
    await this.findOwnedTrip(userId, tripId);

    const stop = this.stopRepo.create({
      trip_id: tripId,
      stop_order: dto.stop_order,
      charging_station_id: dto.charging_station_id ?? null,
      station_name: dto.station_name,
      provider_name: dto.provider_name ?? null,
      charger_type: dto.charger_type ?? null,
      city_id: dto.city_id ?? null,
      latitude: dto.latitude ?? null,
      longitude: dto.longitude ?? null,
      distance_from_start_km: dto.distance_from_start_km ?? null,
      battery_before_pct: dto.battery_before_pct ?? null,
      battery_after_pct: dto.battery_after_pct ?? null,
      charging_duration_minutes: dto.charging_duration_minutes ?? null,
      charging_cost: dto.charging_cost ?? null,
      charging_cost_currency: dto.charging_cost_currency ?? 'SAR',
      arrival_time: dto.arrival_time ?? null,
      departure_time: dto.departure_time ?? null,
      was_busy: dto.was_busy ?? null,
      was_functioning_well: dto.was_functioning_well ?? null,
      chargers_available: dto.chargers_available ?? null,
      connector_power_kw: dto.connector_power_kw ?? null,
      congestion_note: dto.congestion_note ?? null,
      quality_note: dto.quality_note ?? null,
      notes: dto.notes ?? null,
    });

    return this.stopRepo.save(stop);
  }

  async updateStop(
    userId: string,
    tripId: string,
    stopId: string,
    dto: Partial<CreateTripStopDto>,
  ): Promise<TripStop> {
    await this.findOwnedTrip(userId, tripId);

    const stop = await this.stopRepo.findOne({ where: { id: stopId, trip_id: tripId } });
    if (!stop) {
      throw new NotFoundException('Stop not found');
    }

    Object.assign(stop, dto);
    return this.stopRepo.save(stop);
  }

  async deleteStop(userId: string, tripId: string, stopId: string): Promise<{ message: string }> {
    await this.findOwnedTrip(userId, tripId);

    const stop = await this.stopRepo.findOne({ where: { id: stopId, trip_id: tripId } });
    if (!stop) {
      throw new NotFoundException('Stop not found');
    }

    await this.stopRepo.remove(stop);
    return { message: 'Stop deleted successfully' };
  }

  // ─── Media ─────────────────────────────────────────────────────────────────

  async addMedia(
    userId: string,
    tripId: string,
    url: string,
    mediaType: string,
    fileSizeBytes: number,
  ): Promise<TripMedia> {
    await this.findOwnedTrip(userId, tripId);

    const maxOrder = await this.mediaRepo
      .createQueryBuilder('m')
      .where('m.trip_id = :tripId', { tripId })
      .select('MAX(m.sort_order)', 'max')
      .getRawOne();

    const sortOrder = (maxOrder?.max ?? -1) + 1;

    const media = this.mediaRepo.create({
      trip_id: tripId,
      user_id: userId,
      url,
      media_type: mediaType,
      file_size_bytes: fileSizeBytes,
      sort_order: sortOrder,
    });

    return this.mediaRepo.save(media);
  }

  async deleteMedia(userId: string, tripId: string, mediaId: string): Promise<{ message: string }> {
    await this.findOwnedTrip(userId, tripId);

    const media = await this.mediaRepo.findOne({
      where: { id: mediaId, trip_id: tripId, user_id: userId },
    });

    if (!media) {
      throw new NotFoundException('Media not found');
    }

    await this.mediaRepo.remove(media);
    return { message: 'Media deleted successfully' };
  }

  // ─── Reactions ─────────────────────────────────────────────────────────────

  async reactToTrip(userId: string, tripId: string, reactionType: ReactionType): Promise<{ message: string; reaction_type: ReactionType; helpful_count: number }> {
    const trip = await this.findPublicTrip(tripId);

    const existing = await this.reactionRepo.findOne({
      where: { trip_id: tripId, user_id: userId },
    });

    if (existing) {
      // Idempotent: re-reacting with the same type is a no-op so the
      // client can safely retry without seeing a 409 every time.
      if (existing.reaction_type === reactionType) {
        const fresh = await this.tripRepo.findOne({ where: { id: tripId } });
        return { message: 'Reaction unchanged', reaction_type: reactionType, helpful_count: fresh?.helpful_count ?? trip.helpful_count };
      }
      // Type changed: adjust counters then update the row
      if (existing.reaction_type === ReactionType.HELPFUL) {
        await this.tripRepo.decrement({ id: tripId }, 'helpful_count', 1);
      }
      existing.reaction_type = reactionType;
      await this.reactionRepo.save(existing);
    } else {
      await this.reactionRepo.save(
        this.reactionRepo.create({ trip_id: tripId, user_id: userId, reaction_type: reactionType }),
      );
    }

    if (reactionType === ReactionType.HELPFUL) {
      await this.tripRepo.increment({ id: tripId }, 'helpful_count', 1);
    }

    const fresh = await this.tripRepo.findOne({ where: { id: tripId } });
    return { message: 'Reaction recorded', reaction_type: reactionType, helpful_count: fresh?.helpful_count ?? trip.helpful_count };
  }

  /** Return the current user's reaction + favorite state for a trip. */
  async getMyTripState(userId: string, tripId: string) {
    const [reaction, favorite] = await Promise.all([
      this.reactionRepo.findOne({ where: { trip_id: tripId, user_id: userId } }),
      this.favoriteRepo.findOne({ where: { trip_id: tripId, user_id: userId } }),
    ]);
    return {
      reaction_type: reaction?.reaction_type ?? null,
      is_favorited: !!favorite,
    };
  }

  async removeReaction(userId: string, tripId: string): Promise<{ message: string; helpful_count: number }> {
    const reaction = await this.reactionRepo.findOne({
      where: { trip_id: tripId, user_id: userId },
    });

    if (!reaction) {
      // Idempotent: nothing to remove is fine.
      const trip = await this.tripRepo.findOne({ where: { id: tripId } });
      return { message: 'No reaction to remove', helpful_count: trip?.helpful_count ?? 0 };
    }

    if (reaction.reaction_type === ReactionType.HELPFUL) {
      await this.tripRepo.decrement({ id: tripId }, 'helpful_count', 1);
    }

    await this.reactionRepo.remove(reaction);
    const fresh = await this.tripRepo.findOne({ where: { id: tripId } });
    return { message: 'Reaction removed', helpful_count: fresh?.helpful_count ?? 0 };
  }

  // ─── Favorites ─────────────────────────────────────────────────────────────

  async addFavorite(userId: string, tripId: string): Promise<{ message: string }> {
    await this.findPublicTrip(tripId);

    const existing = await this.favoriteRepo.findOne({
      where: { trip_id: tripId, user_id: userId },
    });

    if (existing) {
      throw new ConflictException('Trip already in favorites');
    }

    await this.favoriteRepo.save(
      this.favoriteRepo.create({ trip_id: tripId, user_id: userId }),
    );

    await this.tripRepo.increment({ id: tripId }, 'favorite_count', 1);

    return { message: 'Trip added to favorites' };
  }

  async removeFavorite(userId: string, tripId: string): Promise<{ message: string }> {
    const favorite = await this.favoriteRepo.findOne({
      where: { trip_id: tripId, user_id: userId },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepo.remove(favorite);
    await this.tripRepo.decrement({ id: tripId }, 'favorite_count', 1);

    return { message: 'Trip removed from favorites' };
  }

  // ─── Reports ───────────────────────────────────────────────────────────────

  async reportTrip(
    userId: string,
    tripId: string,
    reportType: any,
    reason?: string,
  ): Promise<{ message: string }> {
    await this.findPublicTrip(tripId);

    const existing = await this.reportRepo.findOne({
      where: { reporter_id: userId, target_type: 'trip', target_id: tripId },
    });

    if (existing) {
      // Upsert: update existing report
      existing.type = reportType;
      existing.reason = reason ?? null;
      existing.status = ReportStatus.PENDING;
      await this.reportRepo.save(existing);
    } else {
      await this.reportRepo.save(
        this.reportRepo.create({
          reporter_id: userId,
          target_type: 'trip',
          target_id: tripId,
          type: reportType,
          reason: reason ?? null,
          status: ReportStatus.PENDING,
        }),
      );
    }

    return { message: 'Report submitted successfully' };
  }

  // ─── View Count ────────────────────────────────────────────────────────────

  async incrementViewCount(tripId: string): Promise<void> {
    await this.tripRepo.increment({ id: tripId }, 'view_count', 1);
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  async findById(tripId: string): Promise<Trip> {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId, deleted_at: IsNull() },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async findFullById(tripId: string): Promise<Trip> {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId, deleted_at: IsNull() },
      relations: [
        'departure_city',
        'destination_city',
        'vehicle',
        'vehicle.brand',
        'vehicle.model',
        'vehicle.trim',
        'stops',
        'media',
      ],
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  private async findOwnedTrip(userId: string, tripId: string): Promise<Trip> {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId, deleted_at: IsNull() },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.user_id !== userId) {
      throw new ForbiddenException('You do not have permission to modify this trip');
    }

    return trip;
  }

  private async findPublicTrip(tripId: string): Promise<Trip> {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId, deleted_at: IsNull() },
    });

    if (!trip || trip.status !== TripStatus.PUBLISHED) {
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  private validateRequiredFieldsForSubmit(trip: Trip): void {
    const missingFields: string[] = [];

    if (!trip.departure_city_id) missingFields.push('departure_city_id');
    if (!trip.destination_city_id) missingFields.push('destination_city_id');
    if (!trip.trip_date) missingFields.push('trip_date');
    if (trip.departure_battery_pct === null || trip.departure_battery_pct === undefined) {
      missingFields.push('departure_battery_pct');
    }
    if (trip.arrival_battery_pct === null || trip.arrival_battery_pct === undefined) {
      missingFields.push('arrival_battery_pct');
    }
    if (!trip.vehicle_id) missingFields.push('vehicle_id');

    if (missingFields.length > 0) {
      throw new BadRequestException(
        `Missing required fields for submission: ${missingFields.join(', ')}`,
      );
    }
  }

  private async generateUniqueSlug(title: string, userId: string, excludeId?: string): Promise<string> {
    const baseSlug = generateSlug(title);
    let slug = baseSlug;
    let counter = 0;

    while (true) {
      const qb = this.tripRepo
        .createQueryBuilder('t')
        .where('t.slug = :slug', { slug });

      if (excludeId) {
        qb.andWhere('t.id != :excludeId', { excludeId });
      }

      const existing = await qb.getOne();

      if (!existing) {
        return slug;
      }

      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }
}
