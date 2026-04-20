import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType } from '../../../common/enums';

export class CreateReportDto {
  @ApiProperty({ enum: ReportType, description: 'Type of report' })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiProperty({ description: 'Type of target: trip, comment, user' })
  @IsString()
  target_type: string;

  @ApiProperty({ description: 'UUID of the target entity' })
  @IsUUID()
  target_id: string;

  @ApiPropertyOptional({ description: 'Additional reason or description', maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}
