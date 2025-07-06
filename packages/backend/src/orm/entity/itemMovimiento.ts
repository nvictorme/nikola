import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Base } from "./base";
import { IItemMovimiento } from "shared/interfaces";
import { Producto } from "./producto";
import { Movimiento } from "./movimiento";

export interface ORMItemMovimiento extends IItemMovimiento {
  producto: Producto;
  movimiento: Movimiento;
}

@Entity("movimientos_items")
export class ItemMovimiento extends Base implements ORMItemMovimiento {
  @ManyToOne(() => Producto)
  @JoinColumn()
  producto: Producto;

  @Column({ type: "int" })
  cantidad: number;

  @Column({ type: "text" })
  notas: string;

  @ManyToOne(() => Movimiento)
  @JoinColumn()
  movimiento: Movimiento;
}
