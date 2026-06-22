import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Permission } from './modules/permission/entities/permission.entity';
import { Tenant } from './modules/tenant/entities/tenant.entity';
import { Plan } from './modules/plan/entities/plan.entity';
import { User, UserStatus } from './modules/user/entities/user.entity';
import { TenantModuleEntity } from './modules/tenant-module/entities/tenant-module.entity';
import { Role } from './modules/role/entities/role.entity';
import { UserRole } from './modules/user/entities/user-role.entity';
import { RolePermission } from './modules/role/entities/role-permission.entity';
import { TenantStatus } from './modules/tenant/entities/tenant.entity';
import { HashUtils } from './common/utils/hash.utils';

const DEMO_TENANT = {
  name: 'Demo Company',
  slug: 'demo-company',
  plan: 'starter',
};

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    priceCents: 0,
    maxBillableModules: 5,
    isContactOnly: false,
    sortOrder: 1,
  },
  {
    id: 'profissional',
    name: 'Profissional',
    priceCents: 2590,
    maxBillableModules: 10,
    isContactOnly: false,
    sortOrder: 2,
  },
  {
    id: 'ceo',
    name: 'CEO',
    priceCents: 7990,
    maxBillableModules: 20,
    isContactOnly: false,
    sortOrder: 3,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceCents: null,
    maxBillableModules: null,
    isContactOnly: true,
    sortOrder: 4,
  },
];

const DEMO_USER = {
  name: 'Admin',
  email: 'admin@demo.com',
  password: 'Admin123!',
};

const DEMO_MODULES = [
  'ecommerce',
  'order_management',
  'delivery',
  'fleet_management',
  'drivers_management',
  'financial',
  'user',
  'team_permissions',
  'activity_log',
  'inventory',
  'multi_organization',
  'document',
  'advanced_reports',
];

