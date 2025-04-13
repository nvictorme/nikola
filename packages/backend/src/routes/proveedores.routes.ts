import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import { verificarPrivilegio } from "../helpers/privilegios.helpers";
import { Acciones } from "shared/enums";
import { Proveedor } from "../orm/entity/proveedor";
import { IProveedor } from "shared/interfaces";

const ProveedoresRouter: Router = Router();

// GET - Listar todos los proveedores
ProveedoresRouter.get(
  "/",
  verificarPrivilegio({
    entidad: Proveedor.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { page = "1", limit = "10", term } = req.query;

      const queryBuilder = AppDataSource.getRepository(Proveedor)
        .createQueryBuilder("proveedor")
        .orderBy("proveedor.marca", "ASC")
        .take(parseInt(limit as string))
        .skip((parseInt(page as string) - 1) * parseInt(limit as string));

      if (term) {
        queryBuilder
          .where("proveedor.nombre ILIKE :term", { term: `%${term}%` })
          .orWhere("proveedor.marca ILIKE :term", { term: `%${term}%` })
          .orWhere("proveedor.email ILIKE :term", { term: `%${term}%` })
          .orWhere("proveedor.telefono ILIKE :term", { term: `%${term}%` });
      }

      const [proveedores, total] = await queryBuilder.getManyAndCount();

      res.status(200).json({
        proveedores,
        total,
        page: parseInt(page as string),
        pageCount: Math.ceil(total / parseInt(limit as string) || 1),
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// Get - Todos los proveedores
ProveedoresRouter.get(
  "/todos",
  verificarPrivilegio({
    entidad: Proveedor.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const proveedores = await AppDataSource.getRepository(Proveedor).find({
        order: {
          marca: "ASC",
        },
      });
      return res.status(200).json({ proveedores });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// Get - proveedor por id
ProveedoresRouter.get(
  "/:id",
  verificarPrivilegio({
    entidad: Proveedor.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const proveedor = await AppDataSource.getRepository(Proveedor).findOne({
        where: { id },
      });
      if (!proveedor)
        return res.status(404).json({ message: `Proveedor no existe.` });
      return res.status(200).json(proveedor);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// Crear Proveedor
ProveedoresRouter.post(
  "/",
  verificarPrivilegio({
    entidad: Proveedor.name,
    accion: Acciones.crear,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const proveedor = req.body.proveedor as IProveedor;
      const newProveedor = new Proveedor();
      newProveedor.nombre = proveedor.nombre;
      newProveedor.marca = proveedor.marca;
      newProveedor.direccion = proveedor.direccion;
      newProveedor.telefono = proveedor.telefono;
      newProveedor.email = proveedor.email;
      newProveedor.notas = proveedor.notas;
      const savedProveedor = await AppDataSource.getRepository(Proveedor).save(
        newProveedor
      );
      return res.status(201).json(savedProveedor);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// Actualizar Proveedor
ProveedoresRouter.put(
  "/:id",
  verificarPrivilegio({
    entidad: Proveedor.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const proveedor = req.body.proveedor as Proveedor;
      if (id !== proveedor.id) {
        throw new Error("Proveedor no concuerda.");
      }
      const updatedProveedor = await AppDataSource.getRepository(
        Proveedor
      ).save(proveedor);
      return res.status(200).json(updatedProveedor);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// Eliminar Proveedor
ProveedoresRouter.delete(
  "/:id",
  verificarPrivilegio({
    entidad: Proveedor.name,
    accion: Acciones.eliminar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const result = await AppDataSource.getRepository(Proveedor).delete(id);
      if (result.affected === 0) {
        return res.status(404).json({ message: "Proveedor no existe." });
      }
      return res.status(204).send();
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

export { ProveedoresRouter };
