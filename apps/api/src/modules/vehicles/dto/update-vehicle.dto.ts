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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { DrivetrainType } from '../../../common/enums';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ description: 'Car brand ID (UUID)' })
  @IsOptional()
  @IsUUID()
  brand_id?: string;

  @ApiPropertyOptional({ description: 'Car model ID (UUID)' })
  @IsOptional()
  @IsUUID()
  model_id?: string;

  @ApiPropertyOptional({ description: 'Car trim ID (UUID)' })
  @IsOptional()
  @IsUUID()
  trim_id?: string;

  @ApiPropertyOptional({ description: 'Year of manufacture', minimum: 2000, maximum: 2030 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2030)
  year?: number;

  @ApiPropertyOptional({ description: 'Nickname for this vehicle', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @ApiPropertyOptional({ description: 'Battery capacity in kWh' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(999)
  battery_capacity_kwh?: number;

  @ApiPropertyOptional({ enum: DrivetrainType, description: 'Drivetrain type' })
  @IsOptional()
  @IsEnum(DrivetrainType)
  drivetrain?: DrivetrainType;

  @ApiPropertyOptional({ description: 'Set as default vehicle' })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;
}
