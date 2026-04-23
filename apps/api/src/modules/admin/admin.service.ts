import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { User } from '../../entities/user.entity';
import { Trip } from '../../entities/trip.entity';
import { Comment } from '../../entities/comment.entity';
import { Report } from '../../entities/report.entity';
import { AdminLog } from '../../entities/admin-log.entity';
import { ChargingStation } from '../../entities/charging-station.entity';
import { CarBrand } from '../../entities/car-brand.entity';
import { CarModel } from '../../entities/car-model.entity';
import { CarTrim } from '../../entities/car-trim.entity';
import { City } from '../../entities/city.entity';
import { StaticPage } from '../../entities/static-page.entity';
import { Banner } from '../../entities/banner.entity';
import { SystemSetting } from '../../entities/system-setting.entity';
import { Badge } from '../../entities/badge.entity';
import { UserBadge } from '../../entities/user-badge.entity';
import { Notification } from '../../entities/notification.entity';
import { paginateQuery } from '../../common/helpers/pagination.helper';
import { logAdminAction } from '../../common/helpers/admin-log.helper';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Trip) private tripRepo: Repository<Trip>,
    @InjectRepository(Comment) private commentRepo: Repository<Comment>,
    @InjectRepository(Report) private reportRepo: Repository<Report>,
    @InjectRepository(AdminLog) private logRepo: Repository<AdminLog>,
    @InjectRepository(ChargingStation) private stationRepo: Repository<ChargingStation>,
    @InjectRepository(CarBrand) private brandRepo: Repository<CarBrand>,
    @InjectRepository(CarModel) private modelRepo: Repository<CarModel>,
    @InjectRepository(CarTrim) private trimRepo: Repository<CarTrim>,
    @InjectRepository(City) private cityRepo: Repository<City>,
    @InjectRepository(StaticPage) private pageRepo: Repository<StaticPage>,
    @InjectRepository(Banner) private bannerRepo: Repository<Banner>,
    @InjectRepository(SystemSetting) private settingRepo: Repository<SystemSetting>,
    @InjectRepository(Badge) private badgeRepo: Repository<Badge>,
    @InjectRepository(UserBadge) private userBadgeRepo: Repository<UserBadge>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    private dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}

  // ── DASHBOARD STATS ──────────────────────────────────────────────────────

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      totalTrips,
      publishedTrips,
      pendingTrips,
      totalComments,
      openReports,
    ] = await Promise.all([
      this.userRepo.count({ where: { deleted_at: null as any } }),
      this.userRepo.count({ where: { status: 'active' as any, deleted_at: null as any } }),
      this.userRepo
        .createQueryBuilder('u')
        .where('u.created_at >= :today', { today })
        .andWhere('u.deleted_at IS NULL')
        .getCount(),
      this.tripRepo.count({ where: { deleted_at: null as any } }),
      this.tripRepo.count({ where: { status: 'published' as any, deleted_at: null as any } }),
      this.tripRepo.count({ where: { status: 'pending_review' as any, deleted_at: null as any } }),
      this.commentRepo.count({ where: { deleted_at: null as any } }),
      this.reportRepo.count({ where: { status: 'pending' as any } }),
    ]);

    return {
      users: { total: totalUsers, active: activeUsers, newToday: newUsersToday },
      trips: { total: totalTrips, published: publishedTrips, pending: pendingTrips },
      comments: { total: totalComments },
      reports: { open: openReports },
    };
  }

  // ── USERS ─────────────────────────────────────────────────────────────────

  async getUsers(query: {
    search?: string;
    status?: string;
    role?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.userRepo
      .createQueryBuilder('u')
      .where('u.deleted_at IS NULL');

    if (query.search) {
      qb.andWhere(
        '(u.full_name ILIKE :s OR u.email ILIKE :s OR u.username ILIKE :s)',
        { s: `%${query.search}%` },
      );
    }
    if (query.status) qb.andWhere('u.status = :status', { status: query.status });
    if (query.role) qb.andWhere('u.role = :role', { role: query.role });

    qb.orderBy('u.created_at', 'DESC');
    return paginateQuery(qb, query.page || 1, query.limit || 20);
  }

  async getUserById(id: string) {
    const user = await this.userRepo.findOne({ where: { id, deleted_at: null as any } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserStatus(actorId: string, userId: string, status: string, note?: string) {
    const user = await this.getUserById(userId);
    const oldStatus = user.status;
    (user as any).status = status;
    await this.userRepo.save(user);
    await logAdminAction(this.dataSource, {
      actorId,
      action: 'user.status_changed',
      targetType: 'user',
      targetId: userId,
      payload: { from: oldStatus, to: status, note },
    });
    return user;
  }

  async updateUserRole(actorId: string, userId: string, role: string) {
    const user = await this.getUserById(userId);
    const oldRole = user.role;
    (user as any).role = role;
    await this.userRepo.save(user);
    await logAdminAction(this.dataSource, {
      actorId,
      action: 'user.role_changed',
      targetType: 'user',
      targetId: userId,
      payload: { from: oldRole, to: role },
    });
    return user;
  }

  async awardBadge(actorId: string, userId: string, badgeId: string) {
    const [user, badge] = await Promise.all([
      this.getUserById(userId),
      this.badgeRepo.findOne({ where: { id: badgeId } }),
    ]);
    if (!badge) throw new NotFoundException('Badge not found');

    const existing = await this.userBadgeRepo.findOne({
      where: { user_id: userId, badge_id: badgeId },
    });
    if (existing) throw new BadRequestException('Badge already awarded');

    const userBadge = this.userBadgeRepo.create({
      user_id: userId,
      badge_id: badgeId,
      awarded_by_id: actorId,
    });
    await this.userBadgeRepo.save(userBadge);

    // Create notification
    const notif = this.notifRepo.create({
      user_id: userId,
      type: 'badge_awarded' as any,
      title: `Badge Awarded: ${badge.name}`,
      title_ar: `حصلت على وسام: ${badge.name_ar || badge.name}`,
      data: { badgeId: badge.id, badgeName: badge.name },
    });
    await this.notifRepo.save(notif);

    await logAdminAction(this.dataSource, {
      actorId,
      action: 'user.badge_awarded',
      targetType: 'user',
      targetId: userId,
      payload: { badgeId, badgeName: badge.name },
    });

    return userBadge;
  }

  // ── TRIPS ─────────────────────────────────────────────────────────────────

  async getTrips(query: {
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const qb = this.tripRepo
      .createQueryBuilder('t')
      .leftJoinAndSelect('t.departure_city', 'dc')
      .leftJoinAndSelect('t.destination_city', 'dest')
      .leftJoinAndSelect('t.user', 'u')
      .where('t.deleted_at IS NULL');

    if (query.status) {
      const statusMap: Record<string, string> = {
        pending: 'pending_review',
        approved: 'published',
      };
      const mapped = statusMap[query.status] ?? query.status;
      qb.andWhere('t.status = :status', { status: mapped });
    }
    if (query.search) {
      qb.andWhere('(t.title ILIKE :s OR u.username ILIKE :s)', { s: `%${query.search}%` });
    }

    qb.orderBy('t.created_at', 'DESC');
    return paginateQuery(qb, query.page || 1, query.limit || 20);
  }

  async getPendingTrips() {
    return this.tripRepo.find({
      where: { status: 'pending_review' as any, deleted_at: null as any },
      relations: ['user', 'departure_city', 'destination_city'],
      order: { submitted_at: 'ASC' },
    });
  }

  async approveTrip(actorId: string, tripId: string) {
    const trip = await this.tripRepo.findOne({ where: { id: tripId }, relations: ['user'] });
    if (!trip) throw new NotFoundException('Trip not found');

    trip.status = 'published' as any;
    trip.is_admin_reviewed = true;
    trip.published_at = new Date();
    await this.tripRepo.save(trip);

    try {
      const notif = this.notifRepo.create({
        user_id: trip.user_id,
        type: 'trip_approved' as any,
        title: 'Trip Approved',
        title_ar: 'تمت الموافقة على رحلتك',
        data: { tripId: trip.id, tripTitle: trip.title },
      });
      await this.notifRepo.save(notif);
    } catch (err: any) {
      this.logger.error(`Approve notif failed: ${err.message}`);
    }

    try {
      await logAdminAction(this.dataSource, {
        actorId,
        action: 'trip.approved',
        targetType: 'trip',
        targetId: tripId,
      });
    } catch (err: any) {
      this.logger.error(`Approve log failed: ${err.message}`);
    }

    if (trip.user?.email) {
      this.mailService.sendTripApprovedEmail(
        trip.user.email,
        trip.user.full_name,
        trip.title,
        trip.slug,
      ).catch((err) => this.logger.error(`Trip approved email failed: ${err.message}`));
    }

    return trip;
  }

  async rejectTrip(actorId: string, tripId: string, reason: string) {
    const trip = await this.tripRepo.findOne({ where: { id: tripId }, relations: ['user'] });
    if (!trip) throw new NotFoundException('Trip not found');

    trip.status = 'rejected' as any;
    trip.rejection_reason = reason;
    trip.is_admin_reviewed = true;
    await this.tripRepo.save(trip);

    try {
      const notif = this.notifRepo.create({
        user_id: trip.user_id,
        type: 'trip_rejected' as any,
        title: 'Trip Rejected',
        title_ar: 'تم رفض رحلتك',
        body: reason,
        body_ar: reason,
        data: { tripId: trip.id, reason },
      });
      await this.notifRepo.save(notif);
    } catch (err: any) {
      this.logger.error(`Reject notif failed: ${err.message}`);
    }

    try {
      await logAdminAction(this.dataSource, {
        actorId,
        action: 'trip.rejected',
        targetType: 'trip',
        targetId: tripId,
        payload: { reason },
      });
    } catch (err: any) {
      this.logger.error(`Reject log failed: ${err.message}`);
    }

    if (trip.user?.email) {
      this.mailService.sendTripRejectedEmail(
        trip.user.email,
        trip.user.full_name,
        trip.title,
        reason,
      ).catch((err) => this.logger.error(`Trip rejected email failed: ${err.message}`));
    }

    return trip;
  }

  async hideTrip(actorId: string, tripId: string) {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    trip.status = 'hidden' as any;
    await this.tripRepo.save(trip);

    await logAdminAction(this.dataSource, {
      actorId,
      action: 'trip.hidden',
      targetType: 'trip',
      targetId: tripId,
    });

    return trip;
  }

  async featureTrip(actorId: string, tripId: string, featured: boolean) {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    trip.is_featured = featured;
    await this.tripRepo.save(trip);

    await logAdminAction(this.dataSource, {
      actorId,
      action: featured ? 'trip.featured' : 'trip.unfeatured',
      targetType: 'trip',
      targetId: tripId,
    });

    return trip;
  }

  // ── COMMENTS ──────────────────────────────────────────────────────────────

  async getComments(query: { status?: string; page?: number; limit?: number }) {
    const qb = this.commentRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.user', 'u')
      .leftJoinAndSelect('c.trip', 't')
      .where('c.deleted_at IS NULL');

    if (query.status) qb.andWhere('c.status = :status', { status: query.status });

    qb.orderBy('c.created_at', 'DESC');
    return paginateQuery(qb, query.page || 1, query.limit || 20);
  }

  async hideComment(actorId: string, commentId: string) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    comment.status = 'hidden' as any;
    await this.commentRepo.save(comment);

    await logAdminAction(this.dataSource, {
      actorId,
      action: 'comment.hidden',
      targetType: 'comment',
      targetId: commentId,
    });

    return comment;
  }

  async restoreComment(actorId: string, commentId: string) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    comment.status = 'visible' as any;
    await this.commentRepo.save(comment);

    await logAdminAction(this.dataSource, {
      actorId,
      action: 'comment.restored',
      targetType: 'comment',
      targetId: commentId,
    });

    return comment;
  }

  async deleteComment(actorId: string, commentId: string) {
    const comment = await this.commentRepo.findOne({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    await this.commentRepo.remove(comment);

    await logAdminAction(this.dataSource, {
      actorId,
      action: 'comment.deleted',
      targetType: 'comment',
      targetId: commentId,
    });

    return { id: commentId, deleted: true };
  }

  // ── REPORTS ───────────────────────────────────────────────────────────────

  async getReports(query: { status?: string; page?: number; limit?: number }) {
    const qb = this.reportRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.reporter', 'reporter')
      .orderBy('r.created_at', 'DESC');

    if (query.status) qb.where('r.status = :status', { status: query.status });

    return paginateQuery(qb, query.page || 1, query.limit || 20);
  }

  async updateReport(
    actorId: string,
    reportId: string,
    status: string,
    adminNotes?: string,
  ) {
    const report = await this.reportRepo.findOne({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    report.status = status as any;
    if (adminNotes) report.admin_notes = adminNotes;
    report.reviewed_by_id = actorId;
    report.reviewed_at = new Date();
    await this.reportRepo.save(report);

    await logAdminAction(this.dataSource, {
      actorId,
      action: 'report.updated',
      targetType: 'report',
      targetId: reportId,
      payload: { status, adminNotes },
    });

    return report;
  }

  // ── LOOKUP MANAGEMENT ────────────────────────────────────────────────────

  async getBrands() {
    return this.brandRepo.find({ order: { name: 'ASC' } });
  }

  async createBrand(actorId: string, dto: { name: string; name_ar?: string; slug: string }) {
    const brand = this.brandRepo.create(dto);
    await this.brandRepo.save(brand);
    await logAdminAction(this.dataSource, { actorId, action: 'brand.created', targetType: 'car_brand', targetId: brand.id, payload: dto });
    return brand;
  }

  async updateBrand(actorId: string, id: string, dto: Partial<{ name: string; name_ar: string; is_active: boolean }>) {
    const brand = await this.brandRepo.findOne({ where: { id } });
    if (!brand) throw new NotFoundException('Brand not found');
    Object.assign(brand, dto);
    await this.brandRepo.save(brand);
    await logAdminAction(this.dataSource, { actorId, action: 'brand.updated', targetType: 'car_brand', targetId: id, payload: dto });
    return brand;
  }

  async deleteBrand(actorId: string, id: string) {
    await this.brandRepo.update(id, { is_active: false });
    await logAdminAction(this.dataSource, { actorId, action: 'brand.deleted', targetType: 'car_brand', targetId: id });
  }

  async getModels(brandId?: string) {
    const qb = this.modelRepo.createQueryBuilder('m').leftJoinAndSelect('m.brand', 'b');
    if (brandId) qb.where('m.brand_id = :brandId', { brandId });
    return qb.orderBy('m.name', 'ASC').getMany();
  }

  async createModel(actorId: string, dto: { brand_id: string; name: string; name_ar?: string; slug: string }) {
    const model = this.modelRepo.create(dto);
    await this.modelRepo.save(model);
    await logAdminAction(this.dataSource, { actorId, action: 'model.created', targetType: 'car_model', targetId: model.id, payload: dto });
    return model;
  }

  async deleteModel(actorId: string, id: string) {
    const model = await this.modelRepo.findOne({ where: { id } });
    if (!model) throw new NotFoundException('Model not found');
    await this.modelRepo.remove(model);
    await logAdminAction(this.dataSource, { actorId, action: 'model.deleted', targetType: 'car_model', targetId: id });
    return { id, deleted: true };
  }

  async getTrims(modelId?: string) {
    const qb = this.trimRepo.createQueryBuilder('t').leftJoinAndSelect('t.model', 'm');
    if (modelId) qb.where('t.model_id = :modelId', { modelId });
    return qb.orderBy('t.name', 'ASC').getMany();
  }

  async createTrim(actorId: string, dto: { model_id: string; name: string; name_ar?: string; battery_capacity_kwh?: number }) {
    const trim = this.trimRepo.create(dto);
    await this.trimRepo.save(trim);
    await logAdminAction(this.dataSource, { actorId, action: 'trim.created', targetType: 'car_trim', targetId: trim.id, payload: dto });
    return trim;
  }

  async getCities() {
    return this.cityRepo.find({ order: { name: 'ASC' } });
  }

  async createCity(actorId: string, dto: { name: string; name_ar?: string; slug: string; country?: string; latitude?: number; longitude?: number }) {
    const city = this.cityRepo.create(dto);
    await this.cityRepo.save(city);
    await logAdminAction(this.dataSource, { actorId, action: 'city.created', targetType: 'city', targetId: city.id, payload: dto });
    return city;
  }

  async updateCity(actorId: string, id: string, dto: any) {
    const city = await this.cityRepo.findOne({ where: { id } });
    if (!city) throw new NotFoundException('City not found');
    Object.assign(city, dto);
    await this.cityRepo.save(city);
    await logAdminAction(this.dataSource, { actorId, action: 'city.updated', targetType: 'city', targetId: id, payload: dto });
    return city;
  }

  // ── CHARGING STATIONS ────────────────────────────────────────────────────

  async listStations(query: { search?: string; cityId?: string; page?: number; limit?: number }) {
    const qb = this.stationRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.city', 'c')
      .orderBy('s.created_at', 'DESC');

    if (query.search) {
      qb.andWhere('(s.name ILIKE :s OR s.name_ar ILIKE :s OR s.provider ILIKE :s)', {
        s: `%${query.search}%`,
      });
    }
    if (query.cityId) qb.andWhere('s.city_id = :cityId', { cityId: query.cityId });

    return paginateQuery(qb, query.page || 1, query.limit || 20);
  }

  async getStation(id: string) {
    const station = await this.stationRepo.findOne({ where: { id }, relations: ['city'] });
    if (!station) throw new NotFoundException('Charging station not found');
    return station;
  }

  async createStation(actorId: string, dto: any) {
    const station = this.stationRepo.create(dto as any);
    await this.stationRepo.save(station as any);
    await logAdminAction(this.dataSource, {
      actorId,
      action: 'station.created',
      targetType: 'charging_station',
      targetId: (station as any).id,
      payload: dto,
    });
    return station;
  }

  async updateStation(actorId: string, id: string, dto: any) {
    const station = await this.getStation(id);
    Object.assign(station, dto);
    await this.stationRepo.save(station);
    await logAdminAction(this.dataSource, {
      actorId,
      action: 'station.updated',
      targetType: 'charging_station',
      targetId: id,
      payload: dto,
    });
    return station;
  }

  async deleteStation(actorId: string, id: string) {
    const station = await this.getStation(id);
    await this.stationRepo.remove(station);
    await logAdminAction(this.dataSource, {
      actorId,
      action: 'station.deleted',
      targetType: 'charging_station',
      targetId: id,
    });
  }

  async toggleStationActive(actorId: string, id: string) {
    const station = await this.getStation(id);
    station.is_active = !station.is_active;
    await this.stationRepo.save(station);
    await logAdminAction(this.dataSource, {
      actorId,
      action: station.is_active ? 'station.activated' : 'station.deactivated',
      targetType: 'charging_station',
      targetId: id,
    });
    return station;
  }

  // ── STATIC PAGES ─────────────────────────────────────────────────────────

  async getStaticPages() {
    return this.pageRepo.find({ order: { key: 'ASC' } });
  }

  async updateStaticPage(
    actorId: string,
    key: string,
    dto: { title?: string; title_ar?: string; content?: string; content_ar?: string; status?: 'draft' | 'published' | string },
  ) {
    // Whitelist only columns that exist on the StaticPage entity so a rogue
    // admin payload cannot write arbitrary fields.
    const allowed: Record<string, unknown> = {};
    if (dto.title !== undefined) allowed.title = dto.title;
    if (dto.title_ar !== undefined) allowed.title_ar = dto.title_ar;
    if (dto.content !== undefined) allowed.content = dto.content;
    if (dto.content_ar !== undefined) allowed.content_ar = dto.content_ar;
    if (dto.status !== undefined) allowed.status = dto.status;

    let page: StaticPage | null = await this.pageRepo.findOne({ where: { key } });
    if (!page) {
      page = this.pageRepo.create({ key, ...allowed } as Partial<StaticPage>);
    } else {
      Object.assign(page, allowed);
    }
    page.updated_by_id = actorId;
    await this.pageRepo.save(page as StaticPage);
    await logAdminAction(this.dataSource, { actorId, action: 'page.updated', targetType: 'static_page', payload: { key, status: allowed.status } });
    return page;
  }

  // ── BANNERS ───────────────────────────────────────────────────────────────

  async getBanners() {
    return this.bannerRepo.find({ order: { sort_order: 'ASC', created_at: 'DESC' } });
  }

  async createBanner(actorId: string, dto: any) {
    const banner = this.bannerRepo.create({ ...dto, created_by_id: actorId } as any);
    await this.bannerRepo.save(banner as any);
    await logAdminAction(this.dataSource, { actorId, action: 'banner.created', targetType: 'banner', targetId: (banner as any).id });
    return banner;
  }

  async updateBanner(actorId: string, id: string, dto: any) {
    const banner = await this.bannerRepo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    Object.assign(banner, dto);
    await this.bannerRepo.save(banner);
    await logAdminAction(this.dataSource, { actorId, action: 'banner.updated', targetType: 'banner', targetId: id });
    return banner;
  }

  async deleteBanner(actorId: string, id: string) {
    await this.bannerRepo.delete(id);
    await logAdminAction(this.dataSource, { actorId, action: 'banner.deleted', targetType: 'banner', targetId: id });
  }

  // ── SETTINGS ─────────────────────────────────────────────────────────────

  async getSettings() {
    return this.settingRepo.find({ order: { key: 'ASC' } });
  }

  async updateSetting(actorId: string, key: string, value: string) {
    let setting = await this.settingRepo.findOne({ where: { key } });
    if (!setting) {
      setting = this.settingRepo.create({ key, value });
    } else {
      setting.value = value;
    }
    setting.updated_by_id = actorId;
    await this.settingRepo.save(setting);
    await logAdminAction(this.dataSource, { actorId, action: 'setting.updated', payload: { key, value } });
    return setting;
  }

  // ── ADMIN LOGS ────────────────────────────────────────────────────────────

  async getAdminLogs(query: { actorId?: string; action?: string; page?: number; limit?: number }) {
    const qb = this.logRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.actor', 'actor')
      .orderBy('l.created_at', 'DESC');

    if (query.actorId) qb.where('l.actor_id = :actorId', { actorId: query.actorId });
    if (query.action) qb.andWhere('l.action ILIKE :action', { action: `%${query.action}%` });

    return paginateQuery(qb, query.page || 1, query.limit || 50);
  }
}
