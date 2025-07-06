import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { Base } from "./base";
import { IMovimiento } from "shared/interfaces";
import { Almacen } from "./almacen";
import { ItemMovimiento } from "./itemMovimiento";
import { MovimientoHistorial } from "./historialMovimiento";
import { Usuario } from "./usuario";
import { EstatusMovimiento } from "shared/enums";

export interface ORMMovimiento extends IMovimiento {
  origen: Almacen;
  destino: Almacen;
  items: ItemMovimiento[];
  historial: MovimientoHistorial[];
  usuario: Usuario;
}

@Entity("movimientos")
export class Movimiento extends Base implements ORMMovimiento {
  @Column({ type: "int", generated: "increment" })
  serial: number;

  @Column({
    type: "enum",
    enum: EstatusMovimiento,
    default: EstatusMovimiento.pendiente,
  })
  estatus: EstatusMovimiento;

  @Column({ type: "text", nullable: true })
  notas: string;

  @ManyToOne(() => Almacen)
  @JoinColumn()
  origen: Almacen;

  @ManyToOne(() => Almacen)
  @JoinColumn()
  destino: Almacen;

  @OneToMany(() => ItemMovimiento, (item) => item.movimiento)
  items: ItemMovimiento[];

  @ManyToOne(() => Usuario)
  @JoinColumn()
  usuario: Usuario;

  @OneToMany(() => MovimientoHistorial, (historial) => historial.movimiento)
  historial: MovimientoHistorial[];
}
