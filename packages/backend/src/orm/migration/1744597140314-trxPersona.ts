import { MigrationInterface, QueryRunner } from "typeorm";

export class TrxPersona1744597140314 implements MigrationInterface {
    name = 'TrxPersona1744597140314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transacciones" DROP CONSTRAINT "FK_5177666e7d85390208261d069ba"`);
        await queryRunner.query(`ALTER TABLE "transacciones" RENAME COLUMN "usuarioId" TO "personaId"`);
        await queryRunner.query(`ALTER TABLE "ordenes" ALTER COLUMN "tipoDescuento" SET DEFAULT 'Absoluto'`);
        await queryRunner.query(`ALTER TABLE "transacciones" ADD CONSTRAINT "FK_8d6dac1ead9fadbd59de549cb7b" FOREIGN KEY ("personaId") REFERENCES "personas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "transacciones" DROP CONSTRAINT "FK_8d6dac1ead9fadbd59de549cb7b"`);
        await queryRunner.query(`ALTER TABLE "ordenes" ALTER COLUMN "tipoDescuento" SET DEFAULT 'Porcentual'`);
        await queryRunner.query(`ALTER TABLE "transacciones" RENAME COLUMN "personaId" TO "usuarioId"`);
        await queryRunner.query(`ALTER TABLE "transacciones" ADD CONSTRAINT "FK_5177666e7d85390208261d069ba" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
