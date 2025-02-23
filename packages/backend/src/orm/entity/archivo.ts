import { Column, Entity } from "typeorm";
import { Base } from "./base";
import { IArchivo } from "shared/interfaces";
import { EstatusArchivo } from "shared/enums";

@Entity("archivos")
export class Archivo extends Base implements IArchivo {
  @Column({ length: 100 })
  nombre: string;

  @Column({ length: 50 })
  tipo: string;

  @Column({
    type: "enum",
    enum: EstatusArchivo,
    default: EstatusArchivo.cargado,
  })
  estatus: EstatusArchivo;

  @Column({ type: "text" })
  url: string;
}
