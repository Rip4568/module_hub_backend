import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../context/request.context';
import { SKIP_ONBOARDING_CHECK_KEY } from '../decorators/skip-onboarding-check.decorator';
import { ALLOW_DURING_ONBOARDING_KEY } from '../decorators/allow-during-onboarding.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TenantService } from '../../modules/tenant/tenant.service';

@Injectable()
export class OnboardingEnforcementGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cls: ClsService,
    private tenantService: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipOnboarding = this.reflector.getAllAndOverride<boolean>(SKIP_ONBOARDING_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipOnboarding) {
      return true;
    }

    const allowDuringOnboarding = this.reflector.getAllAndOverride<boolean>(
      ALLOW_DURING_ONBOARDING_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (allowDuringOnboarding) {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const tenantId = this.cls.get<string>(RequestContext.TENANT_ID);
    if (!tenantId) {
      return true;
    }

    const tenant = await this.tenantService.findMyTenant(tenantId);
    if (!tenant) {
      return true;
    }

    if (tenant.config?.onboardingCompleted === true) {
      return true;
    }

    throw new ForbiddenException({
      code: 'ONBOARDING_REQUIRED',
      message: 'Complete o onboarding antes de acessar este recurso.',
      suggestedAction: 'COMPLETE_ONBOARDING',
    });
  }
}
