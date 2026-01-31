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
  ) { }

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

  /**
   * Optimized method to grant multiple permissions to a role by ID.
   * Avoids N+1 queries by checking existence in bulk.
   */
  async grantPermissions(roleId: string, permissionIds: string[]): Promise<void> {
    if (!permissionIds.length) return;

    // 1. Find existing grants for this role and these permissions
    const existingGrants = await this.rolePermissionRepository.createQueryBuilder('rp')
      .where('rp.roleId = :roleId', { roleId })
      .andWhere('rp.permissionId IN (:...permissionIds)', { permissionIds })
      .getMany();

    const existingPermissionIds = new Set(existingGrants.map(rp => rp.permissionId));

    // 2. Filter out already granted permissions
    const newPermissionIds = permissionIds.filter(id => !existingPermissionIds.has(id));

    if (newPermissionIds.length === 0) return;

    // 3. Bulk Insert
    const newGrants = newPermissionIds.map(permissionId =>
      this.rolePermissionRepository.create({ roleId, permissionId })
    );

    await this.rolePermissionRepository.save(newGrants);
  }
}
