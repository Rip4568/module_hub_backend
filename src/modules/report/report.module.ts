import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [
    TenantModuleModule,
    PermissionModule
  ],
  controllers: [ReportController],
  providers: [ReportService],
})
export class ReportModule {}
