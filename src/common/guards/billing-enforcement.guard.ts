import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../context/request.context';
import { SKIP_BILLING_CHECK_KEY } from '../decorators/skip-billing-check.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { TenantService } from '../../modules/tenant/tenant.service';
import { TenantStatus } from '../../modules/tenant/entities/tenant.entity';

@Injectable()
export class BillingEnforcementGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cls: ClsService,
    private tenantService: TenantService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipBilling = this.reflector.getAllAndOverride<boolean>(SKIP_BILLING_CHECK_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skipBilling) {
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

    if (tenant.status === TenantStatus.SUSPENDED) {
      throw new ForbiddenException({
        code: 'TENANT_SUSPENDED',
        message: 'This account has been suspended. Please contact support.',
        suggestedAction: 'CONTACT_SUPPORT',
      });
    }

    if (tenant.trialEndsAt && new Date() > new Date(tenant.trialEndsAt)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          code: 'TRIAL_EXPIRED',
          message: 'Your trial period has expired. Please upgrade your plan to continue.',
          suggestedAction: 'UPGRADE_PLAN',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    return true;
  }
}
