import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError, EntityNotFoundError } from 'typeorm';

interface ApiErrorResponse {
  success: false;
  data: null;
  message: string;
  errors?: any[];
  statusCode: number;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as Record<string, any>;
        message = resp.message || exception.message;

        if (Array.isArray(resp.message)) {
          errors = resp.message;
          message = 'Validation failed';
        }
      }
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      const pgError = exception as any;

      if (pgError.code === '23505') {
        // Unique violation
        message = 'A record with this value already exists';
        status = HttpStatus.CONFLICT;
      } else if (pgError.code === '23503') {
        // Foreign key violation
        message = 'Referenced record does not exist';
      } else if (pgError.code === '23502') {
        // Not null violation
        message = 'Required field is missing';
      } else {
        message = 'Database query failed';
        status = HttpStatus.INTERNAL_SERVER_ERROR;
      }

      this.logger.error(
        `QueryFailedError [${pgError.code}]: ${exception.message}`,
        exception.stack,
      );
    } else if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'Resource not found';
    } else if (exception instanceof Error) {
      this.logger.error(`Unhandled exception: ${exception.message}`, exception.stack);
      message = 'An unexpected error occurred';
    }

    // Don't expose internals in production
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Internal Server Error: ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const errorBody: ApiErrorResponse = {
      success: false,
      data: null,
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (errors?.length) {
      errorBody.errors = errors;
    }

    response.status(status).json(errorBody);
  }
}
