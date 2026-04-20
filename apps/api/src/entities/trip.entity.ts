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
import {
  TripStatus,
  LuggageLevel,
  AcUsage,
  WeatherCondition,
  DrivingStyle,
} from '../common/enums';
import { User } from './user.entity';
import { UserVehicle } from './user-vehicle.entity';
import { City } from './city.entity';
import { Route } from './route.entity';
import { TripStop } from './trip-stop.entity';
import { TripMedia } from './trip-media.entity';
import { Comment } from './comment.entity';
import { TripReaction } from './trip-reaction.entity';
import { Favorite } from './favorite.entity';

@Entity('trips')
@Index(['user_id'])
@Index(['departure_city_id'])
@Index(['destination_city_id'])
@Index(['status'])
@Index(['trip_date'])
@Index(['view_count'])
@Index(['published_at'])
@Index(['deleted_at'])
@Index(['slug'])
@Index(['departure_city_id', 'destination_city_id', 'status'])
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @ManyToOne(() => User, (user) => user.trips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'uuid', nullable: true })
  vehicle_id: string | null;

  @ManyToOne(() => UserVehicle, (vehicle) => vehicle.trips, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: UserVehicle | null;

  // Vehicle snapshot fields
  @Column({ type: 'varchar', length: 100, nullable: true })
  snap_brand_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  snap_model_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  snap_trim_name: string | null;

  @Column({ type: 'smallint', nullable: true })
  snap_year: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  snap_battery_capacity_kwh: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  snap_drivetrain: string | null;

  // Route
  @Column({ type: 'uuid' })
  departure_city_id: string;

  @ManyToOne(() => City, (city) => city.departing_trips, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'departure_city_id' })
  departure_city: City;

  @Column({ type: 'uuid' })
  destination_city_id: string;

  @ManyToOne(() => City, (city) => city.arriving_trips, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destination_city_id' })
  destination_city: City;

  @Column({ type: 'uuid', nullable: true })
  route_id: string | null;

  @ManyToOne(() => Route, (route) => route.trips, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'route_id' })
  route: Route | null;

  @Column({ type: 'varchar', length: 300, unique: true })
  slug: string;

  @Column({ type: 'varchar', length: 300 })
  title: string;

  // Trip date/time
  @Column({ type: 'date' })
  trip_date: Date;

  @Column({ type: 'time', nullable: true })
  departure_time: string | null;

  @Column({ type: 'time', nullable: true })
  arrival_time: string | null;

  @Column({ type: 'integer', nullable: true })
  duration_minutes: number | null;

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  distance_km: number | null;

  // Battery
  @Column({ type: 'smallint' })
  departure_battery_pct: number;

  @Column({ type: 'smallint' })
  arrival_battery_pct: number;

  @Column({ type: 'integer', nullable: true })
  estimated_range_at_departure_km: number | null;

  @Column({ type: 'integer', nullable: true })
  remaining_range_at_arrival_km: number | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  consumption_rate: number | null;

  // Trip conditions
  @Column({ type: 'smallint', default: 1 })
  passengers_count: number;

  @Column({ type: 'enum', enum: LuggageLevel, nullable: true })
  luggage_level: LuggageLevel | null;

  @Column({ type: 'enum', enum: AcUsage, nullable: true })
  ac_usage: AcUsage | null;

  @Column({ type: 'enum', enum: WeatherCondition, nullable: true })
  weather_condition: WeatherCondition | null;

  @Column({ type: 'smallint', nullable: true })
  average_speed_kmh: number | null;

  @Column({ type: 'enum', enum: DrivingStyle, nullable: true })
  driving_style: DrivingStyle | null;

  @Column({ type: 'smallint', nullable: true })
  outside_temperature_c: number | null;

  @Column({ type: 'smallint', nullable: true })
  wind_speed_kmh: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  road_condition: string | null;

  // Content
  @Column({ type: 'text', nullable: true })
  route_notes: string | null;

  @Column({ type: 'text', nullable: true })
  trip_notes: string | null;

  // Status & quality
  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.DRAFT })
  status: TripStatus;

  @Column({ type: 'text', nullable: true })
  rejection_reason: string | null;

  @Column({ type: 'smallint', default: 0 })
  completeness_score: number;

  @Column({ type: 'boolean', default: false })
  is_admin_reviewed: boolean;

  @Column({ type: 'boolean', default: false })
  is_featured: boolean;

  // Stats
  @Column({ type: 'integer', default: 0 })
  view_count: number;

  @Column({ type: 'integer', default: 0 })
  favorite_count: number;

  @Column({ type: 'integer', default: 0 })
  helpful_count: number;

  @Column({ type: 'integer', default: 0 })
  comment_count: number;

  // Timestamps
  @Column({ type: 'timestamptz', nullable: true })
  submitted_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  published_at: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deleted_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => TripStop, (stop) => stop.trip)
  stops: TripStop[];

  @OneToMany(() => TripMedia, (media) => media.trip)
  media: TripMedia[];

  @OneToMany(() => Comment, (comment) => comment.trip)
  comments: Comment[];

  @OneToMany(() => TripReaction, (reaction) => reaction.trip)
  reactions: TripReaction[];

  @OneToMany(() => Favorite, (favorite) => favorite.trip)
  favorites: Favorite[];
}
