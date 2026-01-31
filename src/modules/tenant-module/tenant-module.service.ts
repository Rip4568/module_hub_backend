import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleEntity } from './entities/tenant-module.entity';
import { Role } from '../role/entities/role.entity';
import { Permission } from '../permission/entities/permission.entity';
import { RolePermission } from '../role/entities/role-permission.entity';
import { RoleService } from '../role/role.service';

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
    @Inject(forwardRef(() => RoleService))
    private roleService: RoleService,
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
    }
    const saved = await this.tenantModuleRepository.save(module);

    // Auto-grant permissions to Tenant Admin
    await this.grantModulePermissionsToAdmin(tenantId, moduleId);

    return Array.isArray(saved) ? saved[0] : saved;
  }

  private async grantModulePermissionsToAdmin(tenantId: string, moduleId: string) {
    try {
      // 1. Find Admin Role (support both naming conventions)
      const adminRole = await this.roleRepository.findOne({
        where: [
          { tenantId, name: 'Admin' },
          { tenantId, name: 'admin_geral' }
        ]
      });

      if (!adminRole) {
        console.warn(`Admin role not found for tenant ${tenantId}. Skipping permission grant.`);
        return;
      }

      // 2. Find Module Permissions
      const permissions = await this.permissionRepository.find({ where: { module: moduleId } });
      const permissionIds = permissions.map(p => p.id);

      if (permissionIds.length > 0) {
        // 3. Grant Permissions using optimized bulk method
        await this.roleService.grantPermissions(adminRole.id, permissionIds);
        console.log(`Granted ${permissions.length} permissions for module ${moduleId} to Admin role.`);
      }
    } catch (e) {
      console.error('Failed to auto-grant permissions:', e);
      // Don't block activation if this fails, but log it.
    }
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
