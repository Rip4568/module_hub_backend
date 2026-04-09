import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { Permission } from './entities/permission.entity';
import { UserRole } from '../user/entities/user-role.entity';
import { UserPermission } from '../user/entities/user-permission.entity';
import { RolePermission } from '../role/entities/role-permission.entity';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, UserRole, UserPermission, RolePermission, User, Role]),
  ],
  controllers: [PermissionController],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
