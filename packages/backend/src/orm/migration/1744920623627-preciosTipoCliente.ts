import { MigrationInterface, QueryRunner } from "typeorm";

export class PreciosTipoCliente1744920623627 implements MigrationInterface {
    name = 'PreciosTipoCliente1744920623627'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN "precio"`);
        await queryRunner.query(`ALTER TABLE "productos" ADD "precioGeneral" numeric(10,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "productos" ADD "precioInstalador" numeric(10,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "productos" ADD "precioMayorista" numeric(10,2) DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "productos" ALTER COLUMN "precioOferta" TYPE numeric`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos" ALTER COLUMN "precioOferta" TYPE numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN "precioMayorista"`);
        await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN "precioInstalador"`);
        await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN "precioGeneral"`);
        await queryRunner.query(`ALTER TABLE "productos" ADD "precio" numeric(10,2) DEFAULT '0'`);
    }

}
