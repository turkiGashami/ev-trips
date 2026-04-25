import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';

import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../../common/enums';
import { PaginationDto } from '../../common/helpers/pagination.helper';
import { MediaService } from '../media/media.service';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly mediaService: MediaService,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my own profile' })
  async getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.usersService.getProfile(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my profile' })
  async updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload profile avatar' })
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = await this.mediaService.uploadFile(file, `avatars/${user.sub}`);
    return this.usersService.updateAvatar(user.sub, url);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete my account (soft delete)' })
  async deleteAccount(@CurrentUser() user: JwtPayload) {
    return this.usersService.deleteAccount(user.sub);
  }

  @Get('me/stats')
  @ApiOperation({ summary: 'Get my stats (trips, views, etc.)' })
  async getMyStats(@CurrentUser() user: JwtPayload) {
    return this.usersService.getUserStats(user.sub);
  }

  @Get('me/following')
  @ApiOperation({ summary: 'Get users I am following' })
  async getMyFollowing(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.getFollowing(user.sub, pagination);
  }

  @Get('me/followers')
  @ApiOperation({ summary: 'Get my followers' })
  async getMyFollowers(
    @CurrentUser() user: JwtPayload,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.getFollowers(user.sub, pagination);
  }

  @Post(':id/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({ name: 'id', description: 'User ID to follow' })
  async followUser(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) targetId: string,
  ) {
    return this.usersService.followUser(user.sub, targetId);
  }

  @Delete(':id/follow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unfollow a user' })
  async unfollowUser(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) targetId: string,
  ) {
    return this.usersService.unfollowUser(user.sub, targetId);
  }

  @Public()
  @Get('search')
  @ApiOperation({ summary: 'Search public user profiles' })
  async searchUsers(
    @Query('q') query: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.searchUsers(query || '', pagination);
  }

  @Public()
  @Get(':username/profile')
  @ApiOperation({ summary: 'Get a public user profile by username' })
  async getPublicProfile(@Param('username') username: string) {
    return this.usersService.getPublicProfileWithStats(username);
  }

  @Public()
  @Get(':username/trips')
  @ApiOperation({ summary: 'Get published trips for a user (by username)' })
  async getUserTrips(
    @Param('username') username: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
  ) {
    return this.usersService.getUserPublishedTrips(username, limit, page);
  }

  @Public()
  @Get(':id/followers')
  @ApiOperation({ summary: 'Get followers of a user' })
  async getFollowers(
    @Param('id', ParseUUIDPipe) userId: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.usersService.getFollowers(userId, pagination);
  }

  // ─── Admin-only endpoints ───────────────────────────────────────────────────

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MODERATOR)
  @ApiOperation({ summary: '[ADMIN] Get user by ID' })
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findById(id);
  }
}
