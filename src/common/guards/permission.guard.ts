import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionService } from '../../modules/permission/permission.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = user?.tenantId;

    if (!user) {
      throw new UnauthorizedException({
        code: 'AUTH_REQUIRED',
        message: 'User not authenticated',
        suggestedAction: 'LOGIN',
      });
    }

    if (!tenantId) {
      throw new ForbiddenException({
        code: 'TENANT_REQUIRED',
        message: 'Tenant context missing',
        suggestedAction: 'SELECT_TENANT',
      });
    }

    const hasPermissions = await this.permissionService.userHasPermissions(
      user.userId, // JWT payload has userId
      tenantId,
      requiredPermissions,
    );

    if (!hasPermissions) {
      throw new ForbiddenException({
        code: 'PERMISSION_DENIED',
        message: 'You do not have permission for this operation',
        suggestedAction: 'REQUEST_PERMISSION',
      });
    }

    return true;
  }
}
