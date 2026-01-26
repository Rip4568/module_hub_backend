import {
    EntitySubscriberInterface,
    EventSubscriber,
    InsertEvent,
    UpdateEvent,
} from 'typeorm';
import { ClsService } from 'nestjs-cls';
import { TenantAwareEntity } from '../entities/tenant-aware.entity';
import { RequestContext } from '../context/request.context';
import { UnauthorizedException } from '@nestjs/common';

import { DataSource } from 'typeorm';

@EventSubscriber()
export class TenantSubscriber implements EntitySubscriberInterface<TenantAwareEntity> {
    constructor(
        dataSource: DataSource,
        private readonly cls: ClsService
    ) {
        dataSource.subscribers.push(this);
    }

    /**
     * Indicates that this subscriber only listen to TenantAwareEntity events.
     */
    listenTo() {
        return TenantAwareEntity;
    }

    /**
     * Called before entity insertion.
     * Ensures tenantId is present, either from the entity itself or from the context.
     */
    async beforeInsert(event: InsertEvent<TenantAwareEntity>) {
        const tenantId = this.cls.get(RequestContext.TENANT_ID);

        if (event.entity.tenantId && tenantId && event.entity.tenantId !== tenantId) {
            // Security: If both are present, they must match.
            // This prevents a user from trying to save data for another tenant.
            throw new UnauthorizedException('Cross-tenant write attempt detected.');
        }

        if (!event.entity.tenantId) {
            if (!tenantId) {
                // This might happen for background jobs or scripts.
                // For production, we must ensure every insert has a tenant context.
                throw new UnauthorizedException('Missing tenant context for insertion.');
            }
            event.entity.tenantId = tenantId;
        }
    }

    /**
     * Called before entity update.
     * Ensures tenantId is not changed (immutability).
     */
    async beforeUpdate(event: UpdateEvent<TenantAwareEntity>) {
        if (!event.entity) return;

        const tenantIdSnapshot = event.databaseEntity?.tenantId;
        const tenantIdUpdate = event.entity.tenantId;

        if (tenantIdUpdate && tenantIdSnapshot && tenantIdUpdate !== tenantIdSnapshot) {
            throw new UnauthorizedException('tenantId is immutable and cannot be changed.');
        }
    }
}
