import { CanActivate, ExecutionContext, Injectable, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { db } from '../prisma/db.js';
import { SuperadminSettingsService } from './superadmin-settings.service.js';

/** Global enforcement registered in SuperadminModule; no Admin/Staff code changes. */
@Injectable()
export class MaintenanceAccessGuard implements CanActivate {
  constructor(private readonly settings: SuperadminSettingsService, private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest<Request>();
    if (req.method === 'OPTIONS') return true;
    const path = (req.originalUrl || req.url).split('?')[0];
    if (path === '/api/maintenance/status') return true;
    // PayMongo authenticates this route with its own signed webhook header.
    if (path === '/api/appointments/paymongo-webhook' && req.method === 'POST') return true;
    // Allow entry/authentication and password recovery, then block restricted business APIs.
    if (req.method === 'POST' && /^\/api\/auth\/(login|google|verify-management-pin|complete-management-setup|register|verify-email|forgot-password|reset-password)$/.test(path)) return true;
    if (!path.startsWith('/api/')) return true;

    // Fail closed if the maintenance configuration cannot be checked.
    const state = await this.settings.getPublicMaintenance();
    if (!state.enabled) return true;
    const authorization = req.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
      try {
        const session = await this.jwt.verifyAsync<{ sub: number; role: string; purpose?: string }>(authorization.slice(7));
        if (Number.isInteger(session.sub) && session.purpose === 'access' &&
            String(session.role).toUpperCase().replace(/[\s_-]/g, '') === 'SUPERADMIN') {
          const account = await db.orm.public.User.where({ id: session.sub }).first();
          if (account?.isActive && String(account.role).toUpperCase().replace(/[\s_-]/g, '') === 'SUPERADMIN') return true;
        }
      } catch { /* Invalid token never bypasses maintenance. */ }
    }
    throw new HttpException({
      code: 'MAINTENANCE_MODE',
      message: state.message,
      duration: state.duration,
    }, 423); // 423 avoids treating planned maintenance as an unhandled server error.
  }
}
