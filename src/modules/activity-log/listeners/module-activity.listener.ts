import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvents, ModuleActivatedPayload } from '../../../common/events/domain.events';
import { ActivityLogService } from '../activity-log.service';

@Injectable()
export class ModuleActivityListener {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @OnEvent(DomainEvents.MODULE_ACTIVATED)
  async handleModuleActivated(payload: ModuleActivatedPayload): Promise<void> {
    await this.activityLogService.log({
      tenantId: payload.tenantId,
      userId: payload.userId,
      action: 'activate',
      resource: 'tenant-module',
      resourceId: payload.moduleId,
      changes: { moduleId: payload.moduleId, isActive: true },
    });
  }
}
