import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Base } from "./base";
import { IItemOrden } from "shared/interfaces";
import { Producto } from "./producto";
import { Orden } from "./orden";
import { Almacen } from "./almacen";
import { decimalTransformer } from "shared/constants";

export interface ORMItemOrden extends IItemOrden {
  producto: Producto;
  orden: Orden;
  almacen: Almacen;
}

@Entity("ordenes_items")
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
  total: number;

  @Column({ type: "text", nullable: true })
  notas: string;

  @Column({ nullable: false, default: "Sin Garantía" })
  garantia: string;

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
