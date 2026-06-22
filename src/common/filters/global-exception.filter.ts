import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { mapPostgresError } from '../utils/postgres-error.mapper';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] | object = 'Internal server error';
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
          suggestedAction?: string;
        };
        message = responseBody.message ?? res;
        code = responseBody.code ?? responseBody.error ?? 'HTTP_ERROR';
      }
    } else if (exception instanceof QueryFailedError) {
      const driverError = (exception as QueryFailedError & { driverError?: Record<string, string> })
        .driverError;
      const mapped = mapPostgresError(driverError ?? {});

      if (mapped) {
        status = mapped.status;
        message = mapped.message;
        code = mapped.code;
      } else {
        message = 'Erro ao processar operação no banco de dados.';
        code = 'DATABASE_ERROR';
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const normalizedMessage = Array.isArray(message) ? message.join(', ') : message;

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(exception);
    } else {
      this.logger.warn(`Caught exception: ${status} - ${JSON.stringify(normalizedMessage)}`);
    }

    response.status(status).json({
      statusCode: status,
      message: normalizedMessage,
      code,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
