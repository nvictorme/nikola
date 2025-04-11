import { Column, Entity } from "typeorm";
import { Base } from "./base";
import { IDimensiones } from "shared/interfaces";
import { UnidadesLongitud, UnidadesPeso } from "shared/enums";
import { decimalTransformer } from "shared/constants";

@Entity("dimensiones")
export class Dimension extends Base implements IDimensiones {
  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: decimalTransformer,
  })
  largo: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: decimalTransformer,
  })
  ancho: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: decimalTransformer,
  })
  alto: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0.0,
    transformer: decimalTransformer,
  })
  peso: number;

  @Column({ type: "varchar", length: "5", default: UnidadesLongitud.cm })
  unidadLongitud: UnidadesLongitud;

  @Column({ type: "varchar", length: "5", default: UnidadesPeso.g })
  unidadPeso: UnidadesPeso;
}
