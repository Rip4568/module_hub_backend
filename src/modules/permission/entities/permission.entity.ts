import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';
import { RolePermission } from '../../role/entities/role-permission.entity';
import { UserPermission } from '../../user/entities/user-permission.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  resource: string;

  @Column()
  action: string;

  @Column()
  displayName: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  module: string;

  @Column('simple-array')
  dependencies: string[];

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  roles: Relation<RolePermission[]>;

  @OneToMany(() => UserPermission, (userPermission) => userPermission.permission)
  users: Relation<UserPermission[]>;
}
