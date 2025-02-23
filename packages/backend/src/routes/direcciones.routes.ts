import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import { Direccion } from "../orm/entity/direccion";
import { Persona } from "../orm/entity/persona";

const DireccionesRouter: Router = Router();

// get all addresses for current entity
DireccionesRouter.get(
  "/:entity/:entityId",
  async (req: Request, res: Response) => {
    try {
      // entity can be person or company
      const { entity, entityId } = req.params as {
        entity: string;
        entityId: string;
      };
      if (!entity || !entityId) throw new Error("Parámetros inválidos");
      // get all addresses for current entity
      const [direcciones, count] = await AppDataSource.getRepository(
        Direccion
      ).findAndCount({
        where: {
          [entity]: {
            id: entityId,
          },
        },
        relations: ["persona"],
        cache: {
          id: `direcciones_${entityId}`, // Cache key for addresses list for this entity
          milliseconds: 7 * 24 * 60 * 60 * 1000, // Cache for 7 days
        },
      });
      res.status(200).json({
        count,
        direcciones,
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// create new address for current entity
DireccionesRouter.post(
  "/:entity/:entityId",
  async (req: Request, res: Response) => {
    try {
      // entity can be user or company
      const { entity, entityId } = req.params as {
        entity: string;
        entityId: string;
      };
      if (!entity || !entityId) throw new Error("Parámetros inválidos");
      const data = req.body as Direccion;
      const address = new Direccion();
      address.alias = data.alias;
      address.destinatario = data.destinatario;
      address.pais = data.pais;
      address.region = data.region;
      address.ciudad = data.ciudad;
      address.codigoPostal = data.codigoPostal;
      address.calle = data.calle;
      address.unidad = data.unidad;
      address.latitude = data.latitude;
      address.longitude = data.longitude;

      // establish relationship with entity
      switch (entity) {
        case "person":
          address.persona = { id: entityId } as Persona;
          break;
        default:
          throw new Error("Entidad inválida");
      }

      const newAddress = await AppDataSource.getRepository(Direccion).save(
        address
      );

      // Clear cache for companies list for this entity (if exists),
      await AppDataSource.queryResultCache?.remove([`direcciones_${entityId}`]);

      res.status(200).json(newAddress);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// update address for current entity
DireccionesRouter.put(
  "/:entity/:entityId",
  async (req: Request, res: Response) => {
    try {
      // entity can be user or company
      const { entity, entityId } = req.params as {
        entity: string;
        entityId: string;
      };
      if (!entity || !entityId) throw new Error("Parámetros inválidos");

      const data = req.body as Direccion;
      const repo = AppDataSource.getRepository(Direccion);
      await repo.update(data.id, {
        ...data,
        [entity]: { id: entityId } as any,
      });
      const updatedAddress = await repo.findOneBy({ id: data.id });
      // Clear cache for companies list for this user (if exists),
      // because we updated one of the addresses
      await AppDataSource.queryResultCache?.remove([`direcciones_${entityId}`]);
      res.status(200).json(updatedAddress);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

export { DireccionesRouter };
