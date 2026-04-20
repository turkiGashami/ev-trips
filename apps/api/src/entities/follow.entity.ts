import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  Check,
} from 'typeorm';
import { User } from './user.entity';

@Entity('follows')
@Unique(['follower_id', 'following_id'])
@Check(`"follower_id" != "following_id"`)
@Index(['follower_id'])
@Index(['following_id'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  follower_id: string;

  @ManyToOne(() => User, (user) => user.following, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'follower_id' })
  follower: User;

  @Column({ type: 'uuid' })
  following_id: string;

  @ManyToOne(() => User, (user) => user.followers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'following_id' })
  following: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;
}
