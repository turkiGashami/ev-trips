import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Trip } from './trip.entity';
import { User } from './user.entity';

@Entity('trip_media')
@Index(['trip_id'])
@Index(['user_id'])
export class TripMedia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  trip_id: string;

  @ManyToOne(() => Trip, (trip) => trip.media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, (user) => user.trip_media, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 500 })
  url: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail_url: string | null;

  @Column({ type: 'varchar', length: 20, default: 'image' })
  media_type: string;

  @Column({ type: 'integer', nullable: true })
  file_size_bytes: number | null;

  @Column({ type: 'smallint', default: 0 })
  sort_order: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
