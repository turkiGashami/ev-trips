import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { MediaService } from '../media/media.service';

@ApiTags('Vehicles')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'vehicles', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly mediaService: MediaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all vehicles for the current user' })
  async getMyVehicles(@CurrentUser() user: JwtPayload) {
    return this.vehiclesService.findAllForUser(user.sub);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a new vehicle' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehiclesService.create(user.sub, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific vehicle by ID' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  async getOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.vehiclesService.findOneForUser(user.sub, vehicleId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) vehicleId: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(user.sub, vehicleId, dto);
  }

  @Post(':id/set-default')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set a vehicle as the default' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  async setDefault(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.vehiclesService.setDefault(user.sub, vehicleId);
  }

  @Post(':id/image')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload a vehicle image' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  async uploadImage(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) vehicleId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.mediaService.validateFile(file, ['image/jpeg', 'image/png', 'image/webp'], 5);
    const imageUrl = await this.mediaService.uploadFile(
      file,
      `vehicles/${user.sub}/${vehicleId}`,
    );
    return this.vehiclesService.uploadImage(user.sub, vehicleId, imageUrl);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a vehicle (soft delete)' })
  @ApiParam({ name: 'id', description: 'Vehicle UUID' })
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) vehicleId: string,
  ) {
    return this.vehiclesService.remove(user.sub, vehicleId);
  }
}
