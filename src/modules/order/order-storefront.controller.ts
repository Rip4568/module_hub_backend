import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { OrderService } from './order.service';
import { Public } from '../../common/decorators/public.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';

@Controller('storefront/:tenantId/orders')
@Public()
@UseGuards(TenantGuard, ModuleGuard, ThrottlerGuard)
@RequiresModule('order_management')
export class OrderStorefrontController {
  constructor(private readonly orderService: OrderService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('checkout')
  checkout(@Param('tenantId') tenantId: string, @Body() checkoutData: Record<string, unknown>) {
    return this.orderService.checkout(tenantId, checkoutData);
  }
}
