import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTenantIdToBankAccountAndOrderItem1750500000000 implements MigrationInterface {
  name = 'AddTenantIdToBankAccountAndOrderItem1750500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "bank_account" ADD "tenant_id" character varying`);
    await queryRunner.query(
      `UPDATE "bank_account" ba SET "tenant_id" = o."tenant_id" FROM "organization" o WHERE ba."organizationId" = o."id"`,
    );
    await queryRunner.query(`ALTER TABLE "bank_account" ALTER COLUMN "tenant_id" SET NOT NULL`);

    await queryRunner.query(`ALTER TABLE "order_item" ADD "tenant_id" character varying`);
    await queryRunner.query(
      `UPDATE "order_item" oi SET "tenant_id" = o."tenant_id" FROM "order" o WHERE oi."orderId" = o."id"`,
    );
    await queryRunner.query(`ALTER TABLE "order_item" ALTER COLUMN "tenant_id" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "order_item" DROP COLUMN "tenant_id"`);
    await queryRunner.query(`ALTER TABLE "bank_account" DROP COLUMN "tenant_id"`);
  }
}
