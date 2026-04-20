import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from '../../entities/user.entity';
import { Follow } from '../../entities/follow.entity';
import { Trip } from '../../entities/trip.entity';
import { UserBadge } from '../../entities/user-badge.entity';
import { Notification } from '../../entities/notification.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Follow, Trip, UserBadge, Notification]), MediaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
