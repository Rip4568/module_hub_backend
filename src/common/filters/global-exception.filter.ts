import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
        code = 'HTTP_ERROR';
      } else {
        const responseBody = res as {
          message?: string | string[];
          error?: string;
          code?: string;
        };
        message = responseBody.message || res;
        code = responseBody.code || responseBody.error || 'HTTP_ERROR';
      }
    } else if (exception instanceof QueryFailedError) {
      // Map TypeORM / Database Errors
      const driverError = (exception as any).driverError;
      if (driverError) {
        switch (driverError.code) {
          case '23505': // Unique violation
            status = HttpStatus.CONFLICT;
            message = 'Duplicate entry unique constraint violation';
            code = 'DUPLICATE_ENTRY';
            // Try to parse detailed message
            if (driverError.detail) {
              message = driverError.detail;
            }
            break;
          case '23502': // Not null violation
            status = HttpStatus.BAD_REQUEST;
            message = 'Missing required field (not null violation)';
            code = 'MISSING_FIELD';
            if (driverError.column) {
              message = `Field '${driverError.column}' is required`;
            }
            break;
          case '23503': // Foreign key violation
            status = HttpStatus.BAD_REQUEST;
            message = 'Foreign key violation: Referenced entity does not exist';
            code = 'INVALID_REFERENCE';
            if (driverError.detail) {
              message = driverError.detail;
            }
            break;
        }
      }
    } else if (exception instanceof Error) {
      // Other common errors
      message = exception.message;
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    } else {
      this.logger.warn(`Caught exception: ${status} - ${JSON.stringify(message)}`);
    }

    response.status(status).json({
      statusCode: status,
      message,
      code,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
