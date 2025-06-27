import { MigrationInterface, QueryRunner } from "typeorm";

export class EmailPersona1750993583079 implements MigrationInterface {
    name = 'EmailPersona1750993583079'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "personas" ALTER COLUMN "email" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "personas" DROP CONSTRAINT "UQ_6019651944f62d09f56ff66f600"`);
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "email" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" ALTER COLUMN "email" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "personas" ADD CONSTRAINT "UQ_6019651944f62d09f56ff66f600" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "personas" ALTER COLUMN "email" SET NOT NULL`);
    }

}
