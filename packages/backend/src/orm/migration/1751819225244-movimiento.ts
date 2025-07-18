import { MigrationInterface, QueryRunner } from "typeorm";

export class Movimiento1751819225244 implements MigrationInterface {
    name = 'Movimiento1751819225244'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "movimientos_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "activo" boolean NOT NULL DEFAULT true, "fechaCreado" TIMESTAMP NOT NULL DEFAULT now(), "fechaActualizado" TIMESTAMP NOT NULL DEFAULT now(), "fechaEliminado" TIMESTAMP, "cantidad" integer NOT NULL, "notas" text NOT NULL, "productoId" uuid, "movimientoId" uuid, CONSTRAINT "PK_3e6d1e93fb3bbc7e7e2fcb308df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."movimientos_historial_estatus_enum" AS ENUM('Pendiente', 'Aprobado', 'Transito', 'Recibido', 'Anulado')`);
        await queryRunner.query(`CREATE TABLE "movimientos_historial" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "activo" boolean NOT NULL DEFAULT true, "fechaCreado" TIMESTAMP NOT NULL DEFAULT now(), "fechaActualizado" TIMESTAMP NOT NULL DEFAULT now(), "fechaEliminado" TIMESTAMP, "estatus" "public"."movimientos_historial_estatus_enum" NOT NULL DEFAULT 'Pendiente', "notas" text, "movimientoId" uuid, "usuarioId" uuid, CONSTRAINT "PK_898567503e98a723e8e0f83ae77" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."movimientos_estatus_enum" AS ENUM('Pendiente', 'Aprobado', 'Transito', 'Recibido', 'Anulado')`);
        await queryRunner.query(`CREATE TABLE "movimientos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "activo" boolean NOT NULL DEFAULT true, "fechaCreado" TIMESTAMP NOT NULL DEFAULT now(), "fechaActualizado" TIMESTAMP NOT NULL DEFAULT now(), "fechaEliminado" TIMESTAMP, "serial" SERIAL NOT NULL, "estatus" "public"."movimientos_estatus_enum" NOT NULL DEFAULT 'Pendiente', "notas" text, "origenId" uuid, "destinoId" uuid, "usuarioId" uuid, CONSTRAINT "PK_519702aa97def3e7c1b6cc5e2f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "movimientos_items" ADD CONSTRAINT "FK_2a2035ffd01b862de90c380dcf7" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos_items" ADD CONSTRAINT "FK_dce7192276314936522b79cc6e1" FOREIGN KEY ("movimientoId") REFERENCES "movimientos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos_historial" ADD CONSTRAINT "FK_fe69685d60594d91fda5b9410de" FOREIGN KEY ("movimientoId") REFERENCES "movimientos"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos_historial" ADD CONSTRAINT "FK_09168d3856eaddcd9d9448ba709" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos" ADD CONSTRAINT "FK_d2855b22f4b5120ae70052e5af0" FOREIGN KEY ("origenId") REFERENCES "almacenes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos" ADD CONSTRAINT "FK_3a5880f3fae856b074862c1c677" FOREIGN KEY ("destinoId") REFERENCES "almacenes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimientos" ADD CONSTRAINT "FK_82b5cb68093077742683848ee82" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "movimientos" DROP CONSTRAINT "FK_82b5cb68093077742683848ee82"`);
        await queryRunner.query(`ALTER TABLE "movimientos" DROP CONSTRAINT "FK_3a5880f3fae856b074862c1c677"`);
        await queryRunner.query(`ALTER TABLE "movimientos" DROP CONSTRAINT "FK_d2855b22f4b5120ae70052e5af0"`);
        await queryRunner.query(`ALTER TABLE "movimientos_historial" DROP CONSTRAINT "FK_09168d3856eaddcd9d9448ba709"`);
        await queryRunner.query(`ALTER TABLE "movimientos_historial" DROP CONSTRAINT "FK_fe69685d60594d91fda5b9410de"`);
        await queryRunner.query(`ALTER TABLE "movimientos_items" DROP CONSTRAINT "FK_dce7192276314936522b79cc6e1"`);
        await queryRunner.query(`ALTER TABLE "movimientos_items" DROP CONSTRAINT "FK_2a2035ffd01b862de90c380dcf7"`);
        await queryRunner.query(`DROP TABLE "movimientos"`);
        await queryRunner.query(`DROP TYPE "public"."movimientos_estatus_enum"`);
        await queryRunner.query(`DROP TABLE "movimientos_historial"`);
        await queryRunner.query(`DROP TYPE "public"."movimientos_historial_estatus_enum"`);
        await queryRunner.query(`DROP TABLE "movimientos_items"`);
    }

}
