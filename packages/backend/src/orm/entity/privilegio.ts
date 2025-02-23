import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Base } from "./base";
import { Rol } from "./rol";
import { IPrivilegio } from "shared/interfaces";

export interface ORMPrivilegio extends IPrivilegio {
  rol: Rol;
}

@Entity("privilegios")
export class Privilegio extends Base implements ORMPrivilegio {
  @Column()
  entidad: string;

  @Column({ default: true })
  leer: boolean;

  @Column({ default: false })
  crear: boolean;

  @Column({ default: false })
  actualizar: boolean;

  @Column({ default: false })
  eliminar: boolean;

  @Column({ default: false })
  admin: boolean;

  @ManyToOne(() => Rol, (rol) => rol.privilegios)
  @JoinColumn()
  rol: Rol;
}
