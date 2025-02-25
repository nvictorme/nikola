import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  OneToOne,
  JoinTable,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Base } from "./base";
import { IProducto } from "shared/interfaces";
import { Dimension } from "./dimension";
import { Archivo } from "./archivo";
import { decimalTransformer } from "shared/constants";
import { Stock } from "./stock";
import { Categoria } from "./categoria";
import { Subcategoria } from "./subcategoria";

export interface ORMProducto extends IProducto {
  dimensiones: Dimension;
  embalaje: Dimension;
  portada: Archivo;
  galeria: Archivo[];
  stock: Stock[];
  categoria: Categoria;
  subcategoria: Subcategoria;
}

@Entity("productos")
export class Producto extends Base implements ORMProducto {
  @Column({
    length: 100,
  })
  nombre: string;

  @Column({ nullable: true })
  descripcion: string;

  @Column({
    type: "numeric",
    default: 0,
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  costo: number;

  @Column({
    type: "numeric",
    default: 0,
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  precio: number;

  @Column({
    type: "numeric",
    default: 0,
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  precioOferta: number;

  @Column({ nullable: false, default: false })
  enOferta: boolean;

  @Column({ nullable: true })
  inicioOferta: string;

  @Column({ nullable: true })
  finOferta: string;

  @Column({ length: 30, nullable: false, unique: true })
  sku: string;

  @Column({ length: 30, nullable: true, unique: true })
  upc: string;

  @Column({ length: 30, nullable: true, unique: true })
  ean: string;

  @Column({ length: 30, nullable: true, unique: true })
  isbn: string;

  @OneToOne(() => Dimension)
  @JoinColumn({ name: "dimensionesId" })
  dimensiones: Dimension;

  @OneToOne(() => Dimension)
  @JoinColumn({ name: "embalajeId" })
  embalaje: Dimension;

  @Column({ length: 100, nullable: false })
  modelo: string;

  @Column({ length: 100, nullable: false })
  slug: string;

  @Column({ nullable: false, default: "Sin Garantía" })
  garantia: string;

  @OneToOne(() => Archivo)
  @JoinColumn()
  portada: Archivo;

  @ManyToMany(() => Archivo)
  @JoinTable()
  galeria: Archivo[];

  @OneToMany(() => Stock, (stock) => stock.producto)
  stock: Stock[];

  @ManyToOne(() => Categoria, (categoria) => categoria)
  @JoinColumn()
  categoria: Categoria;

  @ManyToOne(() => Subcategoria, (subcategoria) => subcategoria)
  @JoinColumn()
  subcategoria: Subcategoria;
}
