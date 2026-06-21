import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from './entities/activity-log.entity';
import { ActivityLogService } from './activity-log.service';
import { ActivityLogController } from './activity-log.controller';
import { ModuleActivityListener } from './listeners/module-activity.listener';
import { TenantModuleModule } from '../tenant-module/tenant-module.module';
import { PermissionModule } from '../permission/permission.module';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLog]), TenantModuleModule, PermissionModule],
  controllers: [ActivityLogController],
  providers: [ActivityLogService, ModuleActivityListener],
  exports: [ActivityLogService],
})
export class ActivityLogModule {}
