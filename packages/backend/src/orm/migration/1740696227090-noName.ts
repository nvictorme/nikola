import { MigrationInterface, QueryRunner } from "typeorm";

export class NoName1740696227090 implements MigrationInterface {
    name = 'NoName1740696227090'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categorias" DROP CONSTRAINT "UQ_b811b5f05010a79aa924ca84a3b"`);
        await queryRunner.query(`ALTER TABLE "categorias" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "subcategorias" DROP COLUMN "name"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subcategorias" ADD "name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categorias" ADD "name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "categorias" ADD CONSTRAINT "UQ_b811b5f05010a79aa924ca84a3b" UNIQUE ("name")`);
    }

}
