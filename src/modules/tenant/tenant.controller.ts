import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  create(@Body() createTenantDto: any) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }
}
