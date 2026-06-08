import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { Permission } from './modules/permission/entities/permission.entity';

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
  await app.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
