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
import { User } from './user.entity';
import { CarBrand } from './car-brand.entity';
import { CarModel } from './car-model.entity';
import { CarTrim } from './car-trim.entity';
import { Trip } from './trip.entity';

@Entity('user_vehicles')
@Index(['user_id'])
export class UserVehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, (user) => user.vehicles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid' })
  brand_id: string;

  @ManyToOne(() => CarBrand, (brand) => brand.user_vehicles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'brand_id' })
  brand: CarBrand;

  @Column({ type: 'uuid' })
  model_id: string;

  @ManyToOne(() => CarModel, (model) => model.user_vehicles, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'model_id' })
  model: CarModel;

  @Column({ type: 'uuid', nullable: true })
  trim_id: string | null;

  @ManyToOne(() => CarTrim, (trim) => trim.user_vehicles, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'trim_id' })
  trim: CarTrim | null;

  @Column({ type: 'smallint' })
  year: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nickname: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  image_url: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  battery_capacity_kwh: number | null;

  @Column({ type: 'enum', enum: DrivetrainType, nullable: true })
  drivetrain: DrivetrainType | null;

  @Column({ type: 'boolean', default: false })
  is_default: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => Trip, (trip) => trip.vehicle)
  trips: Trip[];
}
