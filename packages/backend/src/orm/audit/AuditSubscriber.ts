import {
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
  RemoveEvent,
} from "typeorm";
import { AuditLog } from "./AuditLog";
import { MongoDataSource } from "./AuditDataSource";
import { getUserFromContext } from "./AuditContext";

@EventSubscriber()
export class AuditSubscriber implements EntitySubscriberInterface {
  afterInsert(event: InsertEvent<any>) {
    this.logAudit(event, "INSERT");
  }

  afterUpdate(event: UpdateEvent<any>) {
    this.logAudit(event, "UPDATE");
  }

  afterRemove(event: RemoveEvent<any>) {
    this.logAudit(event, "REMOVE");
  }

  private async logAudit(
    event: InsertEvent<any> | UpdateEvent<any> | RemoveEvent<any>,
    action: string
  ) {
    const user = getUserFromContext();
    const auditLog = new AuditLog();
    auditLog.action = action;
    auditLog.entity = event.metadata.name;
    auditLog.entityId = event.entity?.id;
    auditLog.oldValue =
      action === "UPDATE" || action === "REMOVE" ? event.entity : null;
    auditLog.newValue =
      action === "INSERT" || action === "UPDATE" ? event.entity : null;

    // Add user information to the audit log
    auditLog.user = user
      ? {
          id: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
        }
      : null;

    await MongoDataSource.getMongoRepository(AuditLog).save(auditLog);
  }
}
