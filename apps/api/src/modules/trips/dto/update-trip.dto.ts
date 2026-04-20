import {
  IsString,
  IsUUID,
  IsInt,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  MaxLength,
  IsDateString,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  LuggageLevel,
  AcUsage,
  WeatherCondition,
  DrivingStyle,
} from '../../../common/enums';

export class UpdateTripDto {
  @ApiPropertyOptional({ description: 'Vehicle ID' })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  @ApiPropertyOptional({ description: 'Departure city UUID' })
  @IsOptional()
  @IsUUID()
  departure_city_id?: string;

  @ApiPropertyOptional({ description: 'Destination city UUID' })
  @IsOptional()
  @IsUUID()
  destination_city_id?: string;

  @ApiPropertyOptional({ description: 'Trip title', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({ description: 'Trip date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  trip_date?: string;

  @ApiPropertyOptional({ description: 'Departure time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'departure_time must be in HH:mm format' })
  departure_time?: string;

  @ApiPropertyOptional({ description: 'Arrival time (HH:mm)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, { message: 'arrival_time must be in HH:mm format' })
  arrival_time?: string;

  @ApiPropertyOptional({ description: 'Duration in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  duration_minutes?: number;

  @ApiPropertyOptional({ description: 'Distance in km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  distance_km?: number;

  @ApiPropertyOptional({ description: 'Battery % at departure (0–100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  departure_battery_pct?: number;

  @ApiPropertyOptional({ description: 'Battery % at arrival (0–100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  arrival_battery_pct?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimated_range_at_departure_km?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  remaining_range_at_arrival_km?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  consumption_rate?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 9 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9)
  passengers_count?: number;

  @ApiPropertyOptional({ enum: LuggageLevel })
  @IsOptional()
  @IsEnum(LuggageLevel)
  luggage_level?: LuggageLevel;

  @ApiPropertyOptional({ enum: AcUsage })
  @IsOptional()
  @IsEnum(AcUsage)
  ac_usage?: AcUsage;

  @ApiPropertyOptional({ enum: WeatherCondition })
  @IsOptional()
  @IsEnum(WeatherCondition)
  weather_condition?: WeatherCondition;

  @ApiPropertyOptional({ description: 'Average speed km/h' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(300)
  average_speed_kmh?: number;

  @ApiPropertyOptional({ enum: DrivingStyle })
  @IsOptional()
  @IsEnum(DrivingStyle)
  driving_style?: DrivingStyle;

  @ApiPropertyOptional({ description: 'Outside temperature in Celsius' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-60)
  @Max(60)
  outside_temperature_c?: number;

  @ApiPropertyOptional({ description: 'Wind speed in km/h' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(300)
  wind_speed_kmh?: number;

  @ApiPropertyOptional({ description: 'Road condition description', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  road_condition?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  route_notes?: string;

  @ApiPropertyOptional({ maxLength: 5000 })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  trip_notes?: string;
}
