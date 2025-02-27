import { MigrationInterface, QueryRunner } from "typeorm";

export class Producto1740698680436 implements MigrationInterface {
    name = 'Producto1740698680436'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "productos_galeria" ("productoId" uuid NOT NULL, "archivoId" uuid NOT NULL, CONSTRAINT "PK_0f15a74d0c708e774d63a9b745b" PRIMARY KEY ("productoId", "archivoId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b00256536c039d30edb9f41d31" ON "productos_galeria" ("productoId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8af7ca7d5be4f5dabf23f8dea7" ON "productos_galeria" ("archivoId") `);
        await queryRunner.query(`ALTER TABLE "productos" ADD CONSTRAINT "UQ_7b549f2fd6d65cfcdd6274c21fe" UNIQUE ("slug")`);
        await queryRunner.query(`ALTER TABLE "productos_galeria" ADD CONSTRAINT "FK_b00256536c039d30edb9f41d319" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "productos_galeria" ADD CONSTRAINT "FK_8af7ca7d5be4f5dabf23f8dea71" FOREIGN KEY ("archivoId") REFERENCES "archivos"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "productos_galeria" DROP CONSTRAINT "FK_8af7ca7d5be4f5dabf23f8dea71"`);
        await queryRunner.query(`ALTER TABLE "productos_galeria" DROP CONSTRAINT "FK_b00256536c039d30edb9f41d319"`);
        await queryRunner.query(`ALTER TABLE "productos" DROP CONSTRAINT "UQ_7b549f2fd6d65cfcdd6274c21fe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8af7ca7d5be4f5dabf23f8dea7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b00256536c039d30edb9f41d31"`);
        await queryRunner.query(`DROP TABLE "productos_galeria"`);
    }

}
