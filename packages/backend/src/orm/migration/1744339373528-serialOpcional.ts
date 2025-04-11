import { MigrationInterface, QueryRunner } from "typeorm";

export class SerialOpcional1744339373528 implements MigrationInterface {
    name = 'SerialOpcional1744339373528'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes_items" DROP COLUMN "serial"`);
        await queryRunner.query(`ALTER TABLE "ordenes_items" ADD "serial" character varying(100)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes_items" DROP COLUMN "serial"`);
        await queryRunner.query(`ALTER TABLE "ordenes_items" ADD "serial" character varying(50)`);
    }

}
