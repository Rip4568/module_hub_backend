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
import { Role } from '../../role/entities/role.entity';

@Entity()
@Unique(['user', 'role'])
export class UserRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.roles, { onDelete: 'CASCADE' })
  user: Relation<User>;

  @Column()
  roleId: string;

  @ManyToOne(() => Role, (role) => role.users, { onDelete: 'CASCADE' })
  role: Relation<Role>;

  @CreateDateColumn()
  assignedAt: Date;
}
