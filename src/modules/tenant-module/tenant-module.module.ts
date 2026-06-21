import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantModuleService } from './tenant-module.service';
import { TenantModuleController } from './tenant-module.controller';
import { TenantModuleEntity } from './entities/tenant-module.entity';

import { Permission } from '../permission/entities/permission.entity';
import { Role } from '../role/entities/role.entity';
import { RolePermission } from '../role/entities/role-permission.entity';
import { RoleModule } from '../role/role.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantModuleEntity, Permission, Role, RolePermission]),
    forwardRef(() => RoleModule),
  ],
  controllers: [TenantModuleController],
  providers: [TenantModuleService],
  exports: [TenantModuleService],
})
export class TenantModuleModule {}
