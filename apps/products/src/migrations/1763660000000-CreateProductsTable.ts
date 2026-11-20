import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProductsTable1763660000000 implements MigrationInterface {
  name = 'CreateProductsTable1763660000000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "name" character varying(120) NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "price" numeric(10,2) NOT NULL,
        "active" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_products_id" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      'CREATE INDEX "IDX_products_name" ON "products" ("name")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "IDX_products_name"');
    await queryRunner.query('DROP TABLE "products"');
  }
}
