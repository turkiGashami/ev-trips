import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateNotificationSettingsDto {
  @ApiPropertyOptional({ description: 'Notify on new comments' })
  @IsOptional()
  @IsBoolean()
  comments?: boolean;

  @ApiPropertyOptional({ description: 'Notify on comment replies' })
  @IsOptional()
  @IsBoolean()
  replies?: boolean;

  @ApiPropertyOptional({ description: 'Notify when trip is favorited' })
  @IsOptional()
  @IsBoolean()
  favorites?: boolean;

  @ApiPropertyOptional({ description: 'Notify on helpful reactions' })
  @IsOptional()
  @IsBoolean()
  helpful_reactions?: boolean;

  @ApiPropertyOptional({ description: 'Notify on new followers' })
  @IsOptional()
  @IsBoolean()
  follows?: boolean;

  @ApiPropertyOptional({ description: 'Notify on system updates and announcements' })
  @IsOptional()
  @IsBoolean()
  system_updates?: boolean;

  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  email_notifications?: boolean;

  @ApiPropertyOptional({ description: 'Enable push notifications' })
  @IsOptional()
  @IsBoolean()
  push_notifications?: boolean;
}
