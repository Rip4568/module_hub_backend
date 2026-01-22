import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('order_management')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @RequiresPermission('can_create_order')
  create(@CurrentTenant() tenantId: string, @Request() req: any, @Body() createOrderDto: any) {
    return this.orderService.create(tenantId, req.user.userId, createOrderDto);
  }

  @Get()
  @RequiresPermission('can_read_order')
  findAll(@CurrentTenant() tenantId: string) {
    return this.orderService.findAll(tenantId);
  }

  @Get(':id')
  @RequiresPermission('can_read_order')
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.orderService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequiresPermission('can_update_order')
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateOrderDto: any,
  ) {
    return this.orderService.update(tenantId, id, updateOrderDto);
  }

  @Post(':id/cancel')
  @RequiresPermission('can_cancel_order')
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body('reason') reason: string) {
      return this.orderService.cancel(tenantId, id, reason);
  }

  @Post(':id/approve')
  @RequiresPermission('can_approve_order')
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
      return this.orderService.approve(tenantId, id);
  }

  @Post(':id/assign/:driverId')
  @RequiresPermission('can_assign_driver')
  assignDriver(@CurrentTenant() tenantId: string, @Param('id') id: string, @Param('driverId') driverId: string) {
      return this.orderService.assignDriver(tenantId, id, driverId);
  }

  @Post(':id/complete')
  @RequiresPermission('can_complete_order')
  complete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
      return this.orderService.complete(tenantId, id);
  }
}
