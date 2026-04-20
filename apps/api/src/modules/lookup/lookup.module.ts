import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LookupController } from './lookup.controller';
import { LookupService } from './lookup.service';
import { City } from '../../entities/city.entity';
import { CarBrand } from '../../entities/car-brand.entity';
import { CarModel } from '../../entities/car-model.entity';
import { CarTrim } from '../../entities/car-trim.entity';
import { Badge } from '../../entities/badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([City, CarBrand, CarModel, CarTrim, Badge])],
  controllers: [LookupController],
  providers: [LookupService],
  exports: [LookupService],
})
export class LookupModule {}
