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
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  LuggageLevel,
  AcUsage,
  WeatherCondition,
  DrivingStyle,
} from '../../../common/enums';

export class CreateTripDto {
  @ApiPropertyOptional({ description: 'Vehicle ID to use for this trip' })
  @IsOptional()
  @IsUUID()
  vehicle_id?: string;

  /**
   * City handling:
   * - If user selects a city from autocomplete, frontend sends *_city_id.
   * - If user types a custom city, frontend sends *_city_name.
   * - At least one value for departure and destination should be present.
   */

  @ApiPropertyOptional({ description: 'Departure city UUID from cities table' })
  @ValidateIf((o) => !o.departure_city_name)
  @IsOptional()
  @IsUUID()
  departure_city_id?: string;

  @ApiPropertyOptional({
    description: 'Departure city name typed manually by the user',
    maxLength: 100,
    example: 'الزلفي',
  })
  @ValidateIf((o) => !o.departure_city_id)
  @IsString()
  @MaxLength(100)
  departure_city_name?: string;

  @ApiPropertyOptional({ description: 'Destination city UUID from cities table' })
  @ValidateIf((o) => !o.destination_city_name)
  @IsOptional()
  @IsUUID()
  destination_city_id?: string;

  @ApiPropertyOptional({
    description: 'Destination city name typed manually by the user',
    maxLength: 100,
    example: 'مكة المكرمة',
  })
  @ValidateIf((o) => !o.destination_city_id)
  @IsString()
  @MaxLength(100)
  destination_city_name?: string;

  @ApiPropertyOptional({ description: 'Trip title', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({ description: 'Trip date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  trip_date?: string;

  @ApiPropertyOptional({ description: 'Departure time (HH:mm)', example: '08:00' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'departure_time must be in HH:mm format',
  })
  departure_time?: string;

  @ApiPropertyOptional({ description: 'Arrival time (HH:mm)', example: '12:30' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'arrival_time must be in HH:mm format',
  })
  arrival_time?: string;

  @ApiPropertyOptional({ description: 'Trip duration in minutes' })
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

  @ApiPropertyOptional({ description: 'Battery percentage at departure (0–100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  departure_battery_pct?: number;

  @ApiPropertyOptional({ description: 'Battery percentage at arrival (0–100)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  arrival_battery_pct?: number;

  @ApiPropertyOptional({ description: 'Estimated range at departure in km' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  estimated_range_at_departure_km?: number;

  @ApiPropertyOptional({ description: 'Remaining range at arrival in km' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  remaining_range_at_arrival_km?: number;

  @ApiPropertyOptional({ description: 'Energy consumption rate (kWh/100km)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  consumption_rate?: number;

  @ApiPropertyOptional({
    description: 'Number of passengers',
    minimum: 1,
    maximum: 9,
  })
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

  @ApiPropertyOptional({ description: 'Average speed in km/h' })
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

  @ApiPropertyOptional({
    description: 'Road condition description',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  road_condition?: string;

  @ApiPropertyOptional({
    description: 'Notes about the route',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  route_notes?: string;

  @ApiPropertyOptional({
    description: 'General trip notes',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  trip_notes?: string;
}
