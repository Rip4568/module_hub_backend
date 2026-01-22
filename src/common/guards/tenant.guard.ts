import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenantId) {
      throw new ForbiddenException('Tenant context missing');
    }

    // You might want to verify if the tenant actually exists and is active here
    // But for performance, relying on the JWT claim (tenantId) is often enough
    // provided that the JWT is invalidated if the tenant is suspended.

    // Attaching tenant info to request if needed, but tenantId is already in user
    request.tenant = { id: user.tenantId };

    return true;
  }
}
