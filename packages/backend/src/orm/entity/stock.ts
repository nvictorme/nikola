import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { Base } from "./base";
import { Producto } from "./producto";
import { IStockProducto } from "shared/interfaces";
import { Almacen } from "./almacen";

export interface ORMStock extends IStockProducto {
  producto: Producto;
  almacen: Almacen;
}

@Entity("producto_stock")
@Unique("UQ_stock_producto_almacen", ["producto", "almacen"])
export class Stock extends Base implements ORMStock {
  @Column({ type: "int", default: 0 })
  actual: number;

  @Column({ type: "int", default: 0 })
  reservado: number;

  @Column({ type: "int", default: 0 })
  transito: number;

  @Column({ type: "int", default: 0 })
  rma: number;

  @ManyToOne(() => Producto, (producto) => producto.stock)
  @JoinColumn()
  producto: Producto;

  @ManyToOne(() => Almacen)
  @JoinColumn()
  almacen: Almacen;
}
