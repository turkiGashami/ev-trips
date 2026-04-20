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
import { CarBrand } from './car-brand.entity';
import { CarTrim } from './car-trim.entity';
import { UserVehicle } from './user-vehicle.entity';

@Entity('car_models')
@Index(['brand_id'])
export class CarModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  brand_id: string;

  @ManyToOne(() => CarBrand, (brand) => brand.models, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'brand_id' })
  brand: CarBrand;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name_ar: string | null;

  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => CarTrim, (trim) => trim.model)
  trims: CarTrim[];

  @OneToMany(() => UserVehicle, (vehicle) => vehicle.model)
  user_vehicles: UserVehicle[];
}
