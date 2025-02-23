import {
  Entity,
  Column,
  OneToOne,
  JoinColumn,
  Unique,
  ManyToOne,
} from "typeorm";
import { Base } from "./base";
import { Direccion } from "./direccion";
import { IAlmacen } from "shared/interfaces";
import { Pais } from "./pais";

export interface ORMAlmacen extends IAlmacen {
  direccion: Direccion;
  pais: Pais;
}

@Entity("almacenes")
@Unique("UQ_almacen_nombre_pais", ["nombre", "pais"])
export class Almacen extends Base implements ORMAlmacen {
  @Column({
    length: 50,
  })
  nombre: string;

  @OneToOne(() => Direccion, (direccion) => direccion)
  @JoinColumn()
  direccion: Direccion;

  @ManyToOne(() => Pais, (pais) => pais)
  @JoinColumn()
  pais: Pais;
}
