import {
  Controller,
  Get,
  Param,
  Query,
  Body,
  Post,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength, IsOptional } from 'class-validator';

import { LookupService } from './lookup.service';
import { Public, JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

class CreateCityDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name_ar!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}

@ApiTags('Lookup')
@Controller({ path: 'lookup', version: '1' })
export class LookupController {
  constructor(private readonly lookupService: LookupService) {}

  @Public()
  @Get('cities')
  @ApiOperation({ summary: 'Get all active cities (cached)' })
  @ApiQuery({ name: 'q', required: false, description: 'Search by name' })
  async getCities(@Query('q') search?: string) {
    return this.lookupService.getCities(search);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('cities')
  @ApiOperation({ summary: 'Create a city if it does not exist (user-suggested)' })
  async createCity(@Body() dto: CreateCityDto) {
    return this.lookupService.findOrCreateCity(dto.name_ar, dto.name);
  }

  @Get('brands')
  @ApiOperation({ summary: 'Get all active car brands (cached)' })
  async getBrands() {
    return this.lookupService.getBrands(true);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('brands')
  @ApiOperation({ summary: 'Create a brand if it does not exist (user-suggested)' })
  async createBrand(@Body() dto: { name: string }) {
    return this.lookupService.findOrCreateBrand(dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('brands/:brandId/models')
  @ApiOperation({ summary: 'Create a model under a brand if it does not exist' })
  async createModel(
    @Param('brandId', ParseUUIDPipe) brandId: string,
    @Body() dto: { name: string },
  ) {
    return this.lookupService.findOrCreateModel(brandId, dto.name);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('models/:modelId/trims')
  @ApiOperation({ summary: 'Create a trim under a model if it does not exist' })
  async createTrim(
    @Param('modelId', ParseUUIDPipe) modelId: string,
    @Body() dto: { name: string },
  ) {
    return this.lookupService.findOrCreateTrim(modelId, dto.name);
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
