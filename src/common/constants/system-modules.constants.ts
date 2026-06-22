export interface SystemModuleDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEssential?: boolean;
}

export const SYSTEM_MODULES: SystemModuleDefinition[] = [
  {
    id: 'erp',
    name: 'Enterprise Core',
    description:
      'Centralized access to the dashboard and core tenant operations that keep the platform running.',
    icon: 'layout',
    isEssential: true,
  },
  {
    id: 'ecommerce',
    name: 'Unified Storefront',
    description: 'Manage your public catalog and direct-to-customer sales channels with ease.',
    icon: 'shopping-cart',
  },
  {
    id: 'order_management',
    name: 'Order Management',
    description:
      'Process orders, track status changes, and orchestrate fulfillment from a single workflow.',
    icon: 'shopping-bag',
  },
  {
    id: 'fleet_management',
    name: 'Fleet Intelligence',
    description: 'Real-time tracking, diagnostics and management for your logistics operations.',
    icon: 'truck',
  },
  {
    id: 'inventory',
    name: 'Inventory Control',
    description: 'Track stock levels, transfers, and adjustments across your operations.',
    icon: 'package',
  },
];

export const ONBOARDING_SUGGESTED_MODULE_IDS = [
  'ecommerce',
  'order_management',
  'inventory',
  'fleet_management',
] as const;

export function getOnboardingSuggestedModules(): SystemModuleDefinition[] {
  const moduleMap = new Map(SYSTEM_MODULES.map((module) => [module.id, module]));

  return ONBOARDING_SUGGESTED_MODULE_IDS.map((id) => moduleMap.get(id)).filter(
    (module): module is SystemModuleDefinition => module !== undefined,
  );
}
