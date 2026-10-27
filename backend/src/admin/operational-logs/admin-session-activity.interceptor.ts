import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, concatMap } from 'rxjs';
import { OperationalLogsService } from './operational-logs.service.js';

@Injectable()
export class AdminSessionActivityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AdminSessionActivityInterceptor.name);
  constructor(private readonly logs: OperationalLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getClass().name !== 'AuthController' ||
        !['verifyManagementPin', 'completeManagementSetup'].includes(context.getHandler().name)) {
      return next.handle();
    }
    let attempted = false;
    return next.handle().pipe(concatMap(async (response: any) => {
      const user = response?.data?.user;
      const token = response?.data?.accessToken;
      if (attempted || response?.success !== true || user?.mustCompleteSetup !== false ||
          !['ADMIN', 'STAFF'].includes(user?.role) || !Number.isInteger(user?.id) || typeof token !== 'string') {
        return response;
      }
      attempted = true;
      try { await this.logs.recordSession(user.id, 'Signed In', token); }
      catch { this.logger.error('Admin/Staff sign-in recording failed'); }
      return response;
    }));
  }
}
