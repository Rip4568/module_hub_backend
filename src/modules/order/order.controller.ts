import { Controller, Get, Post, Put, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Permissions } from '../../common/constants/permissions';
import { CreateOrderDto, UpdateOrderDto } from './dto/create-order.dto';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('order_management')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post()
  @RequiresPermission(Permissions.CREATE_ORDER)
  create(@CurrentTenant() tenantId: string, @Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create({ ...createOrderDto, tenantId });
  }

  @Get()
  @RequiresPermission(Permissions.READ_ORDER)
  findAll(@CurrentTenant() tenantId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return this.orderService.findAll(tenantId, page, limit);
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_ORDER)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.orderService.findOne(id, tenantId);
  }

  @Put(':id')
  @RequiresPermission(Permissions.UPDATE_ORDER)
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, { ...updateOrderDto, tenantId });
  }

  @Post(':id/cancel')
  @RequiresPermission(Permissions.CANCEL_ORDER)
  cancel(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body('reason') reason: string) {
    return this.orderService.cancel(id, reason, tenantId);
  }

  @Post(':id/approve')
  @RequiresPermission(Permissions.APPROVE_ORDER)
  approve(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.orderService.approve(id, tenantId);
  }

  @Post(':id/assign')
  @RequiresPermission(Permissions.ASSIGN_DRIVER)
  assignResources(@CurrentTenant() tenantId: string, @Param('id') id: string, @Body() body: { driverId: string, vehicleId?: string }) {
    if (!body.driverId) throw new Error('Driver ID is required');
    return this.orderService.assignResources(id, body.driverId, body.vehicleId, tenantId);
  }

  @Post(':id/complete')
  @RequiresPermission(Permissions.COMPLETE_ORDER)
  complete(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.orderService.complete(id, tenantId);
  }

  @Post(':id/dispatch')
  @RequiresPermission(Permissions.UPDATE_ORDER) // Or a specific DISPATCH_ORDER if exists
  dispatch(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.orderService.dispatch(id, tenantId);
  }
}
