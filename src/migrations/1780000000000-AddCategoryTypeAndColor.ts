import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoryTypeAndColor1780000000000 implements MigrationInterface {
  name = 'AddCategoryTypeAndColor1780000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "type" character varying`,
    );
    await queryRunner.query(
      `ALTER TABLE "category" ADD COLUMN IF NOT EXISTS "color" character varying`,
    );
    await queryRunner.query(
      `UPDATE "category" SET "type" = 'product' WHERE "type" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN IF EXISTS "color"`);
    await queryRunner.query(`ALTER TABLE "category" DROP COLUMN IF EXISTS "type"`);
  }
}
