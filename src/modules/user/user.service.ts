import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { HashUtils } from '../../common/utils/hash.utils';
import { UserRole } from './entities/user-role.entity';
import { UserPermission } from './entities/user-permission.entity';
import { Permission } from '../permission/entities/permission.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../role/entities/role.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(UserPermission)
    private userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  private sanitizeUser(user: User): User {
    const sanitizedUser = { ...user } as Partial<User>;
    delete sanitizedUser.password;
    return sanitizedUser as User;
  }

  private async findOneEntityInternal(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['roles', 'roles.role', 'permissions', 'permissions.permission'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  private async findOneEntityByTenant(id: string, tenantId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id, tenantId },
      relations: ['roles', 'roles.role', 'permissions', 'permissions.permission'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  private normalizeRoleName(roleName: string): { name: string; displayName: string } {
    const displayName = roleName.trim();
    return {
      name: displayName.toLowerCase(),
      displayName,
    };
  }

  private async ensureRoleForTenant(tenantId: string, roleName: string): Promise<Role> {
    const normalizedRole = this.normalizeRoleName(roleName);

    const existingRole = await this.roleRepository.findOne({
      where: { tenantId, name: normalizedRole.name },
    });

    if (existingRole) {
      return existingRole;
    }

    const role = this.roleRepository.create({
      tenantId,
      name: normalizedRole.name,
      displayName: normalizedRole.displayName,
      description: `${normalizedRole.displayName} role`,
      isSystem: false,
    } as Role);

    return this.roleRepository.save(role);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.findByEmailAndTenant(
      createUserDto.email,
      createUserDto.tenantId ?? '',
    );
    if (existingUser) {
      throw new ConflictException('Email already in use for this tenant');
    }

    const { role, ...userPayload } = createUserDto;
    const user = this.userRepository.create(userPayload);

    if (user.password) {
      user.password = await HashUtils.hash(user.password);
    }

    const savedUser = await this.userRepository.save(user);

    if (role && createUserDto.tenantId) {
      const resolvedRole = await this.ensureRoleForTenant(createUserDto.tenantId, role);
      await this.addRole(savedUser.id, resolvedRole.id);
    }

    return this.findOneByTenant(savedUser.id, savedUser.tenantId);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.findOneEntityInternal(id);
    return this.sanitizeUser(user);
  }

  async findAllByTenant(tenantId: string): Promise<User[]> {
    const users = await this.userRepository.find({
      where: { tenantId },
      relations: ['roles', 'roles.role', 'permissions', 'permissions.permission'],
      order: { createdAt: 'DESC' },
    });
    return users.map((user) => this.sanitizeUser(user));
  }

  async findOneByTenant(id: string, tenantId: string): Promise<User> {
    const user = await this.findOneEntityByTenant(id, tenantId);
    return this.sanitizeUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByEmailAndTenant(email: string, tenantId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email, tenantId } });
  }

  async updateByTenant(id: string, tenantId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOneEntityByTenant(id, tenantId);

    if (updateUserDto.password) {
      updateUserDto.password = await HashUtils.hash(updateUserDto.password);
    }

    Object.assign(user, updateUserDto);
    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  async removeByTenant(id: string, tenantId: string): Promise<void> {
    const user = await this.findOneEntityByTenant(id, tenantId);
    await this.userRepository.remove(user);
  }

  async addRole(userId: string, roleId: string): Promise<void> {
    const existing = await this.userRoleRepository.findOne({ where: { userId, roleId } });
    if (!existing) {
      const userRole = this.userRoleRepository.create({ userId, roleId });
      await this.userRoleRepository.save(userRole);
    }
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.userRoleRepository.delete({ userId, roleId });
  }

  async grantPermission(userId: string, permissionName: string): Promise<void> {
    const permission = await this.permissionRepository.findOne({ where: { name: permissionName } });
    if (!permission) return;

    const existing = await this.userPermissionRepository.findOne({
      where: { userId, permissionId: permission.id },
    });
    if (existing) {
      existing.granted = true;
      await this.userPermissionRepository.save(existing);
    } else {
      const userPerm = this.userPermissionRepository.create({
        userId,
        permissionId: permission.id,
        granted: true,
      });
      await this.userPermissionRepository.save(userPerm);
    }
  }

  async revokePermission(userId: string, permissionName: string): Promise<void> {
    const permission = await this.permissionRepository.findOne({ where: { name: permissionName } });
    if (!permission) return;

    const existing = await this.userPermissionRepository.findOne({
      where: { userId, permissionId: permission.id },
    });
    if (existing) {
      existing.granted = false;
      await this.userPermissionRepository.save(existing);
    } else {
      const userPerm = this.userPermissionRepository.create({
        userId,
        permissionId: permission.id,
        granted: false,
      });
      await this.userPermissionRepository.save(userPerm);
    }
  }

  async findOneEntity(id: string): Promise<User> {
    return this.findOneEntityInternal(id);
  }

  async updateLastLogin(userId: string, ip?: string): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginAt: new Date(),
      lastLoginIp: ip,
    });
  }

  async updatePassword(userId: string, password: string): Promise<void> {
    const hashed = await HashUtils.hash(password);
    await this.userRepository.update(userId, { password: hashed });
  }

  async invite(tenantId: string, email: string, name: string, role?: string): Promise<{ user: User; tempPassword: string }> {
    const existingUser = await this.findByEmailAndTenant(email, tenantId);
    if (existingUser) {
      throw new ConflictException('Email already in use for this tenant');
    }

    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
    const user = await this.create({
      email,
      name,
      password: tempPassword,
      tenantId,
      role,
    });

    return { user, tempPassword };
  }
}
