import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { Base } from "./base";
import { ISubcategoria } from "shared";
import { Categoria } from "./categoria";

export interface ORMSubcategoria extends ISubcategoria {
  categoria: Categoria;
}

@Entity("subcategorias")
export class Subcategoria extends Base implements ORMSubcategoria {
  @Column({ length: 100, nullable: false})
  nombre: string;

  @Column({ length: 100, nullable: false })
  name: string;

  @Column({ type: "int", nullable: false, default: 0 })
  orden: number;

  @ManyToOne(() => Categoria, (categoria) => categoria.subcategorias)
  @JoinColumn()
  categoria: Categoria;
}
