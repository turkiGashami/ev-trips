import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TripsController } from './trips.controller';
import { TripsService } from './trips.service';
import { Trip } from '../../entities/trip.entity';
import { TripStop } from '../../entities/trip-stop.entity';
import { TripMedia } from '../../entities/trip-media.entity';
import { TripReaction } from '../../entities/trip-reaction.entity';
import { Favorite } from '../../entities/favorite.entity';
import { UserVehicle } from '../../entities/user-vehicle.entity';
import { Report } from '../../entities/report.entity';
import { SystemSetting } from '../../entities/system-setting.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Trip, TripStop, TripMedia, TripReaction, Favorite, UserVehicle, Report, SystemSetting]),
    MediaModule,
  ],
  controllers: [TripsController],
  providers: [TripsService],
  exports: [TripsService],
})
export class TripsModule {}
