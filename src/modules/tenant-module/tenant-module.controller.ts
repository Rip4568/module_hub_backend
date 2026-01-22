import { Controller } from '@nestjs/common';
import { TenantModuleService } from './tenant-module.service';

@Controller('tenant-modules')
export class TenantModuleController {
  constructor(private readonly tenantModuleService: TenantModuleService) {}
}
