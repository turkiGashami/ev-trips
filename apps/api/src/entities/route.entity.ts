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
import { City } from './city.entity';
import { Trip } from './trip.entity';

@Entity('routes')
@Index(['departure_city_id'])
@Index(['destination_city_id'])
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  departure_city_id: string;

  @ManyToOne(() => City, (city) => city.departing_routes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'departure_city_id' })
  departure_city: City;

  @Column({ type: 'uuid' })
  destination_city_id: string;

  @ManyToOne(() => City, (city) => city.arriving_routes, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'destination_city_id' })
  destination_city: City;

  @Column({ type: 'varchar', length: 200, unique: true })
  slug: string;

  @Column({ type: 'integer', nullable: true })
  distance_km: number | null;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'integer', default: 0 })
  trip_count: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  // Relations
  @OneToMany(() => Trip, (trip) => trip.route)
  trips: Trip[];
}
