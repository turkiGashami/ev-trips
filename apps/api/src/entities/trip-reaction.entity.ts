import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ReactionType } from '../common/enums';
import { Trip } from './trip.entity';
import { User } from './user.entity';

@Entity('trip_reactions')
@Unique(['trip_id', 'user_id', 'reaction_type'])
@Index(['trip_id'])
@Index(['user_id'])
export class TripReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  trip_id: string;

  @ManyToOne(() => Trip, (trip) => trip.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, (user) => user.reactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'enum', enum: ReactionType })
  reaction_type: ReactionType;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
