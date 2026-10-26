import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { db } from '../prisma/db.js';
import { ManagementSecurityService, isManagementRole } from './management-security.service.js';

export interface AuthenticatedUser {
  sub: number;
  email: string;
  role: string;
  purpose: 'access';
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService, private readonly managementSecurity: ManagementSecurityService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Authentication required');
    }

    try {
      const user = await this.jwtService.verifyAsync<AuthenticatedUser>(
        authorization.slice('Bearer '.length),
      );
      if (!Number.isInteger(user.sub) || !user.email || user.purpose !== 'access') {
        throw new UnauthorizedException('Invalid access token');
      }

      // Checking persisted account status also blocks tokens issued before PIN rollout,
      // deactivated users, and sessions that have not completed first-time setup.
      const account = await db.orm.public.User.where({ id: user.sub }).first();
      if (!account || !account.isActive || account.email !== user.email ||
          String(account.role).toUpperCase().replace(/[\s_-]+/g, '') !== user.role) {
        throw new UnauthorizedException('Account unavailable');
      }
      if (isManagementRole(account.role)) {
        const security = await this.managementSecurity.requireConfigured(user.sub);
        if (security.needs_setup) throw new UnauthorizedException('Complete management account setup first');
      }
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }
}