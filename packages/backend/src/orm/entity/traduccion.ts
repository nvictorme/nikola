import { Base } from "./base";
import { ITraduccionProducto } from "shared/interfaces";
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Producto } from "./producto";

export interface ORMTraduccionProducto extends ITraduccionProducto {
  producto: Producto;
}

@Entity("producto_traducciones")
export class TraduccionProducto extends Base implements ORMTraduccionProducto {
  @Column({
    length: 100,
  })
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({
    length: 100,
  })
  modelo: string;

  @Column({
    length: 100,
  })
  slug: string;

  @OneToOne(() => Producto, (producto) => producto.traduccion)
  @JoinColumn()
  producto: Producto;
}
