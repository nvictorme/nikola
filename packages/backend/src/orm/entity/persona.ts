import { Entity, Column, OneToMany } from "typeorm";
import { Base } from "./base";
import { Direccion } from "./direccion";
import { IPersona } from "shared/interfaces";
import { decimalTransformer } from "shared/constants";
import { TipoCliente } from "shared/enums";

export interface ORMPersona extends IPersona {
  direcciones: Direccion[];
}

@Entity("personas")
export class Persona extends Base implements ORMPersona {
  @Column({
    length: 100,
    unique: false,
    nullable: true,
  })
  email: string;

  @Column({
    nullable: true,
    unique: true,
    length: 30,
  })
  seudonimo: string;

  @Column({
    nullable: true,
    length: 100,
  })
  empresa: string;

  @Column({
    type: "boolean",
    default: false,
  })
  creditoHabilitado: boolean;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  creditoLimite: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
    transformer: decimalTransformer,
  })
  balance: number;

  @Column({
    nullable: true,
    length: 30,
  })
  nombre: string;

  @Column({
    nullable: true,
    length: 30,
  })
  apellido: string;

  @Column({
    nullable: true,
    length: 30,
    unique: true,
  })
  nif: string;

  @Column({
    type: "enum",
    enum: TipoCliente,
    default: TipoCliente.general,
  })
  tipoCliente: TipoCliente;

  @Column({
    nullable: true,
    length: 500,
  })
  notas: string;

  @Column({
    nullable: true,
    length: 50,
  })
  avatar: string;

  @Column({
    nullable: true,
    length: 20,
  })
  telefono: string;

  @OneToMany(() => Direccion, (direccion) => direccion.persona)
  direcciones: Direccion[];
}
