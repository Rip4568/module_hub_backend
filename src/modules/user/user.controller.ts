import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { ModuleGuard } from '../../common/guards/module.guard';
import { PermissionGuard } from '../../common/guards/permission.guard';
import { RequiresModule } from '../../common/decorators/requires-module.decorator';
import { RequiresPermission } from '../../common/decorators/requires-permission.decorator';
import { Permissions } from '../../common/constants/permissions';
import { TenantService } from '../tenant/tenant.service';
import { EmailTemplateService } from '../../infrastructure/email/email-template.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard, ModuleGuard, PermissionGuard)
@RequiresModule('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly tenantService: TenantService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  @Post('invite')
  @RequiresPermission(Permissions.CREATE_USER)
  async invite(@CurrentTenant() tenantId: string, @Body() inviteDto: InviteUserDto) {
    const tenant = await this.tenantService.findOne(tenantId, tenantId);
    const { user, tempPassword } = await this.userService.invite(
      tenantId,
      inviteDto.email,
      inviteDto.name,
      inviteDto.role,
    );

    await this.emailTemplateService.sendUserInvite({
      to: inviteDto.email,
      name: inviteDto.name,
      tenantName: tenant.name,
      tempPassword,
    });

    return user;
  }

  @Post()
  @RequiresPermission(Permissions.CREATE_USER)
  create(@CurrentTenant() tenantId: string, @Body() createUserDto: CreateUserDto) {
    return this.userService.create({
      ...createUserDto,
      tenantId,
    });
  }

  @Get()
  @RequiresPermission(Permissions.READ_USER)
  findAll(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.userService.findAllByTenant(tenantId, page, limit);
  }

  @Get(':id')
  @RequiresPermission(Permissions.READ_USER)
  findOne(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    return this.userService.findOneByTenant(id, tenantId);
  }

  @Patch(':id')
  @RequiresPermission(Permissions.UPDATE_USER)
  update(
    @CurrentTenant() tenantId: string,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateByTenant(id, tenantId, updateUserDto);
  }

  @Delete(':id')
  @RequiresPermission(Permissions.DELETE_USER)
  async remove(@CurrentTenant() tenantId: string, @Param('id') id: string) {
    await this.userService.removeByTenant(id, tenantId);
    return { deleted: true };
  }

  @Post(':id/roles/:roleId')
  @RequiresPermission(Permissions.MANAGE_ROLES)
  addRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.userService.addRole(id, roleId);
  }

  @Delete(':id/roles/:roleId')
  @RequiresPermission(Permissions.MANAGE_ROLES)
  removeRole(@Param('id') id: string, @Param('roleId') roleId: string) {
    return this.userService.removeRole(id, roleId);
  }

  @Post(':id/permissions/grant')
  @RequiresPermission(Permissions.MANAGE_PERMISSIONS)
  grantPermission(@Param('id') id: string, @Body() body: { permission: string }) {
    return this.userService.grantPermission(id, body.permission);
  }

  @Post(':id/permissions/revoke')
  @RequiresPermission(Permissions.MANAGE_PERMISSIONS)
  revokePermission(@Param('id') id: string, @Body() body: { permission: string }) {
    return this.userService.revokePermission(id, body.permission);
  }
}
