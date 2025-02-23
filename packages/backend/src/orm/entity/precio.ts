import { Column, Entity, JoinColumn, ManyToOne, Unique } from "typeorm";
import { Base } from "./base";
import { Producto } from "./producto";
import { IPrecioProducto } from "shared/interfaces";
import { TipoDescuento } from "shared/enums";
import { decimalTransformer } from "shared/constants";
import { Pais } from "./pais";

export interface ORMPrecio extends IPrecioProducto {
  producto: Producto;
  pais: Pais;
}

@Entity("producto_precios")
@Unique("UQ_precio_producto_pais", ["producto", "pais"])
export class Precio extends Base implements ORMPrecio {
  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: decimalTransformer,
  })
  precioLista: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: decimalTransformer,
  })
  precioOferta: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: decimalTransformer,
  })
  precioExw: number;

  @Column({ default: false })
  enOferta: boolean;

  @Column({
    type: "timestamp",
    nullable: true,
    transformer: {
      to: (value: string | null) => (value ? new Date(value) : null),
      from: (value: Date | null) => (value ? value.toISOString() : null),
    },
  })
  inicioOferta: string | null;

  @Column({
    type: "timestamp",
    nullable: true,
    transformer: {
      to: (value: string | null) => (value ? new Date(value) : null),
      from: (value: Date | null) => (value ? value.toISOString() : null),
    },
  })
  finOferta: string | null;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: decimalTransformer,
  })
  descuento: number;

  @Column({
    type: "enum",
    enum: TipoDescuento,
    default: TipoDescuento.porcentual,
  })
  tipoDescuento: TipoDescuento;

  @ManyToOne(() => Producto, (producto) => producto.precios)
  @JoinColumn()
  producto: Producto;

  @ManyToOne(() => Pais, (pais) => pais)
  @JoinColumn()
  pais: Pais;
}
