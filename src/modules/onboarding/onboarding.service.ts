import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { TenantService } from '../tenant/tenant.service';
import { TenantModuleService } from '../tenant-module/tenant-module.service';
import { PlanService } from '../plan/plan.service';
import { CompleteOnboardingDto } from './dto/complete-onboarding.dto';
import {
  getOnboardingSuggestedModules,
  ONBOARDING_SUGGESTED_MODULE_IDS,
} from '../../common/constants/system-modules.constants';
import { isEssentialModule } from '../../common/constants/module-billing.constants';

@Injectable()
export class OnboardingService {
  private readonly requiredModuleCount = 1;

  constructor(
    private readonly tenantService: TenantService,
    private readonly tenantModuleService: TenantModuleService,
    private readonly planService: PlanService,
  ) {}

  async getStatus(tenantId: string) {
    const tenant = await this.tenantService.findOne(tenantId, tenantId);
    const usage = await this.tenantModuleService.getModuleUsageForTenant(tenantId);
    const suggestedModules = getOnboardingSuggestedModules().map((module) => ({
      id: module.id,
      name: module.name,
      description: module.description,
      icon: module.icon,
    }));

    return {
      onboardingCompleted: tenant.config?.onboardingCompleted === true,
      billableCount: usage.billableActiveCount,
      requiredModuleCount: this.requiredModuleCount,
      suggestedModules,
    };
  }

  async complete(tenantId: string, dto: CompleteOnboardingDto) {
    const tenant = await this.tenantService.findOne(tenantId, tenantId);

    if (tenant.config?.onboardingCompleted === true) {
      throw new ConflictException({
        code: 'ONBOARDING_ALREADY_COMPLETED',
        message: 'O onboarding já foi concluído.',
      });
    }

    const selectedModuleIds = this.resolveSelectedModuleIds(dto);
    const moduleId = selectedModuleIds[0];

    if (!ONBOARDING_SUGGESTED_MODULE_IDS.includes(moduleId as (typeof ONBOARDING_SUGGESTED_MODULE_IDS)[number])) {
      throw new BadRequestException({
        code: 'ONBOARDING_INVALID_SELECTION',
        message: 'Selecione um módulo sugerido válido para concluir o onboarding.',
      });
    }

    if (isEssentialModule(moduleId)) {
      throw new BadRequestException({
        code: 'ONBOARDING_INVALID_SELECTION',
        message: 'Módulos essenciais não podem ser selecionados no onboarding.',
      });
    }

    const usage = await this.tenantModuleService.getModuleUsageForTenant(tenantId);
    const maxModules = usage.maxModules;

    if (maxModules !== null && usage.billableActiveCount >= maxModules) {
      const plan = await this.planService.getPlanForTenant(tenantId);
      throw new HttpException(
        {
          statusCode: HttpStatus.PAYMENT_REQUIRED,
          code: 'PLAN_UPGRADE_REQUIRED',
          message: `Seu plano ${plan?.name ?? 'atual'} permite até ${maxModules} módulos ativos (excluindo módulos essenciais). Faça upgrade para ativar mais módulos.`,
          details: {
            billableActiveCount: usage.billableActiveCount,
            maxModules,
          },
          suggestedAction: 'UPGRADE_PLAN',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    await this.tenantModuleService.activateModule(tenantId, moduleId);

    await this.tenantService.updateConfig(tenantId, tenantId, {
      config: { onboardingCompleted: true },
    });

    const activeModules = await this.tenantModuleService.getActiveModules(tenantId);

    return {
      onboardingCompleted: true,
      activeModules,
    };
  }

  async skip(tenantId: string) {
    const tenant = await this.tenantService.findOne(tenantId, tenantId);

    if (tenant.config?.onboardingCompleted === true) {
      throw new ConflictException({
        code: 'ONBOARDING_ALREADY_COMPLETED',
        message: 'O onboarding já foi concluído.',
      });
    }

    await this.tenantService.updateConfig(tenantId, tenantId, {
      config: { onboardingCompleted: true },
    });

    const activeModules = await this.tenantModuleService.getActiveModules(tenantId);

    return {
      onboardingCompleted: true,
      activeModules,
    };
  }

  private resolveSelectedModuleIds(dto: CompleteOnboardingDto): string[] {
    if (dto.moduleIds?.length) {
      if (dto.moduleIds.length !== 1) {
        throw new BadRequestException({
          code: 'ONBOARDING_INVALID_SELECTION',
          message: 'Selecione exatamente um módulo para concluir o onboarding.',
        });
      }
      return dto.moduleIds;
    }

    if (dto.moduleId) {
      return [dto.moduleId];
    }

    throw new BadRequestException({
      code: 'ONBOARDING_INVALID_SELECTION',
      message: 'Selecione exatamente um módulo para concluir o onboarding.',
    });
  }
}
