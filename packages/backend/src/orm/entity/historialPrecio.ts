import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Base } from "./base";
import { IHistorialPrecio } from "shared/interfaces";
import { Producto } from "./producto";
import { decimalTransformer } from "shared/constants";

@Entity("historial_precios")
export class HistorialPrecio extends Base implements IHistorialPrecio {
  @Column({ nullable: true })
  productoId: string;

  @ManyToOne(() => Producto, { eager: true })
  @JoinColumn({ name: "productoId" })
  producto: Producto;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  costo: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  precio: number;
}
