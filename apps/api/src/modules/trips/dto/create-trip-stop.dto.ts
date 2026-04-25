import {
  IsString,
  IsUUID,
  IsInt,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Max,
  MaxLength,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChargerType } from '../../../common/enums';

export class CreateTripStopDto {
  @ApiProperty({ description: 'Stop order (1-based)', minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  stop_order: number;

  @ApiPropertyOptional({ description: 'Linked charging station UUID' })
  @IsOptional()
  @IsUUID()
  charging_station_id?: string;

  @ApiProperty({ description: 'Charging station name', maxLength: 200 })
  @IsString()
  @MaxLength(200)
  station_name: string;

  @ApiPropertyOptional({ description: 'Charger provider name', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  provider_name?: string;

  @ApiPropertyOptional({ enum: ChargerType })
  @IsOptional()
  @IsEnum(ChargerType)
  charger_type?: ChargerType;

  @ApiPropertyOptional({ description: 'City UUID' })
  @IsOptional()
  @IsUUID()
  city_id?: string;

  @ApiPropertyOptional({ description: 'Latitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'Cumulative distance from origin city (km)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance_from_start_km?: number;

  @ApiPropertyOptional({ description: 'Battery % before charging (0–100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  battery_before_pct?: number;

  @ApiPropertyOptional({ description: 'Battery % after charging (0–100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  battery_after_pct?: number;

  @ApiPropertyOptional({ description: 'Charging duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  charging_duration_minutes?: number;

  @ApiPropertyOptional({ description: 'Charging cost' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  charging_cost?: number;

  @ApiPropertyOptional({ description: 'Currency code (3 chars)', example: 'SAR' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  charging_cost_currency?: string;

  @ApiPropertyOptional({ description: 'Arrival time at stop (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'arrival_time must be in HH:mm format' })
  arrival_time?: string;

  @ApiPropertyOptional({ description: 'Departure time from stop (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'departure_time must be in HH:mm format' })
  departure_time?: string;

  @ApiPropertyOptional({ description: 'Was the station busy?' })
  @IsOptional()
  @IsBoolean()
  was_busy?: boolean;

  @ApiPropertyOptional({ description: 'Was the station functioning well?' })
  @IsOptional()
  @IsBoolean()
  was_functioning_well?: boolean;

  @ApiPropertyOptional({ description: 'Number of chargers available' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  chargers_available?: number;

  @ApiPropertyOptional({ description: 'Connector power in kW' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  connector_power_kw?: number;

  @ApiPropertyOptional({ description: 'Congestion note', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  congestion_note?: string;

  @ApiPropertyOptional({ description: 'Quality note', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  quality_note?: string;

  @ApiPropertyOptional({ description: 'General notes', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
