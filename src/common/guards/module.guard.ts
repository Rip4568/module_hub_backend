import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantModuleService } from '../../modules/tenant-module/tenant-module.service';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../context/request.context';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantModuleService: TenantModuleService,
    private cls: ClsService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredModule = this.reflector.get<string>(
      'requiredModule',
      context.getClass(),
    );

    if (!requiredModule) {
      return true;
    }

    const tenantId = this.cls.get(RequestContext.TENANT_ID);

    if (!tenantId) {
      throw new ForbiddenException('Tenant context missing');
    }

    const hasModule = await this.tenantModuleService.isModuleEnabled(
      tenantId,
      requiredModule,
    );

    if (!hasModule) {
      throw new ForbiddenException(
        `Module '${requiredModule}' is not enabled for this tenant`,
      );
    }

    return true;
  }
}
