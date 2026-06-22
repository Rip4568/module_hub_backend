import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { SkipBillingCheck } from '../../common/decorators/skip-billing-check.decorator';
import { SkipOnboardingCheck } from '../../common/decorators/skip-onboarding-check.decorator';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';

@ApiTags('Onboarding')
@Controller('onboarding')
@UseGuards(JwtAuthGuard, TenantGuard)
@SkipBillingCheck()
@SkipOnboardingCheck()
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('status')
  getStatus(@CurrentTenant() tenantId: string) {
    return this.onboardingService.getStatus(tenantId);
  }

  @Post('complete')
  complete(@CurrentTenant() tenantId: string, @Body() dto: CompleteOnboardingDto) {
    return this.onboardingService.complete(tenantId, dto);
  }
}
