import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Relation,
  Unique,
  Column,
} from 'typeorm';
import { Role } from './role.entity';
import { Permission } from '../../permission/entities/permission.entity';

@Entity()
@Unique(['role', 'permission'])
export class RolePermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  roleId: string;

  @ManyToOne(() => Role, (role) => role.permissions, { onDelete: 'CASCADE' })
  role: Relation<Role>;

  @Column()
  permissionId: string;

  @ManyToOne(() => Permission, (permission) => permission.roles, { onDelete: 'CASCADE' })
  permission: Relation<Permission>;

  @CreateDateColumn()
  createdAt: Date;
}
