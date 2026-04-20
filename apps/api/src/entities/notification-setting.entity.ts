import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('notification_settings')
@Index(['user_id'], { unique: true })
export class NotificationSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  user_id: string;

  @ManyToOne(() => User, (user) => user.notification_settings, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'boolean', default: true })
  comments: boolean;

  @Column({ type: 'boolean', default: true })
  replies: boolean;

  @Column({ type: 'boolean', default: true })
  favorites: boolean;

  @Column({ type: 'boolean', default: true })
  helpful_reactions: boolean;

  @Column({ type: 'boolean', default: true })
  follows: boolean;

  @Column({ type: 'boolean', default: true })
  system_updates: boolean;

  @Column({ type: 'boolean', default: true })
  email_notifications: boolean;

  @Column({ type: 'boolean', default: true })
  push_notifications: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
