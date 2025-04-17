import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  OneToOne,
  JoinTable,
  JoinColumn,
  ManyToOne,
  BeforeUpdate,
  AfterUpdate,
} from "typeorm";
import { Base } from "./base";
import { IProducto } from "shared/interfaces";
import { Dimension } from "./dimension";
import { Archivo } from "./archivo";
import { decimalTransformer } from "shared/constants";
import { Stock } from "./stock";
import { Categoria } from "./categoria";
import { Subcategoria } from "./subcategoria";
import slugify from "slugify";

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
  precioGeneral: number;

  @Column({
    type: "numeric",
    default: 0,
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  precioInstalador: number;

  @Column({
    type: "numeric",
    default: 0,
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  precioMayorista: number;

  @Column({
    type: "numeric",
    default: 0,
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

  @Column({ type: "int", default: 0, nullable: false })
  stockMinimo: number;

  @Column({ length: 30, nullable: false, unique: true })
  sku: string;

  @Column({ length: 30, nullable: true, unique: true })
  upc: string;

  @Column({ length: 30, nullable: true, unique: true })
  ean: string;

  @Column({ length: 30, nullable: true, unique: true })
  isbn: string;

  @OneToOne(() => Dimension)
  @JoinColumn({ name: "dimensionesId", referencedColumnName: "id" })
  dimensiones: Dimension;

  @OneToOne(() => Dimension)
  @JoinColumn({ name: "embalajeId", referencedColumnName: "id" })
  embalaje: Dimension;

  @Column({ length: 100, nullable: false })
  modelo: string;

  @BeforeUpdate()
  slugify() {
    this.slug = slugify(`${this.nombre} ${this.modelo} ${this.sku}`, {
      lower: true,
      strict: true,
      replacement: "-",
      trim: true,
    });
  }
  @Column({ length: 100, nullable: false, unique: true })
  slug: string;

  @Column({ nullable: false, default: "Sin Garantía" })
  garantia: string;

  @OneToOne(() => Archivo)
  @JoinColumn({ name: "portadaId", referencedColumnName: "id" })
  portada: Archivo;

  @ManyToMany(() => Archivo)
  @JoinTable({
    name: "productos_galeria",
    joinColumn: { name: "productoId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "archivoId", referencedColumnName: "id" },
  })
  galeria: Archivo[];

  @OneToMany(() => Stock, (stock) => stock.producto)
  stock: Stock[];

  @ManyToOne(() => Categoria, (categoria) => categoria)
  @JoinColumn({ name: "categoriaId", referencedColumnName: "id" })
  categoria: Categoria;

  @ManyToOne(() => Subcategoria, (subcategoria) => subcategoria)
  @JoinColumn({ name: "subcategoriaId", referencedColumnName: "id" })
  subcategoria: Subcategoria;
}
