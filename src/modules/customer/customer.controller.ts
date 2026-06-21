import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Permissions } from '../../common/constants/permissions';

@Controller('customers')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('ecommerce')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) { }

    @Post()
    @RequiresPermission(Permissions.CREATE_CUSTOMER)
    create(@Body() createCustomerDto: CreateCustomerDto, @CurrentTenant() tenantId: string) {
        return this.customerService.create({ ...createCustomerDto, tenantId });
    }

    @Get()
    @RequiresPermission(Permissions.READ_CUSTOMER)
    findAll(@CurrentTenant() tenantId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.customerService.findAll(tenantId, page, limit);
    }

    @Get(':id')
    @RequiresPermission(Permissions.READ_CUSTOMER)
    findOne(@Param('id') id: string, @CurrentTenant() tenantId: string) {
        return this.customerService.findOne(id, tenantId);
    }

    @Patch(':id')
    @RequiresPermission(Permissions.UPDATE_CUSTOMER)
    update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto, @CurrentTenant() tenantId: string) {
        return this.customerService.update(id, updateCustomerDto, tenantId);
    }

    @Delete(':id')
    @RequiresPermission(Permissions.DELETE_CUSTOMER)
    remove(@Param('id') id: string, @CurrentTenant() tenantId: string) {
        return this.customerService.remove(id, tenantId);
    }
}
