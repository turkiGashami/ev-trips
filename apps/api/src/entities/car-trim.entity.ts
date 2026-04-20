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
import { DrivetrainType } from '../common/enums';
import { CarModel } from './car-model.entity';
import { UserVehicle } from './user-vehicle.entity';

@Entity('car_trims')
@Index(['model_id'])
export class CarTrim {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  model_id: string;

  @ManyToOne(() => CarModel, (model) => model.trims, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'model_id' })
  model: CarModel;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name_ar: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  battery_capacity_kwh: number | null;

  @Column({ type: 'integer', nullable: true })
  range_km_official: number | null;

  @Column({ type: 'enum', enum: DrivetrainType, nullable: true })
  drivetrain: DrivetrainType | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => UserVehicle, (vehicle) => vehicle.trim)
  user_vehicles: UserVehicle[];
}
