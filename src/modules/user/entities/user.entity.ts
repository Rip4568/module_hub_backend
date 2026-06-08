import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';
import { TenantAwareEntity } from '../../../common/entities/tenant-aware.entity';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { UserRole } from './user-role.entity';
import { UserPermission } from './user-permission.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { Order } from '../../order/entities/order.entity';
import { ActivityLog } from '../../activity-log/entities/activity-log.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
  INACTIVE = 'INACTIVE',
}

@Entity()
@Unique(['tenantId', 'email'])
export class User extends TenantAwareEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  tenant: Relation<Tenant>;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ nullable: true })
  lastLoginAt: Date;

  @Column({ nullable: true })
  lastLoginIp: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  roles: Relation<UserRole[]>;

  @OneToMany(() => UserPermission, (userPermission) => userPermission.user)
  permissions: Relation<UserPermission[]>;

  @Column({ nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.users)
  organization: Relation<Organization>;

  @OneToMany(() => Order, (order) => order.createdBy)
  createdOrders: Relation<Order[]>;

  @OneToMany(() => Order, (order) => order.assignedTo)
  assignedOrders: Relation<Order[]>;

  @OneToMany(() => ActivityLog, (log) => log.user)
  activityLogs: Relation<ActivityLog[]>;
}
