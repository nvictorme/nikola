import { Entity, Column, OneToMany } from "typeorm";
import { Base } from "./base";
import { ICategoria } from "shared";
import { Subcategoria } from "./subcategoria";

export interface ORMCategoria extends ICategoria {
  subcategorias: Subcategoria[];
}

@Entity("categorias")
export class Categoria extends Base implements ORMCategoria {
  @Column({ length: 100, nullable: false, unique: true })
  nombre: string;

  @Column({ length: 100, nullable: false, unique: true })
  name: string;

  @Column({ type: "int", nullable: false, default: 0 })
  orden: number;

  @OneToMany(() => Subcategoria, (subcategoria) => subcategoria.categoria)
  subcategorias: Subcategoria[];
}
