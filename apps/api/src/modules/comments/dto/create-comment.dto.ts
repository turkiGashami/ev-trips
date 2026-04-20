import {
  IsString,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCommentDto {
  @ApiProperty({ description: 'Trip UUID to comment on' })
  @IsUUID()
  trip_id: string;

  @ApiPropertyOptional({ description: 'Parent comment UUID for replies' })
  @IsOptional()
  @IsUUID()
  parent_id?: string;

  @ApiProperty({ description: 'Comment content', minLength: 1, maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content: string;
}
