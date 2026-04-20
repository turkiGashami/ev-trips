import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PageStatus } from '../common/enums';
import { User } from './user.entity';

@Entity('static_pages')
export class StaticPage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  key: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title_ar: string | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'text', nullable: true })
  content_ar: string | null;

  @Column({ type: 'enum', enum: PageStatus, default: PageStatus.PUBLISHED })
  status: PageStatus;

  @Column({ type: 'uuid', nullable: true })
  updated_by_id: string | null;

  @ManyToOne(() => User, (user) => user.updated_pages, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'updated_by_id' })
  updated_by: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
