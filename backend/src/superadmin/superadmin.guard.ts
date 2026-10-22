
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';

@Injectable()
export class SuperadminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.sub;

    if (!Number.isInteger(userId)) {
      throw new UnauthorizedException('Authentication required');
    }

    const user = await db.orm.public.User.where({
      id: userId,
    }).first();

    if (!user || !user.isActive) {
      throw new ForbiddenException('Account unavailable');
    }

    if (user.role !== 'SUPERADMIN') {
      throw new ForbiddenException(
        'Superadmin access required',
      );
    }

    return true;
  }
}
