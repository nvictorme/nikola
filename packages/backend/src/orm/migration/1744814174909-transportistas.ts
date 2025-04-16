import { MigrationInterface, QueryRunner } from "typeorm";

export class Transportistas1744814174909 implements MigrationInterface {
    name = 'Transportistas1744814174909'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."envios_transportista_enum" RENAME TO "envios_transportista_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."envios_transportista_enum" AS ENUM('MRW', 'Tealca', 'Zoom', 'Asiaven', 'KExport', 'MeLoTraeCP', 'DHL', 'UPS', 'FedEx', 'TNT', 'Otro')`);
        await queryRunner.query(`ALTER TABLE "envios" ALTER COLUMN "transportista" TYPE "public"."envios_transportista_enum" USING "transportista"::"text"::"public"."envios_transportista_enum"`);
        await queryRunner.query(`ALTER TABLE "envios" ALTER COLUMN "transportista" SET DEFAULT 'Otro'`);
        await queryRunner.query(`DROP TYPE "public"."envios_transportista_enum_old"`);
        await queryRunner.query(`ALTER TABLE "envios" ALTER COLUMN "transportista" SET DEFAULT 'Otro'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "envios" ALTER COLUMN "transportista" DROP DEFAULT`);
        await queryRunner.query(`CREATE TYPE "public"."envios_transportista_enum_old" AS ENUM('DHL', 'UPS', 'FedEx', 'TNT', 'Marítimo', 'Terrestre', 'Otro')`);
        await queryRunner.query(`ALTER TABLE "envios" ALTER COLUMN "transportista" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "envios" ALTER COLUMN "transportista" TYPE "public"."envios_transportista_enum_old" USING "transportista"::"text"::"public"."envios_transportista_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."envios_transportista_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."envios_transportista_enum_old" RENAME TO "envios_transportista_enum"`);
    }

}
