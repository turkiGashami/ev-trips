import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserRole, UserStatus } from '../common/enums';
import { RefreshToken } from './refresh-token.entity';
import { UserVehicle } from './user-vehicle.entity';
import { Trip } from './trip.entity';
import { TripMedia } from './trip-media.entity';
import { Comment } from './comment.entity';
import { TripReaction } from './trip-reaction.entity';
import { Favorite } from './favorite.entity';
import { Follow } from './follow.entity';
import { Notification } from './notification.entity';
import { NotificationSetting } from './notification-setting.entity';
import { Report } from './report.entity';
import { UserBadge } from './user-badge.entity';
import { AdminLog } from './admin-log.entity';
import { ChargingStation } from './charging-station.entity';
import { Banner } from './banner.entity';
import { StaticPage } from './static-page.entity';
import { SystemSetting } from './system-setting.entity';
import { City } from './city.entity';

@Entity('users')
@Index(['email'])
@Index(['username'])
@Index(['status'])
@Index(['role'])
@Index(['deleted_at'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  password_hash: string;

  @Column({ type: 'varchar', length: 255 })
  full_name: string;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  avatar_url: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string | null;

  @Column({ type: 'uuid', nullable: true })
  city_id: string | null;

  @ManyToOne(() => City, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'city_id' })
  city: City | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;

  @Column({ type: 'timestamptz', nullable: true })
  email_verified_at: Date | null;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  email_verification_token: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  email_verification_token_expires_at: Date | null;

  @Exclude()
  @Column({ type: 'varchar', length: 255, nullable: true })
  password_reset_token: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  password_reset_token_expires_at: Date | null;

  @Column({ type: 'boolean', default: false })
  is_contributor_verified: boolean;

  @Column({ type: 'integer', default: 0 })
  contributor_points: number;

  @Column({ type: 'integer', default: 0 })
  total_trips: number;

  @Column({ type: 'integer', default: 0 })
  total_views: number;

  @Column({ type: 'integer', default: 0 })
  total_favorites: number;

  @Column({ type: 'varchar', length: 20, default: 'public' })
  profile_visibility: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  website_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  twitter_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  instagram_url: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  linkedin_url: string | null;

  @Column({ type: 'boolean', default: true })
  notification_email: boolean;

  @Column({ type: 'boolean', default: true })
  notification_push: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  last_login_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => RefreshToken, (token) => token.user)
  refresh_tokens: RefreshToken[];

  @OneToMany(() => UserVehicle, (vehicle) => vehicle.user)
  vehicles: UserVehicle[];

  @OneToMany(() => Trip, (trip) => trip.user)
  trips: Trip[];

  @OneToMany(() => TripMedia, (media) => media.user)
  trip_media: TripMedia[];

  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToMany(() => TripReaction, (reaction) => reaction.user)
  reactions: TripReaction[];

  @OneToMany(() => Favorite, (favorite) => favorite.user)
  favorites: Favorite[];

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Follow[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => NotificationSetting, (setting) => setting.user)
  notification_settings: NotificationSetting[];

  @OneToMany(() => Report, (report) => report.reporter)
  reports_filed: Report[];

  @OneToMany(() => Report, (report) => report.reviewed_by)
  reports_reviewed: Report[];

  @OneToMany(() => UserBadge, (ub) => ub.user)
  badges: UserBadge[];

  @OneToMany(() => UserBadge, (ub) => ub.awarded_by)
  badges_awarded: UserBadge[];

  @OneToMany(() => AdminLog, (log) => log.actor)
  admin_logs: AdminLog[];

  @OneToMany(() => ChargingStation, (station) => station.suggested_by_user)
  suggested_stations: ChargingStation[];

  @OneToMany(() => Banner, (banner) => banner.created_by)
  banners: Banner[];

  @OneToMany(() => StaticPage, (page) => page.updated_by)
  updated_pages: StaticPage[];

  @OneToMany(() => SystemSetting, (setting) => setting.updated_by)
  updated_settings: SystemSetting[];
}
