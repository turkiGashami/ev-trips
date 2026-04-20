import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { CommentStatus } from '../common/enums';
import { Trip } from './trip.entity';
import { User } from './user.entity';

@Entity('comments')
@Index(['trip_id'])
@Index(['user_id'])
@Index(['parent_id'])
@Index(['status'])
@Index(['deleted_at'])
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  trip_id: string;

  @ManyToOne(() => Trip, (trip) => trip.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  parent_id: string | null;

  @ManyToOne(() => Comment, (comment) => comment.replies, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parent_id' })
  parent: Comment | null;

  @OneToMany(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: CommentStatus, default: CommentStatus.VISIBLE })
  status: CommentStatus;

  @Column({ type: 'text', nullable: true })
  moderation_note: string | null;

  @Column({ type: 'integer', default: 0 })
  reply_count: number;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
