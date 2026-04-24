import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PublicContentController } from './public-content.controller';
import { User } from '../../entities/user.entity';
import { Trip } from '../../entities/trip.entity';
import { Comment } from '../../entities/comment.entity';
import { Report } from '../../entities/report.entity';
import { AdminLog } from '../../entities/admin-log.entity';
import { ChargingStation } from '../../entities/charging-station.entity';
import { CarBrand } from '../../entities/car-brand.entity';
import { CarModel } from '../../entities/car-model.entity';
import { CarTrim } from '../../entities/car-trim.entity';
import { City } from '../../entities/city.entity';
import { StaticPage } from '../../entities/static-page.entity';
import { Banner } from '../../entities/banner.entity';
import { SystemSetting } from '../../entities/system-setting.entity';
import { Badge } from '../../entities/badge.entity';
import { UserBadge } from '../../entities/user-badge.entity';
import { Notification } from '../../entities/notification.entity';
import { Route } from '../../entities/route.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, Trip, Comment, Report, AdminLog, ChargingStation,
      CarBrand, CarModel, CarTrim, City, StaticPage, Banner,
      SystemSetting, Badge, UserBadge, Notification, Route,
    ]),
  ],
  controllers: [AdminController, PublicContentController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
