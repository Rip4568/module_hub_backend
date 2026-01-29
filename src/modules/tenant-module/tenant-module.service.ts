import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleEntity } from './entities/tenant-module.entity';

import { Permission } from '../permission/entities/permission.entity';
import { Role } from '../role/entities/role.entity';
import { RolePermission } from '../role/entities/role-permission.entity';

@Injectable()
export class TenantModuleService {
  constructor(
    @InjectRepository(TenantModuleEntity)
    private tenantModuleRepository: Repository<TenantModuleEntity>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private rolePermissionRepository: Repository<RolePermission>,
  ) { }

  // List of modules that cannot be deactivated
  private readonly ESSENTIAL_MODULES = ['tenant', 'auth', 'user', 'role', 'permission', 'tenant-module'];
  private readonly MAX_MODULES_PER_PLAN = 5;

  async isModuleEnabled(tenantId: string, moduleId: string): Promise<boolean> {
    // Essential modules are always enabled conceptually, but we check DB for consistency
    if (this.ESSENTIAL_MODULES.includes(moduleId)) return true;

    const tenantModule = await this.tenantModuleRepository.findOne({
      where: { tenantId, moduleId, isActive: true },
    });
    return !!tenantModule;
  }

  async findAll(tenantId: string): Promise<TenantModuleEntity[]> {
    return this.tenantModuleRepository.find({ where: { tenantId } });
  }

  async activateModule(tenantId: string, moduleId: string): Promise<TenantModuleEntity> {
    // 1. Check Limit
    const activeCount = await this.tenantModuleRepository.count({
      where: { tenantId, isActive: true }
    });

    if (activeCount >= this.MAX_MODULES_PER_PLAN) {
      // Check if module is already active to avoid false positive
      const existing = await this.tenantModuleRepository.findOne({ where: { tenantId, moduleId } });
      if (!existing || !existing.isActive) {
        throw new Error(`Plan limit reached. Max ${this.MAX_MODULES_PER_PLAN} active modules allowed.`);
      }
    }

    let module = await this.tenantModuleRepository.findOne({ where: { tenantId, moduleId } });
    if (module) {
      module.isActive = true;
    } else {
      module = this.tenantModuleRepository.create({
        tenantId,
        moduleId,
        isActive: true,
        activatedAt: new Date()
      } as TenantModuleEntity);

      // --- PERMISSION ASSIGNMENT LOGIC ---
      // 1. Find the Tenant's Admin Role
      console.log(`[ActivateModule] Finding Admin role for tenant: ${tenantId}`);
      // Find 'admin_geral' (default) or 'Admin' (legacy/fallback)
      const adminRole = await this.roleRepository.findOne({
        where: [
          { tenantId, name: 'admin_geral' },
          { tenantId, name: 'Admin' }
        ]
      });

      if (adminRole) {
        console.log(`[ActivateModule] Admin role found: ${adminRole.id}`);
        // 2. Find all permissions belonging to this module
        const modulePermissions = await this.permissionRepository.find({
          where: { module: moduleId }
        });
        console.log(`[ActivateModule] Found ${modulePermissions.length} permissions for module ${moduleId}`);

        if (modulePermissions.length > 0) {
          // 3. Create RolePermission entries
          const rolePermissions = modulePermissions.map(permission => {
            return this.rolePermissionRepository.create({
              role: adminRole,
              permission: permission
            });
          });

          await this.rolePermissionRepository.save(rolePermissions);
          console.log(`[ActivateModule] Assigned ${rolePermissions.length} permissions to Admin role`);
        }
      } else {
        console.warn(`[ActivateModule] Admin role NOT found for tenant ${tenantId}`);
      }
    }
    const saved = await this.tenantModuleRepository.save(module);
    return Array.isArray(saved) ? saved[0] : saved;
  }

  async deactivateModule(tenantId: string, moduleId: string): Promise<TenantModuleEntity | null> {
    // 1. Check Essentials
    if (this.ESSENTIAL_MODULES.includes(moduleId)) {
      throw new Error(`Cannot deactivate essential module: ${moduleId}`);
    }

    const module = await this.tenantModuleRepository.findOne({ where: { tenantId, moduleId } });
    if (module) {
      module.isActive = false;
      const saved = await this.tenantModuleRepository.save(module);
      return Array.isArray(saved) ? saved[0] : saved;
    }
    return null;
  }
  async getActiveModules(tenantId: string): Promise<string[]> {
    const dbModules = await this.tenantModuleRepository.find({
      where: { tenantId, isActive: true }
    });
    const dbModuleIds = dbModules.map(m => m.moduleId);
    // Merge essential modules with DB modules, ensuring uniqueness
    return [...new Set([...this.ESSENTIAL_MODULES, ...dbModuleIds])];
  }
}
