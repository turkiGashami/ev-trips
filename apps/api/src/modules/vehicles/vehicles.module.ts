import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { UserVehicle } from '../../entities/user-vehicle.entity';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserVehicle]), MediaModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
  exports: [VehiclesService],
})
export class VehiclesModule {}
