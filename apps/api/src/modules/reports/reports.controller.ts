import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, ReportStatus } from '../../common/enums';

@ApiTags('Reports')
@ApiBearerAuth('JWT-auth')
@Controller({ path: 'reports', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a report against a trip, comment, or user' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportsService.create(user.sub, dto);
  }

  @Get()
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[ADMIN] Get all reports' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ReportStatus })
  @ApiQuery({ name: 'target_type', required: false })
  async getAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ReportStatus,
    @Query('target_type') targetType?: string,
  ) {
    return this.reportsService.getAll(page ?? 1, limit ?? 20, status, targetType);
  }

  @Get(':id')
  @Roles(UserRole.MODERATOR, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '[ADMIN] Get report by ID' })
  @ApiParam({ name: 'id', description: 'Report UUID' })
  async findById(@Param('id', ParseUUIDPipe) reportId: string) {
    return this.reportsService.findById(reportId);
  }
}
