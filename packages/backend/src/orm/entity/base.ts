import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
} from "typeorm";
import { IBase } from "shared/interfaces";

export abstract class Base implements IBase {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "boolean", default: true })
  activo: boolean;

  @CreateDateColumn()
  fechaCreado: string;

  @UpdateDateColumn()
  fechaActualizado: string;

  @DeleteDateColumn()
  fechaEliminado: string;
}
