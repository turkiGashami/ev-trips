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
import { ChargerType } from '../common/enums';
import { City } from './city.entity';
import { User } from './user.entity';
import { TripStop } from './trip-stop.entity';

@Entity('charging_stations')
@Index(['city_id'])
@Index(['charger_type'])
export class ChargingStation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  name_ar: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider: string | null;

  @Column({ type: 'enum', enum: ChargerType })
  charger_type: ChargerType;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  power_kw: number | null;

  @Column({ type: 'uuid', nullable: true })
  city_id: string | null;

  @ManyToOne(() => City, (city) => city.charging_stations, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'city_id' })
  city: City | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  opening_hours: string | null;

  @Column({ type: 'text', array: true, nullable: true })
  image_urls: string[] | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'uuid', nullable: true })
  suggested_by_user_id: string | null;

  @ManyToOne(() => User, (user) => user.suggested_stations, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'suggested_by_user_id' })
  suggested_by_user: User | null;

  @Column({ type: 'boolean', default: false })
  is_verified: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => TripStop, (stop) => stop.charging_station)
  trip_stops: TripStop[];
}
