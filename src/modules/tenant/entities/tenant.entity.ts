import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Relation,
} from 'typeorm';
import { TenantModuleEntity } from '../../tenant-module/entities/tenant-module.entity';
import { User } from '../../user/entities/user.entity';
import { Role } from '../../role/entities/role.entity';

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
  config: any;

  @Column({ type: 'json', nullable: true })
  branding: any;

  @Column({
    type: 'enum',
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

  @OneToMany(() => TenantModuleEntity, (module) => module.tenant)
  modules: Relation<TenantModuleEntity[]>;

  @OneToMany(() => User, (user) => user.tenant)
  users: Relation<User[]>;

  @OneToMany(() => Role, (role) => role.tenant)
  roles: Relation<Role[]>;
}
