import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    const userId = (request as any).user?.id || 'anonymous';

    return next.handle().pipe(
      tap(() => {
        const { statusCode } = response;
        const duration = Date.now() - startTime;
        this.logger.log(
          `${method} ${url} ${statusCode} ${duration}ms - ${ip} - ${userAgent} - user:${userId}`,
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        this.logger.error(
          `${method} ${url} ${error.status || 500} ${duration}ms - ${ip} - user:${userId} - ${error.message}`,
        );
        throw error;
      }),
    );
  }
}
