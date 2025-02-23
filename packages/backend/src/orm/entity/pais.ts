import { Column, Entity } from "typeorm";
import { Base } from "./base";
import { IPais } from "shared/interfaces";

@Entity("paises")
export class Pais extends Base implements IPais {
  @Column({ type: "varchar", length: 100, nullable: false, unique: true })
  nombre: string;

  @Column({ type: "varchar", length: 100, nullable: false, unique: true })
  name: string;

  @Column({ type: "varchar", length: 2, nullable: false, unique: true })
  iso2: string;

  @Column({ type: "varchar", length: 3, nullable: false, unique: true })
  iso3: string;

  @Column({ type: "varchar", length: 10, nullable: true })
  phoneCode: string;
}
