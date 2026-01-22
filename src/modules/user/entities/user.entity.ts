import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { UserRole } from './user-role.entity';
import { UserPermission } from './user-permission.entity';
import { Organization } from '../../organization/entities/organization.entity';
import { Order } from '../../order/entities/order.entity';
import { Driver } from '../../driver/entities/driver.entity';
import { ActivityLog } from '../../activity-log/entities/activity-log.entity';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  BLOCKED = 'BLOCKED',
  INACTIVE = 'INACTIVE',
}

@Entity()
@Unique(['tenant', 'email'])
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  tenant: Tenant;

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
  roles: UserRole[];

  @OneToMany(() => UserPermission, (userPermission) => userPermission.user)
  permissions: UserPermission[];

  @Column({ nullable: true })
  organizationId: string;

  @ManyToOne(() => Organization, (org) => org.users)
  organization: Organization;

  @OneToMany(() => Order, (order) => order.createdBy)
  createdOrders: Order[];

  @OneToMany(() => Order, (order) => order.assignedTo)
  assignedOrders: Order[];

  @OneToMany(() => ActivityLog, (log) => log.user)
  activityLogs: ActivityLog[];
}
