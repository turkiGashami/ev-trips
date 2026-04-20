import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';

import { Comment } from '../../entities/comment.entity';
import { Trip } from '../../entities/trip.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentStatus, TripStatus } from '../../common/enums';
import { PaginatedResult } from '../../common/interceptors/transform.interceptor';
import { paginateQuery } from '../../common/helpers/pagination.helper';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
  ) {}

  async create(userId: string, dto: CreateCommentDto): Promise<Comment> {
    const trip = await this.tripRepo.findOne({
      where: { id: dto.trip_id, deleted_at: IsNull() },
    });

    if (!trip || trip.status !== TripStatus.PUBLISHED) {
      throw new NotFoundException('Trip not found');
    }

    if (dto.parent_id) {
      const parent = await this.commentRepo.findOne({
        where: { id: dto.parent_id, trip_id: dto.trip_id, deleted_at: IsNull() },
      });

      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }

      // Increment reply count on parent
      await this.commentRepo.increment({ id: dto.parent_id }, 'reply_count', 1);
    }

    const comment = this.commentRepo.create({
      trip_id: dto.trip_id,
      user_id: userId,
      parent_id: dto.parent_id ?? null,
      content: dto.content,
      status: CommentStatus.VISIBLE,
    });

    const saved = await this.commentRepo.save(comment);

    // Increment comment count on trip
    await this.tripRepo.increment({ id: dto.trip_id }, 'comment_count', 1);

    this.logger.log(`Comment created ${saved.id} by user ${userId} on trip ${dto.trip_id}`);

    return this.commentRepo.findOne({
      where: { id: saved.id },
      relations: ['user'],
    }) as Promise<Comment>;
  }

  async getTripComments(
    tripId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<PaginatedResult<Comment>> {
    const trip = await this.tripRepo.findOne({
      where: { id: tripId, deleted_at: IsNull() },
    });

    if (!trip || trip.status !== TripStatus.PUBLISHED) {
      throw new NotFoundException('Trip not found');
    }

    const qb = this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.replies', 'replies', 'replies.deleted_at IS NULL AND replies.status = :vis', { vis: CommentStatus.VISIBLE })
      .leftJoinAndSelect('replies.user', 'reply_user')
      .where('comment.trip_id = :tripId', { tripId })
      .andWhere('comment.parent_id IS NULL')
      .andWhere('comment.deleted_at IS NULL')
      .andWhere('comment.status = :status', { status: CommentStatus.VISIBLE })
      .orderBy('comment.created_at', 'ASC');

    return paginateQuery(qb, page, limit);
  }

  async deleteComment(userId: string, commentId: string): Promise<{ message: string }> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId, deleted_at: IsNull() },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Soft delete
    await this.commentRepo.update(commentId, {
      deleted_at: new Date(),
      status: CommentStatus.DELETED,
    });

    // Decrement trip comment count
    await this.tripRepo.decrement({ id: comment.trip_id }, 'comment_count', 1);

    // Decrement parent reply count if this is a reply
    if (comment.parent_id) {
      await this.commentRepo.decrement({ id: comment.parent_id }, 'reply_count', 1);
    }

    this.logger.log(`Comment ${commentId} soft-deleted by user ${userId}`);
    return { message: 'Comment deleted successfully' };
  }

  async hideComment(commentId: string, moderationNote?: string): Promise<Comment> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    comment.status = CommentStatus.HIDDEN;
    comment.moderation_note = moderationNote ?? null;

    return this.commentRepo.save(comment);
  }

  async findById(commentId: string): Promise<Comment> {
    const comment = await this.commentRepo.findOne({
      where: { id: commentId, deleted_at: IsNull() },
      relations: ['user'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async getAllComments(
    page: number = 1,
    limit: number = 20,
    tripId?: string,
    status?: CommentStatus,
  ): Promise<PaginatedResult<Comment>> {
    const qb = this.commentRepo
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.user', 'user')
      .leftJoinAndSelect('comment.trip', 'trip')
      .where('comment.deleted_at IS NULL');

    if (tripId) {
      qb.andWhere('comment.trip_id = :tripId', { tripId });
    }

    if (status) {
      qb.andWhere('comment.status = :status', { status });
    }

    qb.orderBy('comment.created_at', 'DESC');

    return paginateQuery(qb, page, limit);
  }
}
