/** Módulos core — não contam no limite do plano Starter (espelha frontend billing.ts). */
export const ESSENTIAL_MODULE_IDS = [
  'tenant',
  'auth',
  'user',
  'role',
  'permission',
  'tenant-module',
  'erp',
] as const;

export const STARTER_PLAN_MODULE_LIMIT = 5;

export function isEssentialModule(moduleId: string): boolean {
  return (ESSENTIAL_MODULE_IDS as readonly string[]).includes(moduleId);
}

export function countBillableActiveModules(moduleIds: string[]): number {
  return moduleIds.filter((id) => !isEssentialModule(id)).length;
}
