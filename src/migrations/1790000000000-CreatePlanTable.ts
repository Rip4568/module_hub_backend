import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlanTable1790000000000 implements MigrationInterface {
  name = 'CreatePlanTable1790000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "plan" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "priceCents" integer,
        "currency" character varying NOT NULL DEFAULT 'BRL',
        "maxBillableModules" integer,
        "isContactOnly" boolean NOT NULL DEFAULT false,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_plan" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "plan"`);
  }
}
