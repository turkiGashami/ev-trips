import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum PreferredLanguage {
  EN = 'en',
  AR = 'ar',
}

export class RegisterDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'أحمد العتيبي' })
  @IsString()
  @MinLength(2, { message: 'Full name must be at least 2 characters' })
  @MaxLength(100, { message: 'Full name must not exceed 100 characters' })
  @Matches(/^[a-zA-Z\u0600-\u06FF\s'-]+$/, {
    message: 'Full name can only contain letters, spaces, hyphens and apostrophes',
  })
  @Transform(({ value }) => value?.trim())
  full_name: string;

  @ApiProperty({ example: 'ahmed_ev' })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters' })
  @MaxLength(30, { message: 'Username must not exceed 30 characters' })
  @Matches(/^[a-z0-9_]+$/, {
    message: 'Username can only contain lowercase letters, numbers and underscores',
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  username: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'Min 8 chars, at least one uppercase, one lowercase, one number, one special char (@$!%*?&-_#.)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @MaxLength(128, { message: 'Password must not exceed 128 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&\-_#.])[A-Za-z\d@$!%*?&\-_#.]{8,}$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&-_#.)',
  })
  password: string;

  @ApiPropertyOptional({ example: 'SA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  country?: string;

  @ApiPropertyOptional({ enum: PreferredLanguage, default: PreferredLanguage.AR })
  @IsOptional()
  @IsEnum(PreferredLanguage)
  preferredLanguage?: PreferredLanguage = PreferredLanguage.AR;
}
