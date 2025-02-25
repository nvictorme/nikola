import { MigrationInterface, QueryRunner } from "typeorm";

export class Producto1740506359031 implements MigrationInterface {
    name = 'Producto1740506359031'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos" ALTER COLUMN "costo" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "productos" ALTER COLUMN "precio" SET DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "productos" ALTER COLUMN "precioOferta" SET DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos" ALTER COLUMN "precioOferta" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "productos" ALTER COLUMN "precio" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "productos" ALTER COLUMN "costo" DROP DEFAULT`);
    }

}
