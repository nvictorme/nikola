import { MigrationInterface, QueryRunner } from "typeorm";

export class CreditoBalance1744340278025 implements MigrationInterface {
    name = 'CreditoBalance1744340278025'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "personas" ADD "creditoHabilitado" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "personas" ADD "creditoLimite" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "personas" ADD "balance" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "creditoHabilitado" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "creditoLimite" numeric(10,2) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "creditoLimite"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "creditoHabilitado"`);
        await queryRunner.query(`ALTER TABLE "personas" DROP COLUMN "balance"`);
        await queryRunner.query(`ALTER TABLE "personas" DROP COLUMN "creditoLimite"`);
        await queryRunner.query(`ALTER TABLE "personas" DROP COLUMN "creditoHabilitado"`);
    }

}
