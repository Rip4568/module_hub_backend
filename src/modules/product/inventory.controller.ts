import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { TransferInventoryDto, AdjustInventoryDto } from './dto/inventory-operation.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { TenantGuard } from '@/common/guards/tenant.guard';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, TenantGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post('transfer')
    @ApiOperation({ summary: 'Transfer stock between locations (Warehouse <-> Vehicle)' })
    async transfer(@Body() dto: TransferInventoryDto) {
        return this.inventoryService.transfer(dto);
    }

    @Post('adjust')
    @ApiOperation({ summary: 'Manually adjust stock (Loss, Found, Correction)' })
    async adjust(@Body() dto: AdjustInventoryDto) {
        return this.inventoryService.adjust(dto);
    }


    @Post('movements')
    @ApiOperation({ summary: 'Get inventory movements (history/kardex)' })
    async getMovements(@Body() body: { productId: string }) {
        return this.inventoryService.getMovements(body.productId);
    }
}
