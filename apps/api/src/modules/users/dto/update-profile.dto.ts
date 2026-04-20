import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
  IsUrl,
  Matches,
  IsBoolean,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum ProfileVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  full_name?: string;

  @ApiPropertyOptional({ example: 'ev_driver_john' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Username can only contain lowercase letters, numbers, and underscores',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  username?: string;

  @ApiPropertyOptional({ example: 'Passionate EV driver exploring Saudi Arabia.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: 'Saudi Arabia' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ description: 'City UUID from cities lookup table' })
  @IsOptional()
  @IsUUID()
  city_id?: string;

  @ApiPropertyOptional({ example: 'https://mypersonalsite.com' })
  @IsOptional()
  @IsUrl({}, { message: 'Website URL must be a valid URL' })
  @MaxLength(500)
  website_url?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/johndoe' })
  @IsOptional()
  @IsUrl({}, { message: 'Twitter URL must be a valid URL' })
  @MaxLength(500)
  twitter_url?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/johndoe' })
  @IsOptional()
  @IsUrl({}, { message: 'Instagram URL must be a valid URL' })
  @MaxLength(500)
  instagram_url?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/in/johndoe' })
  @IsOptional()
  @IsUrl({}, { message: 'LinkedIn URL must be a valid URL' })
  @MaxLength(500)
  linkedin_url?: string;

  @ApiPropertyOptional({ enum: ProfileVisibility, default: ProfileVisibility.PUBLIC })
  @IsOptional()
  @IsEnum(ProfileVisibility)
  profile_visibility?: ProfileVisibility;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notification_email?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  notification_push?: boolean;
}
