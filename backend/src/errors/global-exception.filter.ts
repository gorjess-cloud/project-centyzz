
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';

import type { Request, Response } from 'express';
import type { AuthenticatedUser } from '../auth/jwt-auth.guard.js';
import { ErrorLoggingService } from './error-logging.service.js';

type RequestWithUser = Request & {
  user?: AuthenticatedUser;
};

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private readonly errorLoggingService: ErrorLoggingService,
  ) {}

  async catch(
    exception: unknown,
    host: ArgumentsHost,
  ): Promise<void> {
    const ctx = host.switchToHttp();

    const request = ctx.getRequest<RequestWithUser>();
    const response = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;

    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    // Preserve normal client errors without saving them.
    if (statusCode < 500 && isHttpException) {
      const body = exception.getResponse();

      if (!response.headersSent) {
        response.status(statusCode).json(
          typeof body === 'object' && body !== null
            ? body
            : {
                statusCode,
                message: String(body),
              },
        );
      }

      return;
    }

    const error =
      exception instanceof Error
        ? exception
        : new Error('Unexpected server exception');

    const actorId = request.user?.sub;

    this.logger.error(
      `Server error ${statusCode} at ${request.method} ${request.path}`,
    );

    await this.errorLoggingService.saveError({
      actorId: Number.isInteger(actorId) ? actorId! : null,
      errorName: error.name,
      errorMessage: error.message,
      stackTrace: error.stack ?? null,
      httpMethod: request.method ?? null,
      requestPath: request.path ?? null,
      statusCode,
    });

    // Don't reveal technical details to the client.
    if (!response.headersSent) {
      response.status(statusCode).json({
        statusCode,
        message: 'An internal server error occurred',
        error: 'Internal Server Error',
      });
    }
  }
}
