import {
  Entity,
  Column,
  OneToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Unique,
  ManyToOne,
} from "typeorm";
import { Base } from "./base";
import { Direccion } from "./direccion";
import { Usuario } from "./usuario";
import { Almacen } from "./almacen";
import { ISucursal } from "shared/interfaces";
import { decimalTransformer } from "shared/constants";
import { Pais } from "./pais";

export interface ORMSucursal extends ISucursal {
  direccion: Direccion;
  almacenes: Almacen[];
  pais: Pais;
}

@Entity("sucursales")
@Unique("UQ_sucursal_nombre_pais", ["nombre", "pais"])
export class Sucursal extends Base implements ORMSucursal {
  @Column({
    length: 100,
  })
  nombre: string;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  impuesto: number;

  @Column({ default: false })
  impuestoIncluido: boolean;

  @Column({ length: 5, default: "$" })
  simboloMoneda: string;

  @Column({ length: 5, default: "USD" })
  codigoMoneda: string;

  @ManyToOne(() => Pais, (pais) => pais)
  @JoinColumn()
  pais: Pais;

  @OneToOne(() => Direccion, (address) => address)
  @JoinColumn()
  direccion: Direccion;

  @ManyToMany(() => Almacen, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: "sucursales_almacenes",
  })
  almacenes: Almacen[];
}
