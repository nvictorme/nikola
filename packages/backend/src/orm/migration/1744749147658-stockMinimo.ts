import { MigrationInterface, QueryRunner } from "typeorm";

export class StockMinimo1744749147658 implements MigrationInterface {
    name = 'StockMinimo1744749147658'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos" ADD "stockMinimo" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN "stockMinimo"`);
    }

}
