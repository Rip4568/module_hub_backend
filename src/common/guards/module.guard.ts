import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantModuleService } from '../../modules/tenant-module/tenant-module.service';

@Injectable()
export class ModuleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantModuleService: TenantModuleService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.get<string>(
      'requiredModule',
      context.getClass(),
    );

    if (!requiredModule) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const tenantId = request.user?.tenantId;

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
