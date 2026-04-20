import {
  Controller,
  Get,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';

import { LookupService } from './lookup.service';
import { Public } from '../auth/guards/jwt-auth.guard';

@ApiTags('Lookup')
@Public()
@Controller({ path: 'lookup', version: '1' })
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  @Get('cities')
  @ApiOperation({ summary: 'Get all active cities (cached)' })
  @ApiQuery({ name: 'q', required: false, description: 'Search by name' })
  async getCities(@Query('q') search?: string) {
    return this.lookupService.getCities(search);
  }

  @Get('brands')
  @ApiOperation({ summary: 'Get all active car brands (cached)' })
  async getBrands() {
    return this.lookupService.getBrands(true);
  }

  @Get('brands/:brandId/models')
  @ApiOperation({ summary: 'Get models for a brand (cached)' })
  @ApiParam({ name: 'brandId', description: 'Brand UUID' })
  async getModelsByBrand(@Param('brandId', ParseUUIDPipe) brandId: string) {
    return this.lookupService.getModelsByBrand(brandId);
  }

  @Get('models/:modelId/trims')
  @ApiOperation({ summary: 'Get trims for a model (cached)' })
  @ApiParam({ name: 'modelId', description: 'Model UUID' })
  async getTrimsByModel(@Param('modelId', ParseUUIDPipe) modelId: string) {
    return this.lookupService.getTrimsByModel(modelId);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Get all badges (cached)' })
  async getBadges() {
    return this.lookupService.getBadges();
  }

  @Get('enums')
  @ApiOperation({ summary: 'Get all enum values used across the app' })
  async getEnums() {
    return this.lookupService.getEnums();
  }
}
