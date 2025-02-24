import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from "typeorm";
import { Base } from "./base";
import { IItemOrden } from "shared/interfaces";
import { Producto } from "./producto";
import { Orden } from "./orden";
import { Almacen } from "./almacen";
import { Archivo } from "./archivo";
import { decimalTransformer } from "shared/constants";

export interface ORMItemOrden extends IItemOrden {
  producto: Producto;
  orden: Orden;
  almacen: Almacen;
  archivos: Archivo[];
}

@Entity("orden_items")
export class ItemOrden extends Base implements ORMItemOrden {
  @Column({ type: "int", nullable: false, default: 1 })
  cantidad: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  precio: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  precioLista: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  total: number;

  @Column({ type: "text", nullable: true })
  notas: string;

  @Column({ nullable: false, default: "Sin Garantía" })
  garantia: string;

  @ManyToMany(() => Archivo, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: "orden_items_archivos",
  })
  archivos: Archivo[];

  @ManyToOne(() => Producto)
  @JoinColumn()
  producto: Producto;

  @ManyToOne(() => Almacen)
  @JoinColumn()
  almacen: Almacen;

  @ManyToOne(() => Orden, (orden) => orden.items)
  @JoinColumn()
  orden: Orden;
}
