import { MigrationInterface, QueryRunner } from "typeorm";

export class Oferta1740425386487 implements MigrationInterface {
    name = 'Oferta1740425386487'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos" ADD "precioOferta" numeric(10,2)`);
        await queryRunner.query(`ALTER TABLE "productos" ADD "enOferta" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "productos" ADD "inicioOferta" character varying`);
        await queryRunner.query(`ALTER TABLE "productos" ADD "finOferta" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN "finOferta"`);
        await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN "inicioOferta"`);
        await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN "enOferta"`);
        await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN "precioOferta"`);
    }

}
