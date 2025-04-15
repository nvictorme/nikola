import { Router, Request, Response } from "express";
import { MongoDataSource } from "../orm/audit/AuditDataSource";
import { AuditLog } from "../orm/audit/AuditLog";
import { verificarPrivilegio } from "../helpers/privilegios.helpers";
import { Acciones } from "shared/enums";

const AuditoriaRouter = Router();

// GET - Listar AuditLogs con paginación
AuditoriaRouter.get(
  "/",
  verificarPrivilegio({
    entidad: AuditLog.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const {
        page = "1",
        limit = "10",
        entity,
        action,
        entityId,
        userId,
      } = req.query;

      const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
      const take = parseInt(limit as string);

      // Build the filter for MongoDB query
      const filter: any = {};

      // Add optional filters
      if (entity) {
        filter.entity = entity;
      }

      if (action) {
        filter.action = action;
      }

      if (entityId) {
        filter.entityId = entityId;
      }

      if (userId) {
        filter["user.id"] = userId;
      }

      // Filter logs to only those from the last 90 days
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      filter.timestamp = { $gte: ninetyDaysAgo };

      // Get the MongoDB repository
      const auditRepo = MongoDataSource.getMongoRepository(AuditLog);

      // Execute the query with MongoDB native find
      const logs = await auditRepo.find({
        where: filter,
        skip,
        take,
        order: { timestamp: "DESC" },
      });

      // Get total count
      const total = await auditRepo.count(filter);

      res.status(200).json({
        logs,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pageCount: Math.ceil(total / (parseInt(limit as string) || 1)),
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

export { AuditoriaRouter };
