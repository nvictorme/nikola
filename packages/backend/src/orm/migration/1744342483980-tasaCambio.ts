import { MigrationInterface, QueryRunner } from "typeorm";

export class TasaCambio1744342483980 implements MigrationInterface {
    name = 'TasaCambio1744342483980'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes" ADD "tasaCambio" numeric(10,2) NOT NULL DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes" DROP COLUMN "tasaCambio"`);
    }

}
