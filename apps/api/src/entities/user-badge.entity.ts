import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Badge } from './badge.entity';

@Entity('user_badges')
@Unique(['user_id', 'badge_id'])
@Index(['user_id'])
@Index(['badge_id'])
export class UserBadge {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, (user) => user.badges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  badge_id: string;

  @ManyToOne(() => Badge, (badge) => badge.user_badges, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'badge_id' })
  badge: Badge;

  @Column({ type: 'uuid', nullable: true })
  awarded_by_id: string | null;

  @ManyToOne(() => User, (user) => user.badges_awarded, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'awarded_by_id' })
  awarded_by: User | null;

  @Column({ type: 'timestamptz', default: () => 'NOW()' })
  awarded_at: Date;
}
