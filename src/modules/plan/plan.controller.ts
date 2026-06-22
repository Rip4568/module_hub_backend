import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlanService } from './plan.service';
import { Public } from '../../common/decorators/public.decorator';
import { SkipBillingCheck } from '../../common/decorators/skip-billing-check.decorator';

@ApiTags('Plans')
@Controller('plans')
@Public()
@SkipBillingCheck()
export class PlanController {
  constructor(private readonly planService: PlanService) {}

  @Get()
  findAll() {
    return this.planService.findAll().then((plans) =>
      plans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        priceCents: plan.priceCents,
        currency: plan.currency,
        maxBillableModules: plan.maxBillableModules,
        isContactOnly: plan.isContactOnly,
        sortOrder: plan.sortOrder,
      })),
    );
  }
}
