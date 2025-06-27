import { MigrationInterface, QueryRunner } from "typeorm";

export class PrecioManual1750907456296 implements MigrationInterface {
    name = 'PrecioManual1750907456296'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes_items" ADD "precioManual" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes_items" DROP COLUMN "precioManual"`);
    }

}
