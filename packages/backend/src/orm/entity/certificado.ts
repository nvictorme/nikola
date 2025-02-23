import { Entity, Column, ManyToOne, JoinColumn, OneToOne } from "typeorm";
import { Base } from "./base";
import { ItemOrden } from "./itemOrden";
import { Orden } from "./orden";
import { ICertificado } from "shared/interfaces";

export interface ORMCertificado extends ICertificado {
  item: ItemOrden;
  orden: Orden;
}

@Entity("certificados")
export class Certificado extends Base implements ORMCertificado {
  @Column({
    type: "int",
    generated: "increment",
  })
  serial: number;

  @OneToOne(() => ItemOrden)
  @JoinColumn()
  item: ItemOrden;

  @ManyToOne(() => Orden)
  @JoinColumn()
  orden: Orden;
}
