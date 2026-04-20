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
import { ReportType, ReportStatus } from '../common/enums';
import { User } from './user.entity';

@Entity('reports')
@Index(['status'])
@Index(['target_type', 'target_id'])
@Index(['reporter_id'])
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reporter_id: string;

  @ManyToOne(() => User, (user) => user.reports_filed, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ type: 'enum', enum: ReportType })
  type: ReportType;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ type: 'varchar', length: 50 })
  target_type: string;

  @Column({ type: 'uuid' })
  target_id: string;

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  admin_notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  reviewed_by_id: string | null;

  @ManyToOne(() => User, (user) => user.reports_reviewed, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by_id' })
  reviewed_by: User | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewed_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
