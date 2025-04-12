import { MigrationInterface, QueryRunner } from "typeorm";

export class DefaultBCV1744490135258 implements MigrationInterface {
    name = 'DefaultBCV1744490135258'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes" ALTER COLUMN "tipoCambio" SET DEFAULT 'BCV'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes" ALTER COLUMN "tipoCambio" SET DEFAULT 'USD'`);
    }

}
