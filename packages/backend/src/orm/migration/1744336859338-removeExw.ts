import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveExw1744336859338 implements MigrationInterface {
    name = 'RemoveExw1744336859338'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "exw"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "exw" boolean NOT NULL DEFAULT false`);
    }

}
