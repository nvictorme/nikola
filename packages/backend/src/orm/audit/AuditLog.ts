import {
  Entity,
  ObjectIdColumn,
  ObjectId,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("audit_logs")
export class AuditLog {
  @ObjectIdColumn()
  id: ObjectId;

  @Column()
  action: string;

  @Column({ nullable: true })
  entity: string;

  @Column()
  entityId: string;

  @Column("json", { nullable: true })
  oldValue: any;

  @Column("json", { nullable: true })
  newValue: any;

  @Column("json", { nullable: true })
  user: any;

  @CreateDateColumn()
  timestamp: Date;
}
