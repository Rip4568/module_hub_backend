import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../context/request.context';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cls: ClsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'User not authenticated',
        suggestedAction: 'LOGIN',
      });
    }

    const tenantId = request.user.tenantId;

    if (!tenantId) {
      throw new ForbiddenException({
        code: 'TENANT_REQUIRED',
        message: 'Tenant ID missing from user context',
        suggestedAction: 'SELECT_TENANT',
      });
    }

    this.cls.set(RequestContext.TENANT_ID, tenantId);
    this.cls.set(RequestContext.USER_ID, request.user.userId);

    return true;
  }
}
