import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { UserRole } from '../user/entities/user-role.entity';
import { UserPermission } from '../user/entities/user-permission.entity';
import { RoleName } from '../role/enums/role-name.enum';
import { User } from '../user/entities/user.entity';
import { Role } from '../role/entities/role.entity';
import { TenantModuleService } from '../tenant-module/tenant-module.service';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(UserRole)
    private userRoleRepository: Repository<UserRole>,
    @InjectRepository(UserPermission)
    private userPermissionRepository: Repository<UserPermission>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @Inject(forwardRef(() => TenantModuleService))
    private tenantModuleService: TenantModuleService,
  ) {}

  /**
   * Verifica se o usuário tem as permissões necessárias.
   * Otimizado para fazer menos consultas ao banco, mas ainda assim pode ser melhorado
   * com cache (Redis/JWT) no futuro.
   */
  async userHasPermissions(
    userId: string,
    tenantId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId, tenantId);

    if (userPermissions.includes('*')) {
      return true;
    }

    for (const permission of requiredPermissions) {
      if (!userPermissions.includes(permission)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Retorna todas as permissões do usuário, resolvendo dependências.
   * Usa o banco de dados como fonte única de verdade para dependências.
   */
  async getUserPermissions(userId: string, tenantId: string): Promise<string[]> {
    const permissionNames = new Set<string>();
    const permissionDependencyMap = new Map<string, string[]>();

    const userRoles = await this.userRoleRepository
      .createQueryBuilder('userRole')
      .innerJoinAndSelect('userRole.role', 'role')
      .leftJoinAndSelect('role.permissions', 'rolePermissions')
      .leftJoinAndSelect('rolePermissions.permission', 'permission')
      .where('userRole.userId = :userId', { userId })
      .andWhere('role.tenantId = :tenantId', { tenantId })
      .getMany();

    for (const userRole of userRoles) {
      const roleName = userRole.role?.name?.toLowerCase();
      if (roleName === RoleName.ADMIN || userRole.role?.isSystem) {
        permissionNames.add('*');
      }
      for (const rolePermission of userRole.role.permissions) {
        const permName = rolePermission.permission.name;
        permissionNames.add(permName);
        if (
          rolePermission.permission.dependencies &&
          rolePermission.permission.dependencies.length > 0
        ) {
          permissionDependencyMap.set(permName, rolePermission.permission.dependencies);
        }
      }
    }

    if (userRoles.length === 0) {
      const userBelongsToTenant = await this.userRepository.exist({
        where: { id: userId, tenantId },
      });
      if (userBelongsToTenant) {
        const tenantRoleAssignmentsCount = await this.userRoleRepository
          .createQueryBuilder('userRole')
          .innerJoin('userRole.role', 'role')
          .where('role.tenantId = :tenantId', { tenantId })
          .getCount();

        if (tenantRoleAssignmentsCount === 0) {
          const firstTenantUser = await this.userRepository.findOne({
            where: { tenantId },
            order: { createdAt: 'ASC' },
          });

          if (firstTenantUser?.id === userId) {
            const adminRole = await this.roleRepository.findOne({
              where: { tenantId, name: RoleName.ADMIN },
            });

            if (adminRole) {
              await this.userRoleRepository.save(
                this.userRoleRepository.create({
                  userId,
                  roleId: adminRole.id,
                }),
              );
            }

            permissionNames.add('*');
            return Array.from(permissionNames);
          }
        }

        const tenantUserCount = await this.userRepository.count({
          where: { tenantId },
        });
        if (tenantUserCount <= 1) {
          permissionNames.add('*');
          return Array.from(permissionNames);
        }
      }
    }

    const userDirectPermissions = await this.userPermissionRepository.find({
      where: { userId },
      relations: ['permission'],
    });

    for (const userPermission of userDirectPermissions) {
      const permName = userPermission.permission.name;
      if (userPermission.granted) {
        permissionNames.add(permName);
        if (
          userPermission.permission.dependencies &&
          userPermission.permission.dependencies.length > 0
        ) {
          permissionDependencyMap.set(permName, userPermission.permission.dependencies);
        }
      } else {
        // Revogação explícita
        permissionNames.delete(permName);
        permissionDependencyMap.delete(permName);
      }
    }

    const permsList = Array.from(permissionNames);
    for (const perm of permsList) {
      const deps = permissionDependencyMap.get(perm);
      if (deps) {
        deps.forEach((dep) => permissionNames.add(dep));
      }
    }

    return Array.from(permissionNames);
  }

  // Método auxiliar para obter dependências de uma permissão específica consultando o banco
  // Usado em canGrantPermission
  private async getPermissionDependenciesFromDb(permissionName: string): Promise<string[]> {
    const permission = await this.permissionRepository.findOne({ where: { name: permissionName } });
    return permission?.dependencies || [];
  }

  async canGrantPermission(
    userId: string,
    tenantId: string,
    permissionToGrant: string,
  ): Promise<{ valid: boolean; missingDependencies?: string[] }> {
    const dependencies = await this.getPermissionDependenciesFromDb(permissionToGrant);

    if (dependencies.length === 0) {
      return { valid: true };
    }

    const userPermissions = await this.getUserPermissions(userId, tenantId);
    const missingDependencies = dependencies.filter((dep) => !userPermissions.includes(dep));

    if (missingDependencies.length > 0) {
      return {
        valid: false,
        missingDependencies,
      };
    }

    return { valid: true };
  }

  async findAll(tenantId: string) {
    const activeModules = await this.tenantModuleService.getActiveModules(tenantId);
    return this.permissionRepository.find({
      where: { module: In(activeModules) },
    });
  }
}
