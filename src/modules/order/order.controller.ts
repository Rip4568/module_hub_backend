import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrderService } from './order.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('order_management')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  @RequiresPermission(Permissions.CREATE_ORDER)
  create(@CurrentTenant() tenantId: string, @Request() req: any, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(tenantId, req.user.userId, createOrderDto);
  }

  @Get()
  @RequiresPermission(Permissions.READ_ORDER)
  findAll(@CurrentTenant() tenantId: string) {
    return this.orderService.findAll(tenantId);
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_ORDER)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.orderService.findOne(tenantId, id);
  }

  @Put(':id')
  @RequiresPermission(Permissions.UPDATE_ORDER)
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(tenantId, id, updateOrderDto);
  }

  @Post(':id/cancel')
  @RequiresPermission(Permissions.CANCEL_ORDER)
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body('reason') reason: string) {
    return this.orderService.cancel(tenantId, id, reason);
  }

  @Post(':id/approve')
  @RequiresPermission(Permissions.APPROVE_ORDER)
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.orderService.approve(tenantId, id);
  }

  @Post(':id/assign/:driverId')
  @RequiresPermission(Permissions.ASSIGN_DRIVER)
  assignDriver(@CurrentTenant() tenantId: string, @Param('id') id: string, @Param('driverId') driverId: string) {
    return this.orderService.assignDriver(tenantId, id, driverId);
  }

  @Post(':id/complete')
  @RequiresPermission(Permissions.COMPLETE_ORDER)
  complete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.orderService.complete(tenantId, id);
  }
}
