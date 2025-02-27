import { Entity } from "typeorm";
import { IProveedor } from "shared/interfaces";
import { Base } from "./base";
import { Column } from "typeorm";

@Entity("proveedores")
export class Proveedor extends Base implements IProveedor {
  @Column({ length: 100, nullable: false, unique: true })
  nombre: string;

  @Column({ length: 100, nullable: true })
  marca: string;

  @Column({ length: 100, nullable: true })
  direccion: string;

  @Column({ length: 100, nullable: true })
  telefono: string;

  @Column({ length: 100, nullable: true })
  email: string;

  @Column({ length: 100, nullable: true })
  notas: string;
}
