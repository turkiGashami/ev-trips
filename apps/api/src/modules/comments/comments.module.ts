import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { Comment } from '../../entities/comment.entity';
import { Trip } from '../../entities/trip.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Trip])],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
