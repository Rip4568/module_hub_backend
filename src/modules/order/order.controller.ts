import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
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
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.create(createOrderDto);
  }

  @Get()
  @RequiresPermission(Permissions.READ_ORDER)
  findAll() {
    return this.orderService.findAll();
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_ORDER)
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Put(':id')
  @RequiresPermission(Permissions.UPDATE_ORDER)
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
  ) {
    return this.orderService.update(id, updateOrderDto);
  }

  @Post(':id/cancel')
  @RequiresPermission(Permissions.CANCEL_ORDER)
  cancel(@Param('id') id: string, @Body('reason') reason: string) {
    return this.orderService.cancel(id, reason);
  }

  @Post(':id/approve')
  @RequiresPermission(Permissions.APPROVE_ORDER)
  approve(@Param('id') id: string) {
    return this.orderService.approve(id);
  }

  @Post(':id/assign/:driverId')
  @RequiresPermission(Permissions.ASSIGN_DRIVER)
  assignDriver(@Param('id') id: string, @Param('driverId') driverId: string) {
    return this.orderService.assignDriver(id, driverId);
  }

  @Post(':id/complete')
  @RequiresPermission(Permissions.COMPLETE_ORDER)
  complete(@Param('id') id: string) {
    return this.orderService.complete(id);
  }
}
