import {
  Controller, Get, Post, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChargingStationsService } from './charging-stations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('Charging Stations')
@Controller('charging-stations')
export class ChargingStationsController {
  constructor(private readonly service: ChargingStationsService) {}

  @Public()
  @Get()
  findAll(@Query() query: any) {
    return this.service.findAll(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('suggest')
  suggest(@CurrentUser() user: any, @Body() dto: any) {
    return this.service.suggest(user.id, dto);
  }
}
