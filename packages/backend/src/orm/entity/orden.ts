import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Sucursal } from "./sucursal";
import { Usuario } from "./usuario";
import { Persona } from "./persona";
import { Base } from "./base";
import {
  EstatusOrden,
  TipoCambio,
  TipoDescuento,
  TipoOrden,
} from "shared/enums";
import { IOrden } from "shared/interfaces";
import { ItemOrden } from "./itemOrden";
import { decimalTransformer } from "shared/constants";
import { Archivo } from "./archivo";
import { Envio } from "./envio";
import { HistorialOrden } from "./historial";
export interface ORMOrden extends IOrden {
  sucursal: Sucursal;
  vendedor: Usuario;
  cliente: Persona | null;
  items: ItemOrden[];
  archivos: Archivo[];
  envios: Envio[];
  historial: HistorialOrden[];
}

@Entity("ordenes")
export class Orden extends Base implements ORMOrden {
  @Column({
    type: "int",
    generated: "increment",
  })
  serial: number;

  @Column({
    type: "enum",
    enum: EstatusOrden,
    default: EstatusOrden.pendiente,
  })
  estatus: EstatusOrden;

  @Column({
    type: "enum",
    enum: TipoOrden,
    default: TipoOrden.venta,
  })
  tipo: TipoOrden;

  @Column({ type: "int", nullable: true, default: 1 })
  validez: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0,
    transformer: decimalTransformer,
  })
  credito: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
    default: 0,
    transformer: decimalTransformer,
  })
  descuento: number;

  @Column({
    type: "enum",
    enum: TipoDescuento,
    default: TipoDescuento.porcentual,
    nullable: true,
  })
  tipoDescuento: TipoDescuento;

  @Column({ nullable: false, default: false })
  impuestoIncluido: boolean;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: false,
    default: 0,
    transformer: decimalTransformer,
  })
  impuesto: number;

  @Column({
    type: "enum",
    enum: TipoCambio,
    default: TipoCambio.usd,
  })
  tipoCambio: TipoCambio;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: false,
    default: 1,
    transformer: decimalTransformer,
  })
  tasaCambio: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  subtotal: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  total: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: false,
    transformer: decimalTransformer,
  })
  totalLista: number;

  @Column({ type: "text", nullable: true })
  notas: string;

  @ManyToOne(() => Sucursal)
  @JoinColumn()
  sucursal: Sucursal;

  @ManyToOne(() => Usuario)
  @JoinColumn()
  vendedor: Usuario;

  @ManyToOne(() => Persona, { nullable: true })
  @JoinColumn()
  cliente: Persona | null;

  @OneToMany(() => ItemOrden, (item) => item.orden)
  items: ItemOrden[];

  @ManyToMany(() => Archivo, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: "ordenes_archivos",
  })
  archivos: Archivo[];

  @ManyToMany(() => Envio, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: "ordenes_envios",
  })
  envios: Envio[];

  @OneToMany(() => HistorialOrden, (historial) => historial.orden)
  historial: HistorialOrden[];
}