const PERMISSIONS = [
  // E-commerce
  {
    name: 'can_create_product',
    resource: 'product',
    action: 'create',
    module: 'ecommerce',
    displayName: 'Criar Produto',
  },
  {
    name: 'can_read_product',
    resource: 'product',
    action: 'read',
    module: 'ecommerce',
    displayName: 'Visualizar Produto',
  },
  {
    name: 'can_update_product',
    resource: 'product',
    action: 'update',
    module: 'ecommerce',
    displayName: 'Editar Produto',
    dependencies: ['can_read_product'],
  },
  {
    name: 'can_delete_product',
    resource: 'product',
    action: 'delete',
    module: 'ecommerce',
    displayName: 'Excluir Produto',
    dependencies: ['can_read_product', 'can_update_product'],
  },
  {
    name: 'can_publish_product',
    resource: 'product',
    action: 'publish',
    module: 'ecommerce',
    displayName: 'Publicar Produto',
    dependencies: ['can_read_product', 'can_update_product'],
  },

  {
    name: 'can_create_category',
    resource: 'category',
    action: 'create',
    module: 'ecommerce',
    displayName: 'Criar Categoria',
  },
  {
    name: 'can_read_category',
    resource: 'category',
    action: 'read',
    module: 'ecommerce',
    displayName: 'Visualizar Categoria',
  },
  {
    name: 'can_update_category',
    resource: 'category',
    action: 'update',
    module: 'ecommerce',
    displayName: 'Editar Categoria',
    dependencies: ['can_read_category'],
  },
  {
    name: 'can_delete_category',
    resource: 'category',
    action: 'delete',
    module: 'ecommerce',
    displayName: 'Excluir Categoria',
    dependencies: ['can_read_category'],
  },

  // Orders
  {
    name: 'can_create_order',
    resource: 'order',
    action: 'create',
    module: 'order_management',
    displayName: 'Criar Pedido',
  },
  {
    name: 'can_read_order',
    resource: 'order',
    action: 'read',
    module: 'order_management',
    displayName: 'Visualizar Pedido',
  },
  {
    name: 'can_update_order',
    resource: 'order',
    action: 'update',
    module: 'order_management',
    displayName: 'Editar Pedido',
    dependencies: ['can_read_order'],
  },
  {
    name: 'can_cancel_order',
    resource: 'order',
    action: 'cancel',
    module: 'order_management',
    displayName: 'Cancelar Pedido',
    dependencies: ['can_read_order'],
  },
  {
    name: 'can_approve_order',
    resource: 'order',
    action: 'approve',
    module: 'order_management',
    displayName: 'Aprovar Pedido',
    dependencies: ['can_read_order'],
  },
  {
    name: 'can_assign_driver',
    resource: 'order',
    action: 'assign',
    module: 'order_management',
    displayName: 'Atribuir Motorista',
    dependencies: ['can_read_order', 'can_read_driver'],
  },
  {
    name: 'can_complete_order',
    resource: 'order',
    action: 'complete',
    module: 'order_management',
    displayName: 'Finalizar Pedido',
    dependencies: ['can_read_order', 'can_update_order'],
  },

  // Suppliers
  {
    name: 'can_create_supplier',
    resource: 'supplier',
    action: 'create',
    module: 'multi_organization',
    displayName: 'Criar Fornecedor',
  },
  {
    name: 'can_read_supplier',
    resource: 'supplier',
    action: 'read',
    module: 'multi_organization',
    displayName: 'Visualizar Fornecedor',
  },
  {
    name: 'can_update_supplier',
    resource: 'supplier',
    action: 'update',
    module: 'multi_organization',
    displayName: 'Editar Fornecedor',
    dependencies: ['can_read_supplier'],
  },
  {
    name: 'can_delete_supplier',
    resource: 'supplier',
    action: 'delete',
    module: 'multi_organization',
    displayName: 'Excluir Fornecedor',
    dependencies: ['can_read_supplier'],
  },
  {
    name: 'can_approve_supplier',
    resource: 'supplier',
    action: 'approve',
    module: 'multi_organization',
    displayName: 'Aprovar Fornecedor',
    dependencies: ['can_read_supplier'],
  },
  {
    name: 'can_block_supplier',
    resource: 'supplier',
    action: 'block',
    module: 'multi_organization',
    displayName: 'Bloquear Fornecedor',
    dependencies: ['can_read_supplier'],
  },

  // Fleet
  {
    name: 'can_create_vehicle',
    resource: 'vehicle',
    action: 'create',
    module: 'fleet_management',
    displayName: 'Criar Veículo',
  },
  {
    name: 'can_read_vehicle',
    resource: 'vehicle',
    action: 'read',
    module: 'fleet_management',
    displayName: 'Visualizar Veículo',
  },
  {
    name: 'can_update_vehicle',
    resource: 'vehicle',
    action: 'update',
    module: 'fleet_management',
    displayName: 'Editar Veículo',
    dependencies: ['can_read_vehicle'],
  },
  {
    name: 'can_delete_vehicle',
    resource: 'vehicle',
    action: 'delete',
    module: 'fleet_management',
    displayName: 'Excluir Veículo',
    dependencies: ['can_read_vehicle'],
  },
  {
    name: 'can_approve_vehicle',
    resource: 'vehicle',
    action: 'approve',
    module: 'fleet_management',
    displayName: 'Aprovar Veículo',
    dependencies: ['can_read_vehicle'],
  },
  {
    name: 'can_set_maintenance',
    resource: 'vehicle',
    action: 'maintenance',
    module: 'fleet_management',
    displayName: 'Definir Manutenção',
    dependencies: ['can_read_vehicle', 'can_update_vehicle'],
  },

  // Drivers
  {
    name: 'can_create_driver',
    resource: 'driver',
    action: 'create',
    module: 'drivers_management',
    displayName: 'Criar Motorista',
  },
  {
    name: 'can_read_driver',
    resource: 'driver',
    action: 'read',
    module: 'drivers_management',
    displayName: 'Visualizar Motorista',
  },
  {
    name: 'can_update_driver',
    resource: 'driver',
    action: 'update',
    module: 'drivers_management',
    displayName: 'Editar Motorista',
    dependencies: ['can_read_driver'],
  },
  {
    name: 'can_delete_driver',
    resource: 'driver',
    action: 'delete',
    module: 'drivers_management',
    displayName: 'Excluir Motorista',
    dependencies: ['can_read_driver'],
  },
  {
    name: 'can_approve_driver',
    resource: 'driver',
    action: 'approve',
    module: 'drivers_management',
    displayName: 'Aprovar Motorista',
    dependencies: ['can_read_driver'],
  },
  {
    name: 'can_block_driver',
    resource: 'driver',
    action: 'block',
    module: 'drivers_management',
    displayName: 'Bloquear Motorista',
    dependencies: ['can_read_driver'],
  },

  // Financial
  {
    name: 'can_read_financial',
    resource: 'financial',
    action: 'read',
    module: 'financial',
    displayName: 'Visualizar Financeiro',
  },
  {
    name: 'can_create_payment',
    resource: 'payment',
    action: 'create',
    module: 'financial',
    displayName: 'Criar Pagamento',
    dependencies: ['can_read_financial'],
  },
  {
    name: 'can_approve_payment',
    resource: 'payment',
    action: 'approve',
    module: 'financial',
    displayName: 'Aprovar Pagamento',
    dependencies: ['can_read_financial'],
  },
  {
    name: 'can_cancel_payment',
    resource: 'payment',
    action: 'cancel',
    module: 'financial',
    displayName: 'Cancelar Pagamento',
    dependencies: ['can_read_financial'],
  },
  {
    name: 'can_view_balance',
    resource: 'balance',
    action: 'read',
    module: 'financial',
    displayName: 'Ver Saldo',
    dependencies: ['can_read_financial'],
  },
  {
    name: 'can_export_financial',
    resource: 'financial',
    action: 'export',
    module: 'financial',
    displayName: 'Exportar Financeiro',
    dependencies: ['can_read_financial'],
  },

  // Users & Teams
  {
    name: 'can_create_user',
    resource: 'user',
    action: 'create',
    module: 'user',
    displayName: 'Criar Usuário',
  },
  {
    name: 'can_read_user',
    resource: 'user',
    action: 'read',
    module: 'user',
    displayName: 'Visualizar Usuário',
  },
  {
    name: 'can_update_user',
    resource: 'user',
    action: 'update',
    module: 'user',
    displayName: 'Editar Usuário',
    dependencies: ['can_read_user'],
  },
  {
    name: 'can_delete_user',
    resource: 'user',
    action: 'delete',
    module: 'user',
    displayName: 'Excluir Usuário',
    dependencies: ['can_read_user'],
  },
  {
    name: 'can_manage_roles',
    resource: 'role',
    action: 'manage',
    module: 'team_permissions',
    displayName: 'Gerenciar Papéis',
  },
  {
    name: 'can_manage_permissions',
    resource: 'permission',
    action: 'manage',
    module: 'team_permissions',
    displayName: 'Gerenciar Permissões',
  },

  // Reports
  {
    name: 'can_read_report',
    resource: 'report',
    action: 'read',
    module: 'advanced_reports',
    displayName: 'Visualizar Relatórios',
  },
  {
    name: 'can_export_report',
    resource: 'report',
    action: 'export',
    module: 'advanced_reports',
    displayName: 'Exportar Relatórios',
    dependencies: ['can_read_report'],
  },
  {
    name: 'can_create_custom_report',
    resource: 'report',
    action: 'create',
    module: 'advanced_reports',
    displayName: 'Criar Relatório Personalizado',
    dependencies: ['can_read_report'],
  },
  {
    name: 'can_schedule_report',
    resource: 'report',
    action: 'schedule',
    module: 'advanced_reports',
    displayName: 'Agendar Relatórios',
    dependencies: ['can_read_report'],
  },

  // Customers
  {
    name: 'can_create_customer',
    resource: 'customer',
    action: 'create',
    module: 'ecommerce',
    displayName: 'Criar Cliente',
  },
  {
    name: 'can_read_customer',
    resource: 'customer',
    action: 'read',
    module: 'ecommerce',
    displayName: 'Visualizar Cliente',
  },
  {
    name: 'can_update_customer',
    resource: 'customer',
    action: 'update',
    module: 'ecommerce',
    displayName: 'Editar Cliente',
    dependencies: ['can_read_customer'],
  },
  {
    name: 'can_delete_customer',
    resource: 'customer',
    action: 'delete',
    module: 'ecommerce',
    displayName: 'Excluir Cliente',
    dependencies: ['can_read_customer'],
  },

  // Inventory
  {
    name: 'can_transfer_inventory',
    resource: 'inventory',
    action: 'transfer',
    module: 'inventory',
    displayName: 'Transferir Estoque',
  },
  {
    name: 'can_adjust_inventory',
    resource: 'inventory',
    action: 'adjust',
    module: 'inventory',
    displayName: 'Ajustar Estoque',
    dependencies: ['can_read_inventory'],
  },
  {
    name: 'can_read_inventory',
    resource: 'inventory',
    action: 'read',
    module: 'inventory',
    displayName: 'Visualizar Estoque',
  },

  // Delivery
  {
    name: 'can_create_delivery',
    resource: 'delivery',
    action: 'create',
    module: 'delivery',
    displayName: 'Criar Entrega',
  },
  {
    name: 'can_read_delivery',
    resource: 'delivery',
    action: 'read',
    module: 'delivery',
    displayName: 'Visualizar Entrega',
  },
  {
    name: 'can_update_delivery',
    resource: 'delivery',
    action: 'update',
    module: 'delivery',
    displayName: 'Editar Entrega',
    dependencies: ['can_read_delivery'],
  },
  {
    name: 'can_complete_delivery',
    resource: 'delivery',
    action: 'complete',
    module: 'delivery',
    displayName: 'Finalizar Entrega',
    dependencies: ['can_read_delivery'],
  },

  // Documents
  {
    name: 'can_create_document',
    resource: 'document',
    action: 'create',
    module: 'document',
    displayName: 'Criar Documento',
  },
  {
    name: 'can_read_document',
    resource: 'document',
    action: 'read',
    module: 'document',
    displayName: 'Visualizar Documento',
  },
  {
    name: 'can_delete_document',
    resource: 'document',
    action: 'delete',
    module: 'document',
    displayName: 'Excluir Documento',
    dependencies: ['can_read_document'],
  },

  // Activity Log
  {
    name: 'can_read_activity_log',
    resource: 'activity-log',
    action: 'read',
    module: 'activity_log',
    displayName: 'Visualizar Log de Atividades',
  },

  // Tenant
  {
    name: 'can_create_tenant',
    resource: 'tenant',
    action: 'create',
    module: 'tenant',
    displayName: 'Criar Tenant',
  },
  {
    name: 'can_read_tenant',
    resource: 'tenant',
    action: 'read',
    module: 'tenant',
    displayName: 'Visualizar Tenant',
  },
  {
    name: 'can_update_tenant',
    resource: 'tenant',
    action: 'update',
    module: 'tenant',
    displayName: 'Editar Tenant',
    dependencies: ['can_read_tenant'],
  },
  {
    name: 'can_manage_modules',
    resource: 'tenant-module',
    action: 'manage',
    module: 'tenant',
    displayName: 'Gerenciar Módulos',
    dependencies: ['can_read_tenant'],
  },
];

