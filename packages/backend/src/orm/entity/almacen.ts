import { Entity, Column, OneToOne, JoinColumn, Unique } from "typeorm";
import { Base } from "./base";
import { Direccion } from "./direccion";
import { IAlmacen } from "shared/interfaces";

export interface ORMAlmacen extends IAlmacen {
  direccion: Direccion;
}

@Entity("almacenes")
export class Almacen extends Base implements ORMAlmacen {
  @Column({
    length: 50,
    unique: true,
    nullable: false,
  })
  nombre: string;

  @OneToOne(() => Direccion, (direccion) => direccion)
  @JoinColumn()
  direccion: Direccion;
}
