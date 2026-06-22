import {
  Injectable,
  Inject,
  forwardRef,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ClsService } from 'nestjs-cls';
import { RequestContext } from '../../common/context/request.context';
import { TenantModuleEntity } from './entities/tenant-module.entity';
import { Role } from '../role/entities/role.entity';
import { Permission } from '../permission/entities/permission.entity';
import { RoleService } from '../role/role.service';
import { RoleName } from '../role/enums/role-name.enum';
import { PaginatedResult } from '../../common/interfaces/paginated-result.interface';
import { normalizePagination } from '../../common/utils/pagination.util';
import { DomainEvents, ModuleActivatedPayload } from '../../common/events/domain.events';
import {
  countBillableActiveModules,
  isEssentialModule,
} from '../../common/constants/module-billing.constants';
import { PlanService } from '../plan/plan.service';

@Injectable()
export class TenantModuleService {
  private readonly logger = new Logger(TenantModuleService.name);
  constructor(
    @InjectRepository(TenantModuleEntity)
    private tenantModuleRepository: Repository<TenantModuleEntity>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @Inject(forwardRef(() => RoleService))
    private roleService: RoleService,
    private readonly planService: PlanService,
    private readonly eventEmitter: EventEmitter2,
    private readonly cls: ClsService,
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
    documents: 'document',
    'activity-log': 'activity_log',
  };

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

  async findAll(
    tenantId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResult<TenantModuleEntity>> {
    const { page: safePage, limit: safeLimit, skip } = normalizePagination(page, limit);
    const [rawData, total] = await this.tenantModuleRepository.findAndCount({
      where: { tenantId },
      order: { createdAt: 'ASC' },
      skip,
      take: safeLimit,
    });

    const data = this.deduplicatePageByCanonicalModule(rawData);

    return {
      data,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  private deduplicatePageByCanonicalModule(records: TenantModuleEntity[]): TenantModuleEntity[] {
    const seen = new Map<string, TenantModuleEntity>();

    for (const record of records) {
      const canonicalModuleId = this.normalizeModuleId(record.moduleId);
      const normalized = { ...record, moduleId: canonicalModuleId };
      const existing = seen.get(canonicalModuleId);

      if (!existing || (!existing.isActive && normalized.isActive)) {
        seen.set(canonicalModuleId, normalized);
      }
    }

    return Array.from(seen.values());
  }

  async activateModule(tenantId: string, moduleId: string): Promise<TenantModuleEntity> {
    const canonicalModuleId = this.normalizeModuleId(moduleId);
    const normalizedModules = await this.getNormalizedModules(tenantId);
    const activeBillableIds = normalizedModules
      .filter((module) => module.isActive)
      .map((module) => this.normalizeModuleId(module.moduleId))
      .filter((id) => !isEssentialModule(id));
    const billableActiveCount = countBillableActiveModules(activeBillableIds);
    const maxModules = await this.planService.getModuleLimitForTenant(tenantId);
    const plan = await this.planService.getPlanForTenant(tenantId);
    const planName = plan?.name ?? 'Starter';

    if (maxModules !== null && billableActiveCount >= maxModules) {
      const existing = await this.mergeLegacyRecords(tenantId, canonicalModuleId);
      if (!existing || !existing.isActive) {
        throw new HttpException(
          {
            statusCode: HttpStatus.PAYMENT_REQUIRED,
            code: 'PLAN_UPGRADE_REQUIRED',
            message: `Seu plano ${planName} permite até ${maxModules} módulos ativos (excluindo módulos essenciais). Faça upgrade para ativar mais módulos.`,
            details: {
              billableActiveCount,
              maxModules,
              planId: plan?.id ?? 'starter',
              planName,
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

    const userId = this.cls.get(RequestContext.USER_ID);
    await this.eventEmitter.emitAsync(DomainEvents.MODULE_ACTIVATED, {
      tenantId,
      moduleId: canonicalModuleId,
      userId,
    } satisfies ModuleActivatedPayload);

    return Array.isArray(saved) ? saved[0] : saved;
  }

  private async grantModulePermissionsToAdmin(tenantId: string, moduleId: string) {
    try {
      const adminRole = await this.roleRepository.findOne({
        where: { tenantId, name: RoleName.ADMIN },
      });

      if (!adminRole) {
        this.logger.warn(`Admin role not found for tenant ${tenantId}. Skipping permission grant.`);
        return;
      }

      const permissions = await this.permissionRepository.find({ where: { module: moduleId } });
      const permissionIds = permissions.map((p) => p.id);

      if (permissionIds.length > 0) {
        await this.roleService.grantPermissions(adminRole.id, permissionIds);
        this.logger.log(
          `Granted ${permissions.length} permissions for module ${moduleId} to Admin role.`,
        );
      }
    } catch (e) {
      this.logger.error('Failed to auto-grant permissions:', e);
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

  getModuleUsage(activeModuleIds: string[], maxModules: number | null) {
    const billableActiveCount = countBillableActiveModules(
      activeModuleIds.map((id) => this.normalizeModuleId(id)),
    );
    return {
      billableActiveCount,
      maxModules,
      isAtLimit: maxModules !== null && billableActiveCount >= maxModules,
    };
  }

  async getModuleUsageForTenant(tenantId: string) {
    const normalizedModules = await this.getNormalizedModules(tenantId);
    const activeIds = normalizedModules
      .filter((module) => module.isActive)
      .map((module) => module.moduleId);
    const maxModules = await this.planService.getModuleLimitForTenant(tenantId);
    return this.getModuleUsage([...this.ESSENTIAL_MODULES, ...activeIds], maxModules);
  }
}
