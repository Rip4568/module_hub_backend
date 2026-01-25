import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../context/request.context';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cls: ClsService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const tenantId = this.cls.get(RequestContext.TENANT_ID);

    if (!tenantId) {
      throw new ForbiddenException('Tenant context missing');
    }

    if (!isPublic && (!request.user || request.user.tenantId !== tenantId)) {
      throw new UnauthorizedException('Invalid tenant access');
    }

    return true;
  }
}
