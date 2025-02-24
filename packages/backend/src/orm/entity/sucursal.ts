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
import { Almacen } from "./almacen";
import { ISucursal } from "shared/interfaces";
import { decimalTransformer } from "shared/constants";

export interface ORMSucursal extends ISucursal {
  direccion: Direccion;
  almacenes: Almacen[];
}

@Entity("sucursales")
export class Sucursal extends Base implements ORMSucursal {
  @Column({
    length: 100,
    unique: true,
    nullable: false,
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
