import { Column, Entity, JoinColumn, ManyToMany, ManyToOne } from "typeorm";
import { Producto } from "./producto";
import { Base } from "./base";
import { IMotorProducto } from "shared/interfaces";

export interface ORMProductoMotor extends IMotorProducto {
  producto: Producto;
  motor: Producto;
}

@Entity("producto_motores")
export class ProductoMotor extends Base implements ORMProductoMotor {
  @Column({
    type: "int",
    nullable: false,
    default: 1,
  })
  cantidad: number;

  // Relación con el producto, el producto es el padre
  @ManyToOne(() => Producto, (producto) => producto.motores)
  @JoinColumn({ name: "productoId" })
  producto: Producto;

  // Relación con el motor, el motor es el hijo
  @ManyToOne(() => Producto)
  @JoinColumn({ name: "motorId" })
  motor: Producto;
}
