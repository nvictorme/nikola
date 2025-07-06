import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Base } from "./base";
import { IMovimientoHistorial } from "shared/interfaces";
import { EstatusMovimiento } from "shared/enums";
import { Movimiento } from "./movimiento";
import { Usuario } from "./usuario";

export interface ORMMovimientoHistorial extends IMovimientoHistorial {
  movimiento: Movimiento;
  usuario: Usuario;
}

@Entity("movimientos_historial")
export class MovimientoHistorial
  extends Base
  implements ORMMovimientoHistorial
{
  @Column({
    type: "enum",
    enum: EstatusMovimiento,
    default: EstatusMovimiento.pendiente,
  })
  estatus: EstatusMovimiento;

  @Column({ type: "text", nullable: true })
  notas: string;

  @ManyToOne(() => Movimiento)
  @JoinColumn()
  movimiento: Movimiento;

  @ManyToOne(() => Usuario)
  @JoinColumn()
  usuario: Usuario;
}
