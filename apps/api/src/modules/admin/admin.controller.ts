import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../../common/enums';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ── STATS ──────────────────────────────────────────────────────────────
  @Get('stats')
  getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ── USERS ──────────────────────────────────────────────────────────────
  @Get('users')
  getUsers(@Query() query: any) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/status')
  updateUserStatus(
    @CurrentUser() actor: any,
    @Param('id') id: string,
    @Body() body: { status: string; note?: string },
  ) {
    return this.adminService.updateUserStatus(actor.id, id, body.status, body.note);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @CurrentUser() actor: any,
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    return this.adminService.updateUserRole(actor.id, id, body.role);
  }

  @Post('users/:id/badges')
  awardBadge(
    @CurrentUser() actor: any,
    @Param('id') userId: string,
    @Body() body: { badgeId: string },
  ) {
    return this.adminService.awardBadge(actor.id, userId, body.badgeId);
  }

  // ── TRIPS ──────────────────────────────────────────────────────────────
  @Get('trips')
  getTrips(@Query() query: any) {
    return this.adminService.getTrips(query);
  }

  @Get('trips/pending')
  getPendingTrips() {
    return this.adminService.getPendingTrips();
  }

  @Patch('trips/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveTrip(@CurrentUser() actor: any, @Param('id') id: string) {
    return this.adminService.approveTrip(actor.id, id);
  }

  @Patch('trips/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectTrip(
    @CurrentUser() actor: any,
    @Param('id') id: string,
    @Body() body: { reason: string },
  ) {
    return this.adminService.rejectTrip(actor.id, id, body.reason);
  }

  @Patch('trips/:id/hide')
  @HttpCode(HttpStatus.OK)
  hideTrip(@CurrentUser() actor: any, @Param('id') id: string) {
    return this.adminService.hideTrip(actor.id, id);
  }

  @Patch('trips/:id/feature')
  @HttpCode(HttpStatus.OK)
  featureTrip(
    @CurrentUser() actor: any,
    @Param('id') id: string,
    @Body() body: { featured: boolean },
  ) {
    return this.adminService.featureTrip(actor.id, id, body.featured);
  }

  // ── COMMENTS ───────────────────────────────────────────────────────────
  @Get('comments')
  getComments(@Query() query: any) {
    return this.adminService.getComments(query);
  }

  @Patch('comments/:id/hide')
  hideComment(@CurrentUser() actor: any, @Param('id') id: string) {
    return this.adminService.hideComment(actor.id, id);
  }

  @Patch('comments/:id/restore')
  restoreComment(@CurrentUser() actor: any, @Param('id') id: string) {
    return this.adminService.restoreComment(actor.id, id);
  }

  @Delete('comments/:id')
  deleteComment(@CurrentUser() actor: any, @Param('id') id: string) {
    return this.adminService.deleteComment(actor.id, id);
  }

  // ── REPORTS ────────────────────────────────────────────────────────────
  @Get('reports')
  getReports(@Query() query: any) {
    return this.adminService.getReports(query);
  }

  @Patch('reports/:id')
  updateReport(
    @CurrentUser() actor: any,
    @Param('id') id: string,
    @Body() body: { status: string; adminNotes?: string },
  ) {
    return this.adminService.updateReport(actor.id, id, body.status, body.adminNotes);
  }

  // ── BRANDS / MODELS / TRIMS ────────────────────────────────────────────
  @Get('brands')
  getBrands() { return this.adminService.getBrands(); }

  @Post('brands')
  createBrand(@CurrentUser() actor: any, @Body() dto: any) {
    return this.adminService.createBrand(actor.id, dto);
  }

  @Patch('brands/:id')
  updateBrand(@CurrentUser() actor: any, @Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateBrand(actor.id, id, dto);
  }

  @Delete('brands/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBrand(@CurrentUser() actor: any, @Param('id') id: string) {
    return this.adminService.deleteBrand(actor.id, id);
  }

  @Get('models')
  getModels(@Query('brandId') brandId?: string) { return this.adminService.getModels(brandId); }

  @Post('models')
  createModel(@CurrentUser() actor: any, @Body() dto: any) {
    return this.adminService.createModel(actor.id, dto);
  }

  @Get('trims')
  getTrims(@Query('modelId') modelId?: string) { return this.adminService.getTrims(modelId); }

  @Post('trims')
  createTrim(@CurrentUser() actor: any, @Body() dto: any) {
    return this.adminService.createTrim(actor.id, dto);
  }

  // ── CITIES ─────────────────────────────────────────────────────────────
  @Get('cities')
  getCities() { return this.adminService.getCities(); }

  @Post('cities')
  createCity(@CurrentUser() actor: any, @Body() dto: any) {
    return this.adminService.createCity(actor.id, dto);
  }

  @Patch('cities/:id')
  updateCity(@CurrentUser() actor: any, @Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateCity(actor.id, id, dto);
  }

  // ── CHARGING STATIONS ──────────────────────────────────────────────────
  @Get('stations')
  listStations(@Query() query: any) {
    return this.adminService.listStations(query);
  }

  @Get('stations/:id')
  getStation(@Param('id') id: string) {
    return this.adminService.getStation(id);
  }

  @Post('stations')
  createStation(@CurrentUser() actor: any, @Body() dto: any) {
    return this.adminService.createStation(actor.id, dto);
  }

  @Patch('stations/:id')
  updateStation(@CurrentUser() actor: any, @Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateStation(actor.id, id, dto);
  }

  @Delete('stations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteStation(@CurrentUser() actor: any, @Param('id') id: string) {
    return this.adminService.deleteStation(actor.id, id);
  }

  @Post('stations/:id/toggle-active')
  @HttpCode(HttpStatus.OK)
  toggleStationActive(@CurrentUser() actor: any, @Param('id') id: string) {
    return this.adminService.toggleStationActive(actor.id, id);
  }

  // ── STATIC PAGES ───────────────────────────────────────────────────────
  @Get('pages')
  getStaticPages() { return this.adminService.getStaticPages(); }

  @Patch('pages/:key')
  updateStaticPage(
    @CurrentUser() actor: any,
    @Param('key') key: string,
    @Body() dto: any,
  ) {
    return this.adminService.updateStaticPage(actor.id, key, dto);
  }

  // ── BANNERS ────────────────────────────────────────────────────────────
  @Get('banners')
  getBanners() { return this.adminService.getBanners(); }

  @Post('banners')
  createBanner(@CurrentUser() actor: any, @Body() dto: any) {
    return this.adminService.createBanner(actor.id, dto);
  }

  @Patch('banners/:id')
  updateBanner(@CurrentUser() actor: any, @Param('id') id: string, @Body() dto: any) {
    return this.adminService.updateBanner(actor.id, id, dto);
  }

  @Delete('banners/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteBanner(@CurrentUser() actor: any, @Param('id') id: string) {
    return this.adminService.deleteBanner(actor.id, id);
  }

  // ── SETTINGS ───────────────────────────────────────────────────────────
  @Get('settings')
  getSettings() { return this.adminService.getSettings(); }

  @Patch('settings')
  updateSetting(
    @CurrentUser() actor: any,
    @Body() body: { key: string; value: string },
  ) {
    return this.adminService.updateSetting(actor.id, body.key, body.value);
  }

  // ── ADMIN LOGS ─────────────────────────────────────────────────────────
  @Get('logs')
  getAdminLogs(@Query() query: any) {
    return this.adminService.getAdminLogs(query);
  }
}
