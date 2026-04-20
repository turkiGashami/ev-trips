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
import { ChargerType } from '../common/enums';
import { Trip } from './trip.entity';
import { ChargingStation } from './charging-station.entity';
import { City } from './city.entity';

@Entity('trip_stops')
@Index(['trip_id'])
@Index(['charging_station_id'])
export class TripStop {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  trip_id: string;

  @ManyToOne(() => Trip, (trip) => trip.stops, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({ type: 'smallint' })
  stop_order: number;

  @Column({ type: 'uuid', nullable: true })
  charging_station_id: string | null;

  @ManyToOne(() => ChargingStation, (station) => station.trip_stops, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'charging_station_id' })
  charging_station: ChargingStation | null;

  @Column({ type: 'varchar', length: 200 })
  station_name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  provider_name: string | null;

  @Column({ type: 'enum', enum: ChargerType, nullable: true })
  charger_type: ChargerType | null;

  @Column({ type: 'uuid', nullable: true })
  city_id: string | null;

  @ManyToOne(() => City, (city) => city.trip_stops, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'city_id' })
  city: City | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'smallint', nullable: true })
  battery_before_pct: number | null;

  @Column({ type: 'smallint', nullable: true })
  battery_after_pct: number | null;

  @Column({ type: 'integer', nullable: true })
  charging_duration_minutes: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  charging_cost: number | null;

  @Column({ type: 'varchar', length: 3, default: 'SAR' })
  charging_cost_currency: string;

  @Column({ type: 'time', nullable: true })
  arrival_time: string | null;

  @Column({ type: 'time', nullable: true })
  departure_time: string | null;

  @Column({ type: 'boolean', nullable: true })
  was_busy: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  was_functioning_well: boolean | null;

  @Column({ type: 'smallint', nullable: true })
  chargers_available: number | null;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  connector_power_kw: number | null;

  @Column({ type: 'text', nullable: true })
  congestion_note: string | null;

  @Column({ type: 'text', nullable: true })
  quality_note: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;
}
