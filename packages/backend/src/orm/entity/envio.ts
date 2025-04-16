import { Entity, Column } from "typeorm";
import { Base } from "./base";
import { IEnvio } from "shared/interfaces";
import { Transportistas } from "shared/enums";

@Entity("envios")
export class Envio extends Base implements IEnvio {
  @Column({ type: "text", nullable: true })
  notas: string;

  @Column({
    type: "enum",
    enum: Transportistas,
    default: Transportistas.OTRO,
    nullable: false,
  })
  transportista: Transportistas;

  @Column({ type: "varchar", nullable: false })
  tracking: string;
}
