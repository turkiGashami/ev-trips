import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Route } from './route.entity';
import { ChargingStation } from './charging-station.entity';
import { Trip } from './trip.entity';
import { TripStop } from './trip-stop.entity';

@Entity('cities')
export class City {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name_ar: string | null;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 100, default: 'SA' })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number | null;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => User, (user) => user.city)
  users: User[];

  @OneToMany(() => Route, (route) => route.departure_city)
  departing_routes: Route[];

  @OneToMany(() => Route, (route) => route.destination_city)
  arriving_routes: Route[];

  @OneToMany(() => ChargingStation, (station) => station.city)
  charging_stations: ChargingStation[];

  @OneToMany(() => Trip, (trip) => trip.departure_city)
  departing_trips: Trip[];

  @OneToMany(() => Trip, (trip) => trip.destination_city)
  arriving_trips: Trip[];

  @OneToMany(() => TripStop, (stop) => stop.city)
  trip_stops: TripStop[];
}
