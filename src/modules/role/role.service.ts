import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';
import { RolePermission } from './entities/role-permission.entity';
import { Permission } from '../permission/entities/permission.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(tenantId: string, createRoleDto: any): Promise<Role> {
    const role = this.roleRepository.create({
      ...createRoleDto,
      tenantId,
    } as Role);
    return this.roleRepository.save(role);
  }

  async findAll(tenantId: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: { tenantId },
      relations: ['permissions', 'permissions.permission']
    });
  }

  async findOne(tenantId: string, id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id, tenantId },
      relations: ['permissions', 'permissions.permission']
    });
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
    return role;
  }

  async update(tenantId: string, id: string, updateRoleDto: any): Promise<Role> {
    const role = await this.findOne(tenantId, id);
    this.roleRepository.merge(role, updateRoleDto);
    return this.roleRepository.save(role);
  }

  async remove(tenantId: string, id: string): Promise<void> {
    const role = await this.findOne(tenantId, id);
    if (role.isSystem) {
        throw new Error("Cannot delete system role");
    }
    await this.roleRepository.remove(role);
  }

  async addPermissions(tenantId: string, roleId: string, permissionNames: string[]): Promise<Role> {
      const role = await this.findOne(tenantId, roleId);

      // Ideally check if permissions exist in Permission table
      for (const name of permissionNames) {
          const permission = await this.permissionRepository.findOne({ where: { name } });
          if (permission) {
              // Check if already exists
              const existing = await this.rolePermissionRepository.findOne({
                  where: { roleId, permissionId: permission.id }
              });
              if (!existing) {
                  const rolePermission = this.rolePermissionRepository.create({
                      roleId,
                      permissionId: permission.id
                  } as RolePermission);
                  await this.rolePermissionRepository.save(rolePermission);
              }
          }
      }
      return this.findOne(tenantId, roleId);
  }

  async removePermissions(tenantId: string, roleId: string, permissionNames: string[]): Promise<Role> {
      const role = await this.findOne(tenantId, roleId);

      for (const name of permissionNames) {
          const permission = await this.permissionRepository.findOne({ where: { name } });
          if (permission) {
              await this.rolePermissionRepository.delete({ roleId, permissionId: permission.id });
          }
      }
      return this.findOne(tenantId, roleId);
  }
}
