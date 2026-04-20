import { IsInt, IsOptional, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { SelectQueryBuilder } from 'typeorm';
import { PaginationMeta, PaginatedResult } from '../interceptors/transform.interceptor';

export class PaginationDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

import { ObjectLiteral } from 'typeorm';

export async function paginateQuery<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  page: number,
  limit: number,
): Promise<PaginatedResult<T>> {
  const numLimit = Number(limit) || 20;
  const numPage = Number(page) || 1;
  const safeLimit = Math.min(Math.max(numLimit, 1), 100);
  const safePage = Math.max(numPage, 1);
  const skip = (safePage - 1) * safeLimit;

  const [items, total] = await queryBuilder
    .skip(skip)
    .take(safeLimit)
    .getManyAndCount();

  return {
    items,
    meta: buildPaginationMeta(safePage, safeLimit, total),
  };
}

export function getPaginationParams(page: number = 1, limit: number = 20): {
  skip: number;
  take: number;
  page: number;
  limit: number;
} {
  const numLimit = Number(limit) || 20;
  const numPage = Number(page) || 1;
  const safeLimit = Math.min(Math.max(numLimit, 1), 100);
  const safePage = Math.max(numPage, 1);
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
  };
}
