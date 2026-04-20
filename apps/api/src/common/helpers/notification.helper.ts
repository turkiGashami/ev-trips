import { DataSource } from 'typeorm';
import { Notification } from '../../entities/notification.entity';

export enum NotificationType {
  TRIP_APPROVED = 'trip_approved',
  TRIP_REJECTED = 'trip_rejected',
  TRIP_HIDDEN = 'trip_hidden',
  NEW_COMMENT = 'new_comment',
  COMMENT_REPLY = 'comment_reply',
  TRIP_FAVORITED = 'trip_favorited',
  TRIP_HELPFUL = 'trip_helpful',
  NEW_FOLLOWER = 'new_follower',
  BADGE_AWARDED = 'badge_awarded',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ADMIN_MESSAGE = 'admin_message',
  MODERATION_NOTICE = 'moderation_notice',
}

export async function createNotification(
  dataSource: DataSource,
  params: {
    userId: string;
    type: NotificationType;
    titleEn: string;
    titleAr: string;
    bodyEn?: string;
    bodyAr?: string;
    data?: Record<string, any>;
  },
): Promise<void> {
  const repo = dataSource.getRepository(Notification);
  const notification = repo.create({
    user_id: params.userId,
    type: params.type,
    title: params.titleEn,
    title_ar: params.titleAr,
    body: params.bodyEn,
    body_ar: params.bodyAr,
    data: params.data,
  });
  await repo.save(notification);
}
