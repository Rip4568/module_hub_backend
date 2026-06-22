import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { Public } from '../../common/decorators/public.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';

@Controller('storefront/:tenantId/products')
@Public()
@UseGuards(TenantGuard, ModuleGuard)
@RequiresModule('ecommerce')
export class ProductStorefrontController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  findAllPublic(@Param('tenantId') tenantId: string, @Query() query: Record<string, unknown>) {
    return this.productService.findAllPublic({ ...query, tenantId });
  }

  @Get(':slug')
  findOnePublicBySlug(@Param('tenantId') tenantId: string, @Param('slug') slug: string) {
    return this.productService.findOnePublicBySlug(slug, tenantId);
  }
}
