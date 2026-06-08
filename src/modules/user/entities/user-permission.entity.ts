import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  Relation,
  Unique,
  Column,
} from 'typeorm';
import { User } from './user.entity';
import { Permission } from '../../permission/entities/permission.entity';

@Entity()
@Unique(['user', 'permission'])
export class UserPermission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.permissions, { onDelete: 'CASCADE' })
  user: Relation<User>;

  @Column()
  permissionId: string;

  @ManyToOne(() => Permission, (permission) => permission.users, { onDelete: 'CASCADE' })
  permission: Relation<Permission>;

  @Column({ default: true })
  granted: boolean;

  @CreateDateColumn()
  assignedAt: Date;
}
