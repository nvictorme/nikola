import { Rol } from "./rol";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Base } from "./base";
import { IInvitacion } from "shared/interfaces";
import { EstatusInvitacion } from "shared/enums";

export interface ORMInvitacion extends IInvitacion {
  rol: Rol;
}

@Entity("invitaciones")
export class Invitacion extends Base implements ORMInvitacion {
  @Column("varchar", { length: 255, unique: true })
  email: string;

  @Column("varchar", { length: 50 })
  nombre: string;

  @Column("varchar", { length: 50 })
  apellido: string;

  @Column("varchar", { length: 20 })
  estatus: EstatusInvitacion;

  @ManyToOne(() => Rol)
  @JoinColumn()
  rol: Rol;

  @Column("varchar", { length: 50 })
  token: string;
}
