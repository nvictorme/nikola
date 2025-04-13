import { MigrationInterface, QueryRunner } from "typeorm";

export class Proveedor1744508685588 implements MigrationInterface {
    name = 'Proveedor1744508685588'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes" ADD "proveedorId" uuid`);
        await queryRunner.query(`ALTER TABLE "ordenes" ADD CONSTRAINT "FK_371473164e9d0ae2731f25beade" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ordenes" DROP CONSTRAINT "FK_371473164e9d0ae2731f25beade"`);
        await queryRunner.query(`ALTER TABLE "ordenes" DROP COLUMN "proveedorId"`);
    }

}
