import { MigrationInterface, QueryRunner } from "typeorm";

export class TipoClienteCambio1744481148074 implements MigrationInterface {
    name = 'TipoClienteCambio1744481148074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."personas_tipocliente_enum" AS ENUM('Instalador', 'Mayorista', 'General')`);
        await queryRunner.query(`ALTER TABLE "personas" ADD "tipoCliente" "public"."personas_tipocliente_enum" NOT NULL DEFAULT 'General'`);
        await queryRunner.query(`CREATE TYPE "public"."usuarios_tipocliente_enum" AS ENUM('Instalador', 'Mayorista', 'General')`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD "tipoCliente" "public"."usuarios_tipocliente_enum" NOT NULL DEFAULT 'General'`);
        await queryRunner.query(`CREATE TYPE "public"."ordenes_tipocambio_enum" AS ENUM('USD', 'BCV')`);
        await queryRunner.query(`ALTER TABLE "ordenes" ADD "tipoCambio" "public"."ordenes_tipocambio_enum" NOT NULL DEFAULT 'USD'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes" DROP COLUMN "tipoCambio"`);
        await queryRunner.query(`DROP TYPE "public"."ordenes_tipocambio_enum"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "tipoCliente"`);
        await queryRunner.query(`DROP TYPE "public"."usuarios_tipocliente_enum"`);
        await queryRunner.query(`ALTER TABLE "personas" DROP COLUMN "tipoCliente"`);
        await queryRunner.query(`DROP TYPE "public"."personas_tipocliente_enum"`);
    }

}
