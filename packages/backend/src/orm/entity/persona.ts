import { Entity, Column, OneToMany } from "typeorm";
import { Base } from "./base";
import { Direccion } from "./direccion";
import { IPersona } from "shared/interfaces";

export interface ORMPersona extends IPersona {
  direcciones: Direccion[];
}

@Entity("personas")
export class Persona extends Base implements ORMPersona {
  @Column({
    length: 100,
    unique: true,
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
