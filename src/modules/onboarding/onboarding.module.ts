import { Module } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { TenantModule } from '../tenant/tenant.module';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';
import { PlanModule } from '../plan/plan.module';

@Module({
  imports: [TenantModule, TenantModuleModule, PlanModule],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule {}
