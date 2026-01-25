import { Controller, Get, Param, Query, UseGuards, Post, Body } from '@nestjs/common';
import { ProductService } from './product.service';
import { OrderService } from '../order/order.service';
import { Public } from '../../common/decorators/public.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';

@Controller('storefront/:tenantId/products')
@Public()
@UseGuards(TenantGuard, ModuleGuard)
@RequiresModule('ecommerce')
export class ProductStorefrontController {
    constructor(
        private readonly productService: ProductService,
        private readonly orderService: OrderService,
    ) { }

    @Get()
    findAllPublic(@Query() query: any) {
        return this.productService.findAllPublic(query);
    }

    @Get(':slug')
    findOnePublicBySlug(@Param('slug') slug: string) {
        return this.productService.findOnePublicBySlug(slug);
    }

    @Post('checkout')
    checkout(@Param('tenantId') tenantId: string, @Body() checkoutData: any) {
        return this.orderService.checkout(tenantId, checkoutData);
    }
}
