import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargingStationsController } from './charging-stations.controller';
import { ChargingStationsService } from './charging-stations.service';
import { ChargingStation } from '../../entities/charging-station.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChargingStation])],
  controllers: [ChargingStationsController],
  providers: [ChargingStationsService],
  exports: [ChargingStationsService],
})
export class ChargingStationsModule {}
