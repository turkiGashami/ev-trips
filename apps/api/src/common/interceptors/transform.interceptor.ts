import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: PaginationMeta;
  message?: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If handler already returned the full API response shape
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // If paginated result
        if (data && typeof data === 'object' && 'items' in data && 'meta' in data) {
          const paginated = data as PaginatedResult<T>;
          return {
            success: true,
            data: paginated.items as unknown as T,
            message: paginated.message,
            meta: paginated.meta,
          };
        }

        return {
          success: true,
          data: data ?? null,
        };
      }),
    );
  }
}
