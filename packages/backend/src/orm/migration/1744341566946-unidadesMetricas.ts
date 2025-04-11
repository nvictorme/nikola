import { MigrationInterface, QueryRunner } from "typeorm";

export class UnidadesMetricas1744341566946 implements MigrationInterface {
    name = 'UnidadesMetricas1744341566946'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dimensiones" ALTER COLUMN "unidadPeso" SET DEFAULT 'g'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dimensiones" ALTER COLUMN "unidadPeso" SET DEFAULT 'kg'`);
    }

}
