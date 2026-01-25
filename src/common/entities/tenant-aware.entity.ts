import { Column } from 'typeorm';

export abstract class TenantAwareEntity {
    @Column({ name: 'tenant_id' })
    tenantId: string;
}
