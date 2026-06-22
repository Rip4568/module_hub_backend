import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { TransferInventoryDto, AdjustInventoryDto } from './dto/inventory-operation.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer stock between locations (Warehouse <-> Vehicle)' })
  @RequiresPermission(Permissions.TRANSFER_INVENTORY)
  async transfer(@Body() dto: TransferInventoryDto) {
    return this.inventoryService.transfer(dto);
  }

  @Post('adjust')
  @ApiOperation({ summary: 'Manually adjust stock (Loss, Found, Correction)' })
  @RequiresPermission(Permissions.ADJUST_INVENTORY)
  async adjust(@Body() dto: AdjustInventoryDto) {
    return this.inventoryService.adjust(dto);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Get inventory movements (history/kardex)' })
  @RequiresPermission(Permissions.READ_INVENTORY)
  async getMovements(@Body() body: { productId: string }) {
    return this.inventoryService.getMovements(body.productId);
  }
}
