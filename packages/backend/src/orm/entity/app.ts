import { Column, Entity } from "typeorm";
import { Base } from "./base";
import { IApp } from "shared/interfaces";

@Entity("apps")
export class App extends Base implements IApp {
  @Column({
    nullable: false,
    length: 50,
  })
  name: string;

  @Column({
    nullable: false,
    length: 120,
  })
  description: string;

  @Column({
    generated: "uuid",
  })
  clientId: string;

  @Column({
    generated: "uuid",
  })
  clientSecret: string;

  @Column({
    type: "text",
  })
  redirectUri: string;
}
