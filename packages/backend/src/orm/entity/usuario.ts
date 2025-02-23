import {
  Entity,
  ManyToMany,
  JoinTable,
  BeforeInsert,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Rol } from "./rol";
import { Sucursal } from "./sucursal";
import { IUsuario } from "shared/interfaces";
import { Persona } from "./persona";
import { encryptPassword } from "../../providers/encryption";
import { Archivo } from "./archivo";
import { decimalTransformer } from "shared/constants";

export interface ORMUsuario extends IUsuario {
  rol: Rol;
  sucursales: Sucursal[];
}

@Entity("usuarios")
export class Usuario extends Persona implements ORMUsuario {
  @BeforeInsert()
  hashPassword() {
    this.password = encryptPassword(this.password);
  }
  @Column()
  password: string;

  @Column({ default: false })
  super: boolean;

  @Column({ default: false })
  exw: boolean;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  balance: number;

  @ManyToOne(() => Rol, (rol) => rol.usuarios)
  @JoinColumn()
  rol: Rol;

  @ManyToMany(() => Sucursal, {
    cascade: true,
    eager: true,
  })
  @JoinTable({
    name: "usuarios_sucursales",
  })
  sucursales: Sucursal[];

  @ManyToMany(() => Archivo, {
    eager: true,
    cascade: true,
  })
  @JoinTable({
    name: "usuarios_archivos",
  })
  archivos: Archivo[];
}
