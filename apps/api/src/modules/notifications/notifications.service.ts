import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Notification } from '../../entities/notification.entity';
import { NotificationSetting } from '../../entities/notification-setting.entity';
import { NotificationType } from '../../common/enums';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { PaginatedResult } from '../../common/interceptors/transform.interceptor';
import { paginateQuery } from '../../common/helpers/pagination.helper';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(NotificationSetting)
    private readonly settingRepo: Repository<NotificationSetting>,
    private readonly configService: ConfigService,
  ) {}

  async createNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, any>,
    title?: string,
    body?: string,
    titleAr?: string,
    bodyAr?: string,
  ): Promise<Notification> {
    const notification = this.notificationRepo.create({
      user_id: userId,
      type,
      title: title ?? null,
      title_ar: titleAr ?? null,
      body: body ?? null,
      body_ar: bodyAr ?? null,
      data,
      is_read: false,
    });

    const saved = await this.notificationRepo.save(notification);
    this.logger.log(`Notification created for user ${userId}: ${type}`);

    // Optionally trigger push notification
    try {
      const settings = await this.getSettings(userId);
      if (settings.push_notifications && title && body) {
        await this.sendPushNotification(userId, title, body, data);
      }
    } catch (err) {
      this.logger.warn(`Failed to send push notification to user ${userId}: ${err.message}`);
    }

    return saved;
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<Notification>> {
    const qb = this.notificationRepo
      .createQueryBuilder('notif')
      .where('notif.user_id = :userId', { userId })
      .orderBy('notif.created_at', 'DESC');

    return paginateQuery(qb, page, limit);
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, user_id: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.is_read = true;
    notification.read_at = new Date();

    return this.notificationRepo.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ message: string }> {
    await this.notificationRepo
      .createQueryBuilder()
      .update(Notification)
      .set({ is_read: true, read_at: new Date() })
      .where('user_id = :userId AND is_read = false', { userId })
      .execute();

    return { message: 'All notifications marked as read' };
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepo.count({
      where: { user_id: userId, is_read: false },
    });
    return { count };
  }

  async getSettings(userId: string): Promise<NotificationSetting> {
    let settings = await this.settingRepo.findOne({ where: { user_id: userId } });

    if (!settings) {
      // Create default settings
      settings = this.settingRepo.create({
        user_id: userId,
        comments: true,
        replies: true,
        favorites: true,
        helpful_reactions: true,
        follows: true,
        system_updates: true,
        email_notifications: true,
        push_notifications: true,
      });
      settings = await this.settingRepo.save(settings);
    }

    return settings;
  }

  async updateSettings(
    userId: string,
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSetting> {
    const settings = await this.getSettings(userId);
    Object.assign(settings, dto);
    return this.settingRepo.save(settings);
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data: Record<string, any> = {},
  ): Promise<void> {
    // In production, retrieve user's Expo push token from DB and use Expo push API
    // This is a best-effort async call; failures are logged but not thrown
    try {
      this.logger.log(`Push notification queued for user ${userId}: ${title}`);
      // Example Expo push call (requires expo-server-sdk or direct HTTP):
      // const expoToken = await getUserPushToken(userId);
      // if (expoToken) {
      //   await fetch('https://exp.host/--/api/v2/push/send', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify({ to: expoToken, title, body, data }),
      //   });
      // }
    } catch (err) {
      this.logger.error(`Push notification failed for user ${userId}`, err);
    }
  }
}
