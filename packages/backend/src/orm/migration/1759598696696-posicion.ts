import { MigrationInterface, QueryRunner } from "typeorm";

export class Posicion1759598696696 implements MigrationInterface {
    name = 'Posicion1759598696696'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos" ADD "posicion" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos" DROP COLUMN "posicion"`);
    }

}
