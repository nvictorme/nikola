import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import { Sucursal } from "../orm/entity/sucursal";
import { verificarPrivilegio } from "../helpers/privilegios.helpers";
import { Acciones } from "shared/enums";
import { Almacen } from "../orm/entity/almacen";
import { Usuario } from "../orm/entity/usuario";
import { In } from "typeorm";

const SucursalesRouter: Router = Router();

// listar todas las sucursales
SucursalesRouter.get(
  "/",
  verificarPrivilegio({
    entidad: Sucursal.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { page = "1", limit = "10" } = req.query;
      const user = req.user as Usuario;
      // Create where clause conditionally
      const whereClause: any = { activo: true };

      const [sucursales, total] = await AppDataSource.getRepository(
        Sucursal
      ).findAndCount({
        where: whereClause,
        relations: ["direccion", "almacenes"],
        take: parseInt(limit as string),
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        order: { nombre: "ASC" },
        cache: {
          id: `sucursales-${user.id}`, // Cache key of branches
          milliseconds: 7 * 24 * 60 * 60 * 1000, // Cache for 7 days
        },
      });
      res.status(200).json({
        sucursales,
        total,
        page: parseInt(page as string),
        pageCount: Math.ceil(total / (parseInt(limit as string) || 1)),
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// listar todas las sucursales
SucursalesRouter.get(
  "/todas",
  verificarPrivilegio({
    entidad: Sucursal.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const sucursales = await AppDataSource.getRepository(Sucursal).find({
        where: { activo: true },
        relations: ["direccion", "almacenes"],
        order: { nombre: "ASC" },
      });
      res.status(200).json({ sucursales });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// crear una nueva sucursal
SucursalesRouter.post(
  "/",
  verificarPrivilegio({
    entidad: Sucursal.name,
    accion: Acciones.crear,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const data = req.body.sucursal as Sucursal;
      const user = req.user as Usuario;

      await AppDataSource.manager.transaction(
        async (transactionalEntityManager) => {
          // Si hay dirección, guardarla primero
          let direccion;
          if (data.direccion) {
            direccion = await transactionalEntityManager.save(
              "Direccion",
              data.direccion
            );
          }

          // Get almacenes if provided
          let almacenes: Almacen[] = [];
          if (data.almacenes && data.almacenes.length > 0) {
            almacenes = await transactionalEntityManager.findBy(Almacen, {
              id: In(data.almacenes.map((a) => a.id)),
            });
          }

          // crear una nueva sucursal
          const sucursal = await transactionalEntityManager.save(Sucursal, {
            nombre: data.nombre,
            codigoMoneda: data.codigoMoneda || "USD",
            simboloMoneda: data.simboloMoneda || "$",
            direccion: direccion || undefined,
            almacenes,
          });

          // limpiar la cache de sucursales
          await AppDataSource.queryResultCache?.remove([
            `sucursales-${user.id}`,
          ]);

          // responder con la sucursal creada
          res.status(200).json(sucursal);
        }
      );
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// actualizar sucursal
SucursalesRouter.put(
  "/:id",
  verificarPrivilegio({
    entidad: Sucursal.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      const data = req.body.sucursal as Sucursal;

      await AppDataSource.manager.transaction(
        async (transactionalEntityManager) => {
          // First get the existing sucursal
          const existingSucursal = await transactionalEntityManager.findOne(
            Sucursal,
            {
              where: { id: req.params.id },
              relations: ["almacenes"],
            }
          );

          if (!existingSucursal) {
            return res.status(404).json({ error: "Sucursal not found" });
          }

          // Si hay dirección, actualizarla o crearla primero
          if (data.direccion) {
            if (data.direccion.id) {
              // Actualizar dirección existente
              await transactionalEntityManager.update(
                "Direccion",
                data.direccion.id,
                data.direccion
              );
            } else {
              // Crear nueva dirección
              const nuevaDireccion = await transactionalEntityManager.save(
                "Direccion",
                data.direccion
              );
              data.direccion = nuevaDireccion;
            }
          }

          // Get almacenes if provided
          let almacenes: Almacen[] = [];
          if (data.almacenes && data.almacenes.length > 0) {
            almacenes = await transactionalEntityManager.findBy(Almacen, {
              id: In(data.almacenes.map((a) => a.id)),
            });
          }

          // Update the sucursal
          existingSucursal.nombre = data.nombre;
          existingSucursal.codigoMoneda = data.codigoMoneda;
          existingSucursal.simboloMoneda = data.simboloMoneda;
          existingSucursal.direccion = data.direccion;
          existingSucursal.almacenes = almacenes;

          // Save the updated sucursal
          await transactionalEntityManager.save(existingSucursal);

          const updatedBranch = await transactionalEntityManager.findOne(
            Sucursal,
            {
              where: {
                id: req.params.id,
              },
              relations: ["direccion", "almacenes"],
            }
          );

          await AppDataSource.queryResultCache?.remove([
            `sucursales-${user.id}`,
          ]);
          res.status(200).json({ sucursal: updatedBranch });
        }
      );
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

export { SucursalesRouter };
