import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveItemSerial1744583618224 implements MigrationInterface {
    name = 'RemoveItemSerial1744583618224'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes_items" DROP COLUMN "serial"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes_items" ADD "serial" character varying(100)`);
    }

}
