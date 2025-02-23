import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from "typeorm";
import { Base } from "./base";
import { ITransaccion } from "shared/interfaces";
import { Usuario } from "./usuario";
import { Archivo } from "./archivo";
import { EstatusPago, MetodoPago, TipoTransaccion } from "shared/enums";
import { decimalTransformer } from "shared/constants";

export interface ORMTransaccion extends ITransaccion {
  usuario: Usuario;
  archivos: Archivo[];
}

@Entity("transacciones")
export class Transaccion extends Base implements ORMTransaccion {
  @Column({
    type: "int",
    generated: "increment",
  })
  referencia: number;

  @Column({ type: "text" })
  descripcion: string;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  monto: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    transformer: decimalTransformer,
  })
  balance: number;

  @Column({
    type: "enum",
    enum: TipoTransaccion,
    nullable: false,
  })
  tipo: TipoTransaccion;

  @Column({
    type: "enum",
    enum: EstatusPago,
    nullable: true,
    default: null,
  })
  estatusPago: EstatusPago;

  @Column({
    type: "enum",
    enum: MetodoPago,
    nullable: true,
    default: null,
  })
  metodoPago: MetodoPago;

  @Column({ type: "varchar", nullable: true })
  qbInvoiceId: string;

  @Column({ type: "varchar", nullable: true })
  qbInvoiceDocNumber: string;

  // relacion con usuario
  @ManyToOne(() => Usuario)
  @JoinColumn({ name: "usuarioId", referencedColumnName: "id" })
  usuario: Usuario;

  // relacion con archivos
  @ManyToMany(() => Archivo)
  @JoinTable({
    name: "transaccion_archivos",
    joinColumn: { name: "transaccionId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "archivoId", referencedColumnName: "id" },
  })
  archivos: Archivo[];
}
