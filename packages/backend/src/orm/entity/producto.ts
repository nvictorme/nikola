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
import { Precio } from "./precio";
import { IProducto } from "shared/interfaces";
import { PeriodosGarantia } from "shared/enums";
import { Dimension } from "./dimension";
import { Archivo } from "./archivo";
import { decimalTransformer } from "shared/constants";
import { Stock } from "./stock";
import { TraduccionProducto } from "./traduccion";
import { ProductoMotor } from "./productoMotor";
import { Pais } from "./pais";
import { Categoria } from "./categoria";
import { Subcategoria } from "./subcategoria";

export interface ORMProducto extends IProducto {
  dimensiones: Dimension;
  embalaje: Dimension;
  portada: Archivo;
  galeria: Archivo[];
  precios: Precio[];
  stock: Stock[];
  traduccion: TraduccionProducto;
  motores: ProductoMotor[];
  paises: Pais[];
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
    precision: 10,
    scale: 2,
    nullable: true,
    transformer: decimalTransformer,
  })
  costo: number;

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

  @Column({ nullable: false, default: false })
  requiereMotor: boolean;

  // Relación con los motores
  @OneToMany(() => ProductoMotor, (motor) => motor.producto)
  motores: ProductoMotor[];

  @Column({ length: 100, nullable: false })
  modelo: string;

  @Column({ length: 100, nullable: false })
  slug: string;

  @Column({ nullable: false, default: PeriodosGarantia.sin_garantia })
  garantia: PeriodosGarantia;

  @OneToOne(() => Archivo)
  @JoinColumn()
  portada: Archivo;

  @ManyToMany(() => Archivo)
  @JoinTable()
  galeria: Archivo[];

  @OneToMany(() => Precio, (precio) => precio.producto)
  precios: Precio[];

  @OneToMany(() => Stock, (stock) => stock.producto)
  stock: Stock[];

  @ManyToOne(() => Categoria, (categoria) => categoria)
  @JoinColumn()
  categoria: Categoria;

  @ManyToOne(() => Subcategoria, (subcategoria) => subcategoria)
  @JoinColumn()
  subcategoria: Subcategoria;

  @OneToOne(() => TraduccionProducto, (traduccion) => traduccion.producto)
  traduccion: TraduccionProducto;

  @ManyToMany(() => Pais, (pais) => pais)
  @JoinTable()
  paises: Pais[];
}