async function seed() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  const permissionRepo = dataSource.getRepository(Permission);

  console.log('🌱 Seeding permissions...');

  for (const permissionData of PERMISSIONS) {
    const existing = await permissionRepo.findOne({
      where: { name: permissionData.name },
    });
    if (existing) {
      await permissionRepo.update(existing.id, {
        ...permissionData,
        dependencies: permissionData.dependencies || [],
      });
    } else {
      await permissionRepo.save({
        ...permissionData,
        dependencies: permissionData.dependencies || [],
      });
    }
  }

  console.log('✅ Permissions seeded successfully!');

  // --- Seed Plans ---
  const planRepo = dataSource.getRepository(Plan);
  console.log('🌱 Seeding plans...');
  for (const planData of PLANS) {
    const existing = await planRepo.findOne({ where: { id: planData.id } });
    if (existing) {
      await planRepo.update(existing.id, planData);
      console.log(`  Updated plan: ${planData.name}`);
    } else {
      await planRepo.save(planRepo.create(planData));
      console.log(`  Created plan: ${planData.name}`);
    }
  }
  console.log('✅ Plans seeded successfully!');

  // --- Seed Demo Tenant ---
  const tenantRepo = dataSource.getRepository(Tenant);
  console.log('🌱 Seeding demo tenant...');
  let tenant = await tenantRepo.findOne({ where: { slug: DEMO_TENANT.slug } });
  if (!tenant) {
    tenant = tenantRepo.create({
      name: DEMO_TENANT.name,
      slug: DEMO_TENANT.slug,
      status: TenantStatus.ACTIVE,
      plan: DEMO_TENANT.plan,
      config: { onboardingCompleted: true },
    });
    tenant = await tenantRepo.save(tenant);
    console.log(`  Created tenant: ${tenant.name} (${tenant.id})`);
  } else {
    console.log(`  Tenant already exists: ${tenant.name} (${tenant.id})`);
    if (!tenant.plan) {
      tenant.plan = DEMO_TENANT.plan;
    }
    tenant.config = { ...(tenant.config || {}), onboardingCompleted: true };
    tenant = await tenantRepo.save(tenant);
  }

  // --- Seed Admin Role ---
  const roleRepo = dataSource.getRepository(Role);
  console.log('🌱 Seeding admin role...');
  let adminRole = await roleRepo.findOne({
    where: { tenantId: tenant.id, name: 'admin' },
  });
  if (!adminRole) {
    adminRole = roleRepo.create({
      tenantId: tenant.id,
      name: 'admin',
      displayName: 'Administrador',
      description: 'Full access administrator role',
      isSystem: true,
    });
    adminRole = await roleRepo.save(adminRole);
    console.log(`  Created role: ${adminRole.displayName} (${adminRole.id})`);
  } else {
    console.log(`  Role already exists: ${adminRole.displayName} (${adminRole.id})`);
  }

  // --- Assign all permissions to admin role ---
  console.log('🌱 Assigning all permissions to admin role...');
  const allPermissions = await permissionRepo.find();
  const existingRolePerms = await dataSource.getRepository(RolePermission).find({
    where: { roleId: adminRole.id },
  });
  const existingPermIds = new Set(existingRolePerms.map((rp) => rp.permissionId));
  const newRolePerms = allPermissions
    .filter((p) => !existingPermIds.has(p.id))
    .map((p) =>
      dataSource.getRepository(RolePermission).create({
        roleId: adminRole.id,
        permissionId: p.id,
      }),
    );
  if (newRolePerms.length > 0) {
    await dataSource.getRepository(RolePermission).save(newRolePerms);
    console.log(`  Assigned ${newRolePerms.length} permissions to admin role`);
  } else {
    console.log('  All permissions already assigned to admin role');
  }

  // --- Seed Admin User ---
  const userRepo = dataSource.getRepository(User);
  console.log('🌱 Seeding admin user...');
  let adminUser = await userRepo.findOne({
    where: { tenantId: tenant.id, email: DEMO_USER.email },
  });
  if (!adminUser) {
    const hashedPassword = await HashUtils.hash(DEMO_USER.password);
    adminUser = userRepo.create({
      tenantId: tenant.id,
      name: DEMO_USER.name,
      email: DEMO_USER.email,
      password: hashedPassword,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });
    adminUser = await userRepo.save(adminUser);
    console.log(`  Created user: ${adminUser.name} (${adminUser.id})`);
  } else {
    console.log(`  User already exists: ${adminUser.name} (${adminUser.id})`);
  }

  // --- Assign admin role to user ---
  const userRoleRepo = dataSource.getRepository(UserRole);
  console.log('🌱 Assigning admin role to user...');
  const existingUserRole = await userRoleRepo.findOne({
    where: { userId: adminUser.id, roleId: adminRole.id },
  });
  if (!existingUserRole) {
    const userRole = userRoleRepo.create({
      userId: adminUser.id,
      roleId: adminRole.id,
    });
    await userRoleRepo.save(userRole);
    console.log('  Assigned admin role to user');
  } else {
    console.log('  User already has admin role');
  }

  // --- Seed Tenant Modules ---
  const tenantModuleRepo = dataSource.getRepository(TenantModuleEntity);
  console.log('🌱 Seeding tenant modules...');
  for (const moduleId of DEMO_MODULES) {
    const existingModule = await tenantModuleRepo.findOne({
      where: { tenantId: tenant.id, moduleId },
    });
    if (!existingModule) {
      const tenantModule = tenantModuleRepo.create({
        tenantId: tenant.id,
        moduleId,
        isActive: true,
      });
      await tenantModuleRepo.save(tenantModule);
      console.log(`  Activated module: ${moduleId}`);
    } else {
      console.log(`  Module already active: ${moduleId}`);
    }
  }

  console.log('✅ Seed completed successfully!');
  await app.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
