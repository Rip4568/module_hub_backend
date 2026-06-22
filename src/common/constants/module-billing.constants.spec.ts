import {
  ESSENTIAL_MODULE_IDS,
  isEssentialModule,
  countBillableActiveModules,
  STARTER_PLAN_MODULE_LIMIT,
} from './module-billing.constants';

describe('module-billing.constants', () => {
  it('does not count essential modules toward plan limit', () => {
    const modules = ['erp', 'tenant', 'auth', 'ecommerce', 'delivery', 'financial'];
    expect(countBillableActiveModules(modules)).toBe(3);
  });

  it('identifies essential modules', () => {
    expect(isEssentialModule('erp')).toBe(true);
    expect(isEssentialModule('order_management')).toBe(false);
  });

  it('exports starter limit', () => {
    expect(STARTER_PLAN_MODULE_LIMIT).toBe(5);
    expect(ESSENTIAL_MODULE_IDS).toContain('tenant-module');
  });
});
