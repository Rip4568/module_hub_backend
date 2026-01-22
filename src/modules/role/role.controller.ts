import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { RoleService } from './role.service';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';

// We need to implement Decorators and Guards next, but for now I'll use placeholders or skip usage
// in this file until implemented.
// Re-visiting this after implementing guards/decorators.
@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  create(@Body() createRoleDto: any) {
    return this.roleService.create(createRoleDto);
  }

  // @Get()
  // findAll(@CurrentTenant() tenantId: string) {
  //   return this.roleService.findAll(tenantId);
  // }
}
