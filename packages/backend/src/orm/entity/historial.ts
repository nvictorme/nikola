import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { Base } from "./base";
import { IOrdenHistorial } from "shared/interfaces";
import { EstatusOrden } from "shared/enums";
import { Usuario } from "./usuario";
import { Envio } from "./envio";
import { Orden } from "./orden";

export interface ORMOrdenHistorial extends IOrdenHistorial {
  orden: Orden;
  usuario: Usuario;
  envio: Envio;
}

@Entity("orden_historial")
export class HistorialOrden extends Base implements ORMOrdenHistorial {
  @Column({
    type: "enum",
    enum: EstatusOrden,
    nullable: false,
  })
  estatus: EstatusOrden;

  @Column({ type: "text", nullable: true })
  notas: string;

  @ManyToOne(() => Usuario)
  @JoinColumn()
  usuario: Usuario;

  @ManyToOne(() => Envio, { nullable: true })
  @JoinColumn()
  envio: Envio;

  @ManyToOne(() => Orden)
  @JoinColumn()
  orden: Orden;
}
