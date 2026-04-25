import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { SearchTripsDto } from './dto/search-trips.dto';
import { CreateTripStopDto } from './dto/create-trip-stop.dto';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { MediaService } from '../media/media.service';
import { ReactionType, ReportType } from '../../common/enums';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ReactDto {
  @ApiProperty({ enum: ReactionType })
  reaction_type: ReactionType;
}

class ReportTripDto {
  @ApiProperty({ enum: ReportType })
  type: ReportType;

  @ApiPropertyOptional({ maxLength: 1000 })
  reason?: string;
}

@ApiTags('Trips')
@Controller({ path: 'trips', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly mediaService: MediaService,
  ) {}

  // ─── Create Draft ──────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new trip draft' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTripDto,
  ) {
    return this.tripsService.createDraft(user.sub, dto);
  }

  // ─── Search (public) ───────────────────────────────────────────────────────

  @Public()
  @Get()
  @ApiOperation({ summary: 'Search published trips' })
  async search(@Query() dto: SearchTripsDto) {
    return this.tripsService.searchTrips(dto);
  }

  // ─── Route Insights (public) ───────────────────────────────────────────────

  @Public()
  @Get('route-insights')
  @ApiOperation({ summary: 'Get aggregated route insights between two cities' })
  @ApiQuery({ name: 'from', description: 'Departure city UUID' })
  @ApiQuery({ name: 'to', description: 'Destination city UUID' })
  @ApiQuery({ name: 'brand_id', required: false })
  async getRouteInsights(
    @Query('from') fromCityId: string,
    @Query('to') toCityId: string,
    @Query('brand_id') brandId?: string,
  ) {
    const filters: Record<string, any> = {};
    if (brandId) filters.brand_id = brandId;
    return this.tripsService.getRouteInsights(fromCityId, toCityId, filters);
  }

  // ─── My Trips ──────────────────────────────────────────────────────────────

  @Get('my')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my trips (all statuses)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMyTrips(
    @CurrentUser() user: JwtPayload,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.tripsService.getMyTrips(user.sub, page ?? 1, limit ?? 20);
  }

  // ─── Trip Detail by Slug (public) ─────────────────────────────────────────

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get trip by slug' })
  @ApiParam({ name: 'slug', description: 'Trip slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.tripsService.findBySlug(slug);
  }

  // ─── Update Trip ───────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a draft or rejected trip' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripsService.updateTrip(user.sub, tripId, dto);
  }

  // ─── Delete Trip ───────────────────────────────────────────────────────────

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft delete a trip' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
  ) {
    return this.tripsService.deleteTrip(user.sub, tripId);
  }

  // ─── Submit for Review ─────────────────────────────────────────────────────

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit a trip for review' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async submit(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
  ) {
    return this.tripsService.submitTrip(user.sub, tripId);
  }

  // ─── Archive ───────────────────────────────────────────────────────────────

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Archive a trip' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async archive(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
  ) {
    return this.tripsService.archiveTrip(user.sub, tripId);
  }

  // ─── Duplicate ─────────────────────────────────────────────────────────────

  @Post(':id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Duplicate a trip as a new draft' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async duplicate(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
  ) {
    return this.tripsService.duplicateTrip(user.sub, tripId);
  }

  // ─── Increment View Count (public) ────────────────────────────────────────

  @Public()
  @Post(':id/view')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Increment view count for a trip' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async incrementView(@Param('id', ParseUUIDPipe) tripId: string) {
    await this.tripsService.incrementViewCount(tripId);
  }

  // ─── Stops ─────────────────────────────────────────────────────────────────

  @Post(':id/stops')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add a charging stop to a trip' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async addStop(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: CreateTripStopDto,
  ) {
    return this.tripsService.addStop(user.sub, tripId, dto);
  }

  @Patch(':id/stops/:stopId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a charging stop' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiParam({ name: 'stopId', description: 'Stop UUID' })
  async updateStop(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
    @Body() dto: Partial<CreateTripStopDto>,
  ) {
    return this.tripsService.updateStop(user.sub, tripId, stopId, dto);
  }

  @Delete(':id/stops/:stopId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a charging stop' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiParam({ name: 'stopId', description: 'Stop UUID' })
  async deleteStop(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
    @Param('stopId', ParseUUIDPipe) stopId: string,
  ) {
    return this.tripsService.deleteStop(user.sub, tripId, stopId);
  }

  // ─── Media ─────────────────────────────────────────────────────────────────

  @Post(':id/media')
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOperation({ summary: 'Upload media for a trip' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async uploadMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    this.mediaService.validateFile(
      file,
      ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'],
      20,
    );
    const url = await this.mediaService.uploadFile(file, `trips/${tripId}`);
    const mediaType = file.mimetype.startsWith('video') ? 'video' : 'image';
    return this.tripsService.addMedia(user.sub, tripId, url, mediaType, file.size);
  }

  @Delete(':id/media/:mediaId')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete trip media' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  @ApiParam({ name: 'mediaId', description: 'Media UUID' })
  async deleteMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
    @Param('mediaId', ParseUUIDPipe) mediaId: string,
  ) {
    return this.tripsService.deleteMedia(user.sub, tripId, mediaId);
  }

  // ─── Reactions ─────────────────────────────────────────────────────────────

  @Post(':id/react')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'React to a trip (helpful / not_helpful)' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async react(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: ReactDto,
  ) {
    return this.tripsService.reactToTrip(user.sub, tripId, dto.reaction_type);
  }

  @Delete(':id/react')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove a reaction from a trip' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async removeReaction(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
  ) {
    return this.tripsService.removeReaction(user.sub, tripId);
  }

  @Get(':id/me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my reaction + favorite state for a trip' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async getMyState(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
  ) {
    return this.tripsService.getMyTripState(user.sub, tripId);
  }

  // ─── Favorites ─────────────────────────────────────────────────────────────

  @Post(':id/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add trip to favorites' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async addFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
  ) {
    return this.tripsService.addFavorite(user.sub, tripId);
  }

  @Delete(':id/favorite')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove trip from favorites' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async removeFavorite(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
  ) {
    return this.tripsService.removeFavorite(user.sub, tripId);
  }

  // ─── Reports ───────────────────────────────────────────────────────────────

  @Post(':id/report')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Report a trip' })
  @ApiParam({ name: 'id', description: 'Trip UUID' })
  async report(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) tripId: string,
    @Body() dto: ReportTripDto,
  ) {
    return this.tripsService.reportTrip(user.sub, tripId, dto.type, dto.reason);
  }
}
