import { Column, Index } from 'typeorm';

export abstract class TenantAwareEntity {
  @Index()
  @Column({ name: 'tenant_id' })
  tenantId: string;
}
