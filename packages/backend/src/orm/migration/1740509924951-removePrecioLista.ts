import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePrecioLista1740509924951 implements MigrationInterface {
    name = 'RemovePrecioLista1740509924951'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes_items" DROP COLUMN "precioLista"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes_items" ADD "precioLista" numeric(10,2) NOT NULL`);
    }

}
