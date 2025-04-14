import { MigrationInterface, QueryRunner } from "typeorm";

export class HistorialPrecio1744668983755 implements MigrationInterface {
    name = 'HistorialPrecio1744668983755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "historial_precios" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "activo" boolean NOT NULL DEFAULT true, "fechaCreado" TIMESTAMP NOT NULL DEFAULT now(), "fechaActualizado" TIMESTAMP NOT NULL DEFAULT now(), "fechaEliminado" TIMESTAMP, "costo" numeric(10,2) NOT NULL DEFAULT '0', "precio" numeric(10,2) NOT NULL DEFAULT '0', "productoId" uuid, CONSTRAINT "PK_de85b67b8b7238f4b60c05d72ac" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "historial_precios" ADD CONSTRAINT "FK_8e540778f7a785f416ead55f1bd" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "historial_precios" DROP CONSTRAINT "FK_8e540778f7a785f416ead55f1bd"`);
        await queryRunner.query(`DROP TABLE "historial_precios"`);
    }

}
