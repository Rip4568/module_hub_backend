import { MigrationInterface, QueryRunner } from 'typeorm';

const TENANT_AWARE_TABLES = [
  'user',
  'product',
  'order',
  'order_item',
  'organization',
  'driver',
  'delivery',
  'vehicle',
  'customers',
  'document',
  'transaction',
  'category',
  'inventory_logs',
  'bank_account',
  'product_ecommerce_profiles',
  'delivery_documents',
  'delivery_tracking_logs',
];

export class AddTenantIdIndexes1770000000000 implements MigrationInterface {
  name = 'AddTenantIdIndexes1770000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of TENANT_AWARE_TABLES) {
      await queryRunner.query(
        `CREATE INDEX IF NOT EXISTS "IDX_${table}_tenant_id" ON "${table}" ("tenant_id")`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of TENANT_AWARE_TABLES) {
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_${table}_tenant_id"`);
    }
  }
}
