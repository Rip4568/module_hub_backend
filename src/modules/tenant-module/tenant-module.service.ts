import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantModuleEntity } from './entities/tenant-module.entity';
import { Role } from '../role/entities/role.entity';
import { Permission } from '../permission/entities/permission.entity';
import { RoleService } from '../role/role.service';
import { RoleName } from '../role/enums/role-name.enum';

@Injectable()
export class TenantModuleService {
  constructor(
    @InjectRepository(TenantModuleEntity)
    private tenantModuleRepository: Repository<TenantModuleEntity>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @Inject(forwardRef(() => RoleService))
    private roleService: RoleService,
  ) {}

  private readonly ESSENTIAL_MODULES = [
    'tenant',
    'auth',
    'user',
    'role',
    'permission',
    'tenant-module',
    'erp',
  ];
  private readonly MODULE_ALIASES: Record<string, string> = {
    user_management: 'user',
    users: 'user',
    teams: 'team_permissions',
    settings: 'multi_organization',
    categories: 'ecommerce',
    fleet: 'fleet_management',
    drivers: 'drivers_management',
    reports: 'advanced_reports',
  };
  private readonly MAX_MODULES_PER_PLAN = 5;

  private normalizeModuleId(moduleId: string): string {
    return this.MODULE_ALIASES[moduleId] ?? moduleId;
  }

  private getAliasesForModule(moduleId: string): string[] {
    const canonicalModuleId = this.normalizeModuleId(moduleId);
    return Object.entries(this.MODULE_ALIASES)
      .filter(([, target]) => target === canonicalModuleId)
      .map(([alias]) => alias);
  }

  private async findModuleRecords(
    tenantId: string,
    moduleId: string,
  ): Promise<TenantModuleEntity[]> {
    const canonicalModuleId = this.normalizeModuleId(moduleId);
    const relatedModuleIds = [canonicalModuleId, ...this.getAliasesForModule(canonicalModuleId)];

    return this.tenantModuleRepository.find({
      where: relatedModuleIds.map((relatedModuleId) => ({
        tenantId,
        moduleId: relatedModuleId,
      })),
      order: { createdAt: 'ASC' },
    });
  }

  private pickPreferredRecord(
    records: TenantModuleEntity[],
    moduleId: string,
  ): TenantModuleEntity | null {
    if (!records.length) {
      return null;
    }

    const canonicalModuleId = this.normalizeModuleId(moduleId);
    return records.find((record) => record.moduleId === canonicalModuleId) ?? records[0];
  }

  private async mergeLegacyRecords(
    tenantId: string,
    moduleId: string,
  ): Promise<TenantModuleEntity | null> {
    const records = await this.findModuleRecords(tenantId, moduleId);
    const preferredRecord = this.pickPreferredRecord(records, moduleId);

    if (!preferredRecord) {
      return null;
    }

    const canonicalModuleId = this.normalizeModuleId(moduleId);
    let shouldSavePreferredRecord = preferredRecord.moduleId !== canonicalModuleId;

    if (preferredRecord.moduleId !== canonicalModuleId) {
      preferredRecord.moduleId = canonicalModuleId;
    }

    const duplicateRecords = records.filter((record) => record.id !== preferredRecord.id);
    if (duplicateRecords.length) {
      const hasAnyActiveDuplicate = duplicateRecords.some((record) => record.isActive);
      if (hasAnyActiveDuplicate && !preferredRecord.isActive) {
        preferredRecord.isActive = true;
        shouldSavePreferredRecord = true;
      }
      await this.tenantModuleRepository.remove(duplicateRecords);
    }

    if (shouldSavePreferredRecord) {
      return this.tenantModuleRepository.save(preferredRecord);
    }

    return preferredRecord;
  }

