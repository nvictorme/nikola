import { Column, Entity, ManyToMany, OneToMany } from "typeorm";
import { Base } from "./base";
import { Privilegio } from "./privilegio";
import { Usuario } from "./usuario";
import { IRol } from "shared/interfaces";
import { RolesBase } from "shared/enums";

export interface ORMRol extends IRol {
  privilegios: Privilegio[];
  usuarios: Usuario[];
}

@Entity("roles")
export class Rol extends Base implements ORMRol {
  @Column({ nullable: false, unique: true })
  nombre: RolesBase | string;

  @Column({ nullable: true })
  descripcion: string;

  @OneToMany(() => Privilegio, (privilegio) => privilegio.rol)
  privilegios: Privilegio[];

  @ManyToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios: Usuario[];
}
