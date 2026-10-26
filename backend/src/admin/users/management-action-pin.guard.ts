import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ManagementSecurityService } from '../../auth/management-security.service.js';
import type { AuthenticatedRequest } from '../../auth/jwt-auth.guard.js';

@Injectable()
export class ManagementActionPinGuard implements CanActivate {
  constructor(private readonly security: ManagementSecurityService) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const pin = req.headers['x-management-pin'];
    if (typeof pin !== 'string') throw new UnauthorizedException('Management action PIN required');
    const result = await this.security.verifyPin(req.user.sub, pin);
    if (result.needs_setup) throw new UnauthorizedException('Complete setup first');
    return true;
  }
}
