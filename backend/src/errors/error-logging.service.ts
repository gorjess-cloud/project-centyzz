
import { Injectable, Logger } from '@nestjs/common';
import { db } from '../prisma/db.js';

export interface ErrorLogInput {
  actorId: number | null;
  errorName: string;
  errorMessage: string;
  stackTrace: string | null;
  httpMethod: string | null;
  requestPath: string | null;
  statusCode: number;
}

@Injectable()
export class ErrorLoggingService {
  private readonly logger = new Logger(ErrorLoggingService.name);

  private sanitize(value: string): string {
    let result = value;

    // Redact PostgreSQL connection strings.
    result = result.replace(
      /postgres(?:ql)?:\/\/[^\s"'`]+/gi,
      '[REDACTED_DATABASE_URL]',
    );

    // Redact Bearer tokens.
    result = result.replace(
      /\bBearer\s+\S+/gi,
      'Bearer [REDACTED]',
    );

    // Redact JWT tokens.
    result = result.replace(
      /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
      '[REDACTED_JWT]',
    );

    // Redact common credentials.
    result = result.replace(
      /\b(password|token|secret|api[_-]?key)\s*[:=]\s*["']?[^"',\s}]+/gi,
      '$1=[REDACTED]',
    );

    return result;
  }

  async saveError(input: ErrorLogInput): Promise<void> {
    try {
      // Use non-null values for Prisma SQL interpolation.
      // SQL NULLIF converts these placeholders to NULL.
      const actorId = input.actorId ?? 0;

      const errorName = this.sanitize(
        input.errorName,
      ).slice(0, 100);

      const errorMessage = this.sanitize(
        input.errorMessage,
      ).slice(0, 2000);

      const stackTrace = input.stackTrace
        ? this.sanitize(input.stackTrace).slice(0, 8000)
        : '';

      const httpMethod = input.httpMethod
        ? input.httpMethod.slice(0, 10)
        : '';

      const requestPath = input.requestPath
        ? this.sanitize(
            input.requestPath.split('?')[0],
          ).slice(0, 500)
        : '';

      const statusCode = input.statusCode;

      // Insert error record into Neon PostgreSQL.
      const plan = db.raw.sql`
        INSERT INTO public.error_logs (
          actor_id,
          error_name,
          error_message,
          stack_trace,
          http_method,
          request_path,
          status_code
        )
        VALUES (
          NULLIF(${actorId}, 0)::integer,
          ${errorName},
          ${errorMessage},
          NULLIF(${stackTrace}, '')::text,
          NULLIF(${httpMethod}, '')::text,
          NULLIF(${requestPath}, '')::text,
          ${statusCode}
        )
      `
        .affectedCount()
        .build();

      const result = await db.runtime().execute(plan);

      this.logger.log(
        `Error log saved: ${result.affectedRows} row(s)`,
      );
    } catch (error) {
      // Logging failures must not crash the application.
      this.logger.error(
        'Unable to persist error log',
        error instanceof Error
          ? this.sanitize(error.message)
          : 'Unknown error',
      );
    }
  }
}
