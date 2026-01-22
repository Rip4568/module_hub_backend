import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from './entities/user-role.entity';
import { UserPermission } from './entities/user-permission.entity';
import { Permission } from '../permission/entities/permission.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(UserPermission)
    private userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(createUserDto: any): Promise<User> {
    const user = this.userRepository.create(createUserDto as unknown as User);

    // Hash password if present
    if (user.password) {
      const salt = await bcrypt.genSalt();
      user.password = await bcrypt.hash(user.password, salt);
    }

    return this.userRepository.save(user);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
        where: { id },
        relations: ['roles', 'roles.role', 'permissions', 'permissions.permission']
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByEmailAndTenant(email: string, tenantId: string): Promise<User> {
    return this.userRepository.findOne({ where: { email, tenantId } });
  }

  async addRole(userId: string, roleId: string): Promise<void> {
      const existing = await this.userRoleRepository.findOne({ where: { userId, roleId } });
      if (!existing) {
          const userRole = this.userRoleRepository.create({ userId, roleId } as UserRole);
          await this.userRoleRepository.save(userRole);
      }
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
      await this.userRoleRepository.delete({ userId, roleId });
  }

  async grantPermission(userId: string, permissionName: string): Promise<void> {
      const permission = await this.permissionRepository.findOne({ where: { name: permissionName } });
      if (!permission) return;

      const existing = await this.userPermissionRepository.findOne({ where: { userId, permissionId: permission.id } });
      if (existing) {
          existing.granted = true;
          await this.userPermissionRepository.save(existing);
      } else {
          const userPerm = this.userPermissionRepository.create({
              userId,
              permissionId: permission.id,
              granted: true
          } as UserPermission);
          await this.userPermissionRepository.save(userPerm);
      }
  }

  async revokePermission(userId: string, permissionName: string): Promise<void> {
      const permission = await this.permissionRepository.findOne({ where: { name: permissionName } });
      if (!permission) return;

      const existing = await this.userPermissionRepository.findOne({ where: { userId, permissionId: permission.id } });
      if (existing) {
          existing.granted = false;
          await this.userPermissionRepository.save(existing);
      } else {
          const userPerm = this.userPermissionRepository.create({
              userId,
              permissionId: permission.id,
              granted: false
          } as UserPermission);
          await this.userPermissionRepository.save(userPerm);
      }
  }
}
