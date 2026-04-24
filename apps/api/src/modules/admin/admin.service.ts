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
import { Faq } from '../../entities/faq.entity';
import { ContactMessage } from '../../entities/contact-message.entity';
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
    @InjectRepository(Faq) private faqRepo: Repository<Faq>,
    @InjectRepository(ContactMessage) private contactRepo: Repository<ContactMessage>,
    private dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}

  // ── DASHBOARD STATS ──────────────────────────────────────────────────────

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      usersLastMonth,
      usersPrevMonth,
      totalTrips,
      publishedTrips,
      pendingTrips,
      tripsToday,
      tripsYesterday,
      totalComments,
      openReports,
      totalStations,
    ] = await Promise.all([
      this.userRepo.count({ where: { deleted_at: null as any } }),
      this.userRepo.count({ where: { status: 'active' as any, deleted_at: null as any } }),
      this.userRepo
        .createQueryBuilder('u')
        .where('u.created_at >= :today', { today })
        .andWhere('u.deleted_at IS NULL')
        .getCount(),
      this.userRepo
        .createQueryBuilder('u')
        .where('u.created_at >= :monthAgo', { monthAgo })
        .andWhere('u.deleted_at IS NULL')
        .getCount(),
      this.userRepo
        .createQueryBuilder('u')
        .where('u.created_at >= :twoMonthsAgo', { twoMonthsAgo })
        .andWhere('u.created_at < :monthAgo', { monthAgo })
        .andWhere('u.deleted_at IS NULL')
        .getCount(),
      this.tripRepo.count({ where: { deleted_at: null as any } }),
      this.tripRepo.count({ where: { status: 'published' as any, deleted_at: null as any } }),
      this.tripRepo.count({ where: { status: 'pending_review' as any, deleted_at: null as any } }),
      this.tripRepo
        .createQueryBuilder('t')
        .where('t.created_at >= :today', { today })
        .andWhere('t.deleted_at IS NULL')
        .getCount(),
      this.tripRepo
        .createQueryBuilder('t')
        .where('t.created_at >= :yesterday', { yesterday })
        .andWhere('t.created_at < :today', { today })
        .andWhere('t.deleted_at IS NULL')
        .getCount(),
      this.commentRepo.count({ where: { deleted_at: null as any } }),
      this.reportRepo.count({ where: { status: 'pending' as any } }),
      this.stationRepo.count(),
    ]);

    const pct = (curr: number, prev: number): number | null => {
      if (prev === 0) return curr > 0 ? 100 : null;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
        growthPercent: pct(usersLastMonth, usersPrevMonth),
      },
      trips: {
        total: totalTrips,
        published: publishedTrips,
        pending: pendingTrips,
        today: tripsToday,
        todayGrowthPercent: pct(tripsToday, tripsYesterday),
      },
      comments: { total: totalComments },
      reports: { open: openReports },
      stations: { total: totalStations },
    };
  }

  // ── GROWTH (time series) ─────────────────────────────────────────────────

  async getGrowth(days = 30) {
    const clamped = Math.min(Math.max(days, 7), 365);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (clamped - 1));

    const usersRaw = await this.userRepo
      .createQueryBuilder('u')
      .select("DATE(u.created_at)", 'date')
      .addSelect('COUNT(u.id)', 'count')
      .where('u.created_at >= :start', { start })
      .andWhere('u.deleted_at IS NULL')
      .groupBy("DATE(u.created_at)")
      .getRawMany();

    const tripsRaw = await this.tripRepo
      .createQueryBuilder('t')
      .select("DATE(t.created_at)", 'date')
      .addSelect('COUNT(t.id)', 'count')
      .where('t.created_at >= :start', { start })
      .andWhere('t.deleted_at IS NULL')
      .groupBy("DATE(t.created_at)")
      .getRawMany();

    const usersMap = new Map<string, number>();
    for (const r of usersRaw) {
      const key = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().slice(0, 10);
      usersMap.set(key, Number(r.count) || 0);
    }
    const tripsMap = new Map<string, number>();
    for (const r of tripsRaw) {
      const key = typeof r.date === 'string' ? r.date : new Date(r.date).toISOString().slice(0, 10);
      tripsMap.set(key, Number(r.count) || 0);
    }

    const out: { date: string; users: number; trips: number }[] = [];
    for (let i = 0; i < clamped; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      out.push({
        date: key,
        users: usersMap.get(key) ?? 0,
        trips: tripsMap.get(key) ?? 0,
      });
    }
    return out;
  }

  // ── POPULAR ROUTES (for admin dashboard) ────────────────────────────────

  async getPopularRoutes(limit = 5) {
    const clamped = Math.min(Math.max(limit, 1), 24);
    const rows = await this.tripRepo
      .createQueryBuilder('t')
      .leftJoin('t.departure_city', 'dep')
      .leftJoin('t.destination_city', 'dst')
      .select('dep.name_ar', 'from_ar')
      .addSelect('dep.name', 'from_en')
      .addSelect('dst.name_ar', 'to_ar')
      .addSelect('dst.name', 'to_en')
      .addSelect('COUNT(t.id)', 'trip_count')
      .addSelect('ROUND(AVG(t.arrival_battery_pct))', 'avg_arrival_battery')
      .where('t.status = :status', { status: 'published' })
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
      .limit(clamped)
      .getRawMany();

    return rows.map((r: any) => ({
      from_ar: r.from_ar,
      from_en: r.from_en,
      to_ar: r.to_ar,
      to_en: r.to_en,
      trip_count: Number(r.trip_count) || 0,
      avg_arrival_battery: r.avg_arrival_battery != null ? Number(r.avg_arrival_battery) : null,
    }));
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

  async removeBadge(actorId: string, userId: string, badgeKey: string) {
    const badge = await this.badgeRepo.findOne({ where: { key: badgeKey } });
    if (!badge) throw new NotFoundException('Badge not found');

    const userBadge = await this.userBadgeRepo.findOne({
      where: { user_id: userId, badge_id: badge.id },
    });
    if (!userBadge) throw new NotFoundException('User does not have this badge');

    await this.userBadgeRepo.remove(userBadge);

    await logAdminAction(this.dataSource, {
      actorId,
      action: 'user.badge_removed',
      targetType: 'user',
      targetId: userId,
      payload: { badgeKey, badgeId: badge.id },
    });

    return { userId, badgeKey, removed: true };
  }

  async verifyUser(actorId: string, userId: string) {
    const user = await this.getUserById(userId);
    user.email_verified_at = new Date();
    await this.userRepo.save(user);
    await logAdminAction(this.dataSource, {
      actorId,
      action: 'user.email_verified',
      targetType: 'user',
      targetId: userId,
    });
    return user;
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

  async deleteTrip(actorId: string, tripId: string) {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');

    await this.dataSource.transaction(async (manager) => {
      // Manual soft-delete: trip entity has a plain `deleted_at` column (not
      // @DeleteDateColumn), so we set it explicitly and also mark archived.
      await manager
        .getRepository(Trip)
        .update(tripId, { deleted_at: new Date(), status: 'archived' as any });
    });

    await logAdminAction(this.dataSource, {
      actorId,
      action: 'trip.deleted',
      targetType: 'trip',
      targetId: tripId,
    });

    return { id: tripId, deleted: true };
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

  async getStaticPage(key: string) {
    const page = await this.pageRepo.findOne({ where: { key } });
    if (!page) throw new NotFoundException('Page not found');
    return page;
  }

  async createStaticPage(
    actorId: string,
    dto: {
      key: string;
      title: string;
      title_ar?: string;
      content?: string;
      content_ar?: string;
      status?: string;
    },
  ) {
    const key = (dto.key || '').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!key || key.length < 2) {
      throw new BadRequestException('key must be 2+ chars, lowercase alphanumeric/underscore/dash');
    }
    if (!dto.title || dto.title.trim().length < 2) {
      throw new BadRequestException('title is required');
    }
    const existing = await this.pageRepo.findOne({ where: { key } });
    if (existing) {
      throw new BadRequestException(`A page with key "${key}" already exists`);
    }
    const page = this.pageRepo.create({
      key,
      title: dto.title.trim(),
      title_ar: dto.title_ar?.trim() ?? null,
      content: dto.content ?? '',
      content_ar: dto.content_ar ?? null,
      status: (dto.status as any) ?? 'draft',
      updated_by_id: actorId,
    } as Partial<StaticPage>);
    await this.pageRepo.save(page as StaticPage);
    await logAdminAction(this.dataSource, {
      actorId,
      action: 'page.created',
      targetType: 'static_page',
      payload: { key },
    });
    return page;
  }

  async deleteStaticPage(actorId: string, key: string) {
    const page = await this.pageRepo.findOne({ where: { key } });
    if (!page) throw new NotFoundException('Page not found');
    await this.pageRepo.remove(page);
    await logAdminAction(this.dataSource, {
      actorId,
      action: 'page.deleted',
      targetType: 'static_page',
      payload: { key },
    });
    return { deleted: true };
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

  // ── FAQ ──────────────────────────────────────────────────────────────────

  async getFaqs() {
    return this.faqRepo.find({ order: { sort_order: 'ASC', created_at: 'ASC' } });
  }

  async createFaq(actorId: string, dto: any) {
    if (!dto?.question_ar || !dto?.answer_ar) {
      throw new BadRequestException('question_ar and answer_ar are required');
    }
    const faq = this.faqRepo.create({
      question_ar: dto.question_ar,
      question_en: dto.question_en ?? null,
      answer_ar: dto.answer_ar,
      answer_en: dto.answer_en ?? null,
      sort_order: typeof dto.sort_order === 'number' ? dto.sort_order : 0,
      is_published: dto.is_published !== false,
    });
    await this.faqRepo.save(faq);
    await logAdminAction(this.dataSource, { actorId, action: 'faq.created', targetType: 'faq', targetId: faq.id });
    return faq;
  }

  async updateFaq(actorId: string, id: string, dto: any) {
    const faq = await this.faqRepo.findOne({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ not found');
    const allowed: Record<string, unknown> = {};
    ['question_ar', 'question_en', 'answer_ar', 'answer_en', 'sort_order', 'is_published'].forEach((k) => {
      if (dto[k] !== undefined) allowed[k] = dto[k];
    });
    Object.assign(faq, allowed);
    await this.faqRepo.save(faq);
    await logAdminAction(this.dataSource, { actorId, action: 'faq.updated', targetType: 'faq', targetId: id });
    return faq;
  }

  async deleteFaq(actorId: string, id: string) {
    const faq = await this.faqRepo.findOne({ where: { id } });
    if (!faq) throw new NotFoundException('FAQ not found');
    await this.faqRepo.delete({ id });
    await logAdminAction(this.dataSource, { actorId, action: 'faq.deleted', targetType: 'faq', targetId: id });
    return { success: true };
  }

  // ── CONTACT MESSAGES ─────────────────────────────────────────────────────

  async getContactMessages(query: { page?: number; limit?: number; status?: string } = {}) {
    const qb = this.contactRepo.createQueryBuilder('m').orderBy('m.created_at', 'DESC');
    if (query.status) qb.andWhere('m.status = :status', { status: query.status });
    return paginateQuery(qb, Number(query.page) || 1, Number(query.limit) || 20);
  }

  async updateContactMessage(actorId: string, id: string, dto: { status?: string }) {
    const msg = await this.contactRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException('Message not found');
    if (dto.status) msg.status = dto.status as any;
    await this.contactRepo.save(msg);
    await logAdminAction(this.dataSource, { actorId, action: 'contact.updated', targetType: 'contact_message', targetId: id, payload: { status: dto.status } });
    return msg;
  }

  async deleteContactMessage(actorId: string, id: string) {
    const msg = await this.contactRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException('Message not found');
    await this.contactRepo.delete({ id });
    await logAdminAction(this.dataSource, { actorId, action: 'contact.deleted', targetType: 'contact_message', targetId: id });
    return { success: true };
  }

  async replyContactMessage(actorId: string, id: string, reply: string) {
    const text = String(reply ?? '').trim();
    if (text.length < 2) throw new BadRequestException('Reply is too short');
    const msg = await this.contactRepo.findOne({ where: { id } });
    if (!msg) throw new NotFoundException('Message not found');
    msg.admin_reply = text;
    msg.replied_at = new Date();
    msg.replied_by_id = actorId;
    msg.status = 'handled';
    await this.contactRepo.save(msg);
    await this.mailService.sendContactReply(msg.email, msg.name, msg.message, text);
    await logAdminAction(this.dataSource, { actorId, action: 'contact.replied', targetType: 'contact_message', targetId: id });
    return msg;
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
