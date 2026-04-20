import {
  IsString,
  IsUUID,
  IsInt,
  IsOptional,
  IsEnum,
  IsBoolean,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  LuggageLevel,
  AcUsage,
  WeatherCondition,
  DrivingStyle,
} from '../../../common/enums';

export class SearchTripsDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Departure city UUID' })
  @IsOptional()
  @IsUUID()
  from_city_id?: string;

  @ApiPropertyOptional({ description: 'Destination city UUID' })
  @IsOptional()
  @IsUUID()
  to_city_id?: string;

  @ApiPropertyOptional({ description: 'Vehicle brand UUID' })
  @IsOptional()
  @IsUUID()
  brand_id?: string;

  @ApiPropertyOptional({ description: 'Vehicle model UUID' })
  @IsOptional()
  @IsUUID()
  model_id?: string;

  @ApiPropertyOptional({ description: 'Vehicle trim UUID' })
  @IsOptional()
  @IsUUID()
  trim_id?: string;

  @ApiPropertyOptional({ description: 'Vehicle year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2030)
  year?: number;

  @ApiPropertyOptional({ description: 'Filter trips from this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date_from?: string;

  @ApiPropertyOptional({ description: 'Filter trips to this date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date_to?: string;

  @ApiPropertyOptional({ description: 'Min departure battery %' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  min_departure_battery?: number;

  @ApiPropertyOptional({ description: 'Max departure battery %' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  max_departure_battery?: number;

  @ApiPropertyOptional({ description: 'Min arrival battery %' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  min_arrival_battery?: number;

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

  @ApiPropertyOptional({ enum: DrivingStyle })
  @IsOptional()
  @IsEnum(DrivingStyle)
  driving_style?: DrivingStyle;

  @ApiPropertyOptional({ description: 'Number of passengers' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(9)
  passengers_count?: number;

  @ApiPropertyOptional({ description: 'Only featured trips' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  is_featured?: boolean;

  @ApiPropertyOptional({ description: 'Sort by field', enum: ['published_at', 'view_count', 'helpful_count', 'favorite_count', 'trip_date'] })
  @IsOptional()
  @IsString()
  sort_by?: string = 'published_at';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsString()
  sort_order?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional({ description: 'Min outside temperature in Celsius' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-60)
  @Max(60)
  min_outside_temperature_c?: number;

  @ApiPropertyOptional({ description: 'Max outside temperature in Celsius' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-60)
  @Max(60)
  max_outside_temperature_c?: number;

  @ApiPropertyOptional({ description: 'Max wind speed in km/h' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(300)
  max_wind_speed_kmh?: number;

  @ApiPropertyOptional({ description: 'Road condition filter', maxLength: 100 })
  @IsOptional()
  @IsString()
  road_condition?: string;

  @ApiPropertyOptional({ description: 'Text search across title/notes' })
  @IsOptional()
  @IsString()
  q?: string;
}
