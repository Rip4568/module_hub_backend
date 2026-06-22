import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import type { TenantModuleEntity } from '../../tenant-module/entities/tenant-module.entity';
import type { User } from '../../user/entities/user.entity';
import type { Role } from '../../role/entities/role.entity';
import { TenantConfig, TenantBranding } from '../interfaces/tenant-config.interface';

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ unique: true, nullable: true })
  subdomain: string;

  @Column({ unique: true, nullable: true })
  customDomain: string;

  @Column({ type: 'json', nullable: true })
  config: TenantConfig | null;

  @Column({ type: 'json', nullable: true })
  branding: TenantBranding | null;

  @Column({
    type: 'simple-enum',
    enum: TenantStatus,
    default: TenantStatus.ACTIVE,
  })
  status: TenantStatus;

  @Column({ nullable: true })
  trialEndsAt: Date;

  @Column({ nullable: true })
  plan: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => require('../../tenant-module/entities/tenant-module.entity').TenantModuleEntity,
    (module: TenantModuleEntity) => module.tenant,
  )
  modules: Relation<TenantModuleEntity[]>;

  @OneToMany(
    () => require('../../user/entities/user.entity').User,
    (user: User) => user.tenant,
  )
  users: Relation<User[]>;

  @OneToMany(
    () => require('../../role/entities/role.entity').Role,
    (role: Role) => role.tenant,
  )
  roles: Relation<Role[]>;
}