  private async getNormalizedModules(tenantId: string): Promise<TenantModuleEntity[]> {
    const modules = await this.tenantModuleRepository.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });

    const normalizedModuleMap = new Map<string, TenantModuleEntity>();

    for (const module of modules) {
      const canonicalModuleId = this.normalizeModuleId(module.moduleId);
      const existingModule = normalizedModuleMap.get(canonicalModuleId);

      if (!existingModule || (!existingModule.isActive && module.isActive)) {
        normalizedModuleMap.set(canonicalModuleId, {
          ...module,
          moduleId: canonicalModuleId,
        });
      }
    }

    return Array.from(normalizedModuleMap.values());
  }

  async isModuleEnabled(tenantId: string, moduleId: string): Promise<boolean> {
    const canonicalModuleId = this.normalizeModuleId(moduleId);
    if (this.ESSENTIAL_MODULES.includes(canonicalModuleId)) return true;

    const tenantModules = await this.findModuleRecords(tenantId, canonicalModuleId);
    return tenantModules.some((tenantModule) => tenantModule.isActive);
  }

  async findAll(tenantId: string): Promise<TenantModuleEntity[]> {
    return this.getNormalizedModules(tenantId);
  }

  async activateModule(tenantId: string, moduleId: string): Promise<TenantModuleEntity> {
    const canonicalModuleId = this.normalizeModuleId(moduleId);
    const normalizedModules = await this.getNormalizedModules(tenantId);
    const activeCount = normalizedModules.filter((module) => module.isActive).length;

    if (activeCount >= this.MAX_MODULES_PER_PLAN) {
      const existing = await this.mergeLegacyRecords(tenantId, canonicalModuleId);
      if (!existing || !existing.isActive) {
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            code: 'PLAN_UPGRADE_REQUIRED',
            message: `Your current plan allows up to ${this.MAX_MODULES_PER_PLAN} active modules. Upgrade your plan to activate additional modules.`,
            details: {
              activeCount,
              maxModules: this.MAX_MODULES_PER_PLAN,
            },
            suggestedAction: 'UPGRADE_PLAN',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
    }

    let module = await this.mergeLegacyRecords(tenantId, canonicalModuleId);
    if (module) {
      module.moduleId = canonicalModuleId;
      module.isActive = true;
    } else {
      module = this.tenantModuleRepository.create({
        tenantId,
        moduleId: canonicalModuleId,
        isActive: true,
        activatedAt: new Date(),
      } as TenantModuleEntity);
    }
    const saved = await this.tenantModuleRepository.save(module);

    await this.grantModulePermissionsToAdmin(tenantId, canonicalModuleId);

    return Array.isArray(saved) ? saved[0] : saved;
  }

  private async grantModulePermissionsToAdmin(tenantId: string, moduleId: string) {
    try {
      const adminRole = await this.roleRepository.findOne({
        where: { tenantId, name: RoleName.ADMIN },
      });

      if (!adminRole) {
        console.warn(`Admin role not found for tenant ${tenantId}. Skipping permission grant.`);
        return;
      }

      const permissions = await this.permissionRepository.find({ where: { module: moduleId } });
      const permissionIds = permissions.map((p) => p.id);

      if (permissionIds.length > 0) {
        // 3. Grant Permissions using optimized bulk method
        await this.roleService.grantPermissions(adminRole.id, permissionIds);
        console.log(
          `Granted ${permissions.length} permissions for module ${moduleId} to Admin role.`,
        );
      }
    } catch (e) {
      console.error('Failed to auto-grant permissions:', e);
    }
  }

  async deactivateModule(tenantId: string, moduleId: string): Promise<TenantModuleEntity | null> {
    const canonicalModuleId = this.normalizeModuleId(moduleId);
    if (this.ESSENTIAL_MODULES.includes(canonicalModuleId)) {
      throw new BadRequestException({
        code: 'ESSENTIAL_MODULE',
        message: `Cannot deactivate essential module: ${canonicalModuleId}`,
      });
    }

    const module = await this.mergeLegacyRecords(tenantId, canonicalModuleId);
    if (module) {
      module.isActive = false;
      const saved = await this.tenantModuleRepository.save(module);
      return Array.isArray(saved) ? saved[0] : saved;
    }
    return null;
  }
  async getActiveModules(tenantId: string): Promise<string[]> {
    const dbModules = await this.getNormalizedModules(tenantId);
    const dbModuleIds = dbModules
      .filter((module) => module.isActive)
      .map((module) => this.normalizeModuleId(module.moduleId));
    return [...new Set([...this.ESSENTIAL_MODULES, ...dbModuleIds])];
  }
}
