import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, concatMap } from 'rxjs';
import type { AuthenticatedRequest } from '../../auth/jwt-auth.guard.js';
import { OperationalLogsService } from './operational-logs.service.js';

// Explicit allowlist: reads, log maintenance, reports and Superadmin routes never record here.
const actions: Record<string, Record<string, [string, string]>> = {
  UsersController: {
    createUser: ['Staff & Service', 'User Created'],
    updateUser: ['Staff & Service', 'User Updated'],
    toggleStatus: ['Staff & Service', 'User Status Updated'],
    toggleArchive: ['Staff & Service', 'User Archive Updated'],
  },
  ClientsController: {
    createClient: ['Client & Appointments', 'Client Created'],
    updateClient: ['Client & Appointments', 'Client Updated'],
    toggleArchive: ['Client & Appointments', 'Client Archive Updated'],
    addClientBooking: ['Client & Appointments', 'Client Booking Recorded'],
  },
  ServicesController: {
    createService: ['Staff & Service', 'Service Created'],
    updateService: ['Staff & Service', 'Service Updated'],
    toggleStatus: ['Staff & Service', 'Service Status Updated'],
    toggleArchive: ['Staff & Service', 'Service Archive Updated'],
  },
  PromosController: { savePromo: ['POS & Financial', 'Promo Saved'] },
};

@Injectable()
export class AdminOperationalEventInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AdminOperationalEventInterceptor.name);
  constructor(private readonly logs: OperationalLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const action = actions[context.getClass().name]?.[context.getHandler().name];
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!action || !Number.isInteger(request.user?.sub)) return next.handle();
    // One recording attempt per HTTP execution, even if a handler emits multiple values.
    let recorded = false;
    return next.handle().pipe(concatMap(async (response: any) => {
      if (recorded || response == null || response.success === false) return response;
      recorded = true;
      const candidate = response.id ?? request.params?.id;
      const id = /^\d+$/.test(String(candidate)) ? String(candidate) : null;
      try {
        await this.logs.record({
          module: action[0], event: action[1], actorUserId: request.user.sub,
          userName: `User #${request.user.sub}`, userRole: request.user.role,
          details: id ? `Record ID: ${id}` : 'Operation completed', status: 'Logged',
        });
      } catch {
        // A logging outage must not turn a committed operation into a retry/duplicate mutation.
        // Never print database errors, request bodies, headers or onboarding credentials.
        this.logger.error('Operational event recording failed');
      }
      return response;
    }));
  }
}
