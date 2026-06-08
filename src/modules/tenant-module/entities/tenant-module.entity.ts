import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';
import type { Tenant } from '../../tenant/entities/tenant.entity';

@Entity('tenant_module')
@Unique(['tenant', 'moduleId'])
export class TenantModuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne('Tenant', 'modules', { onDelete: 'CASCADE' })
  tenant: Relation<Tenant>;

  @Column()
  moduleId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'json', nullable: true })
  config: any;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  activatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
