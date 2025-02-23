import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import { Base } from "./base";
import { IDireccion } from "shared/interfaces";
import { Persona } from "./persona";
import { Pais } from "./pais";

export interface ORMAddress extends IDireccion {
  persona: Persona;
  pais: Pais;
}

@Entity("direcciones")
export class Direccion extends Base implements ORMAddress {
  @Column({
    nullable: true,
    length: 50,
  })
  alias: string;

  @Column({
    nullable: true,
  })
  destinatario: string;

  @ManyToOne(() => Pais, (pais) => pais)
  @JoinColumn()
  pais: Pais;

  @Column({
    nullable: true,
    length: 50,
  })
  region: string;

  @Column({
    nullable: true,
    length: 50,
  })
  ciudad: string;

  @Column({
    nullable: true,
    length: 10,
  })
  codigoPostal: string;

  @Column({
    nullable: true,
    length: 50,
  })
  calle: string;

  @Column({
    nullable: true,
    length: 50,
  })
  unidad: string;

  @Column({ nullable: true, type: "real" })
  latitude: number;

  @Column({ nullable: true, type: "real" })
  longitude: number;

  @ManyToOne(() => Persona, (person) => person.direcciones)
  @JoinColumn()
  persona: Persona;
}
