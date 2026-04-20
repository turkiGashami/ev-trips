import {
  Controller,
  Get,
  Post,
  Delete,
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

import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard, Public } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser, JwtPayload } from '../auth/decorators/current-user.decorator';

@ApiTags('Comments')
@Controller({ path: 'comments', version: '1' })
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add a comment to a trip' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.sub, dto);
  }

  @Public()
  @Get('trip/:tripId')
  @ApiOperation({ summary: 'Get comments for a trip (public)' })
  @ApiParam({ name: 'tripId', description: 'Trip UUID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTripComments(
    @Param('tripId', ParseUUIDPipe) tripId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.commentsService.getTripComments(tripId, page ?? 1, limit ?? 20);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete own comment (soft delete)' })
  @ApiParam({ name: 'id', description: 'Comment UUID' })
  async delete(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) commentId: string,
  ) {
    return this.commentsService.deleteComment(user.sub, commentId);
  }
}
