import { Router, Request, Response } from "express";
import { AppDataSource } from "../../orm/data-source";
import { Producto } from "../../orm/entity/producto";
import { ApiAuthMiddleware } from "./api.helpers";
import { Sucursal } from "../../orm/entity/sucursal";

const V1ApiRouter = Router();

// GET /api/v1/productos - Get all products for a company
V1ApiRouter.get(
  "/productos",
  ApiAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const productos = await AppDataSource.createQueryBuilder(
        Producto,
        "producto"
      )
        .where("activo = :activo", { activo: true })
        .getMany();
      res.status(200).json({ productos });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/v1/sucursales - Get all branches for a company
V1ApiRouter.get(
  "/sucursales",
  ApiAuthMiddleware,
  async (req: Request, res: Response) => {
    try {
      const sucursales = await AppDataSource.createQueryBuilder(
        Sucursal,
        "sucursal"
      )
        .where("activo = :activo", { activo: true })
        .getMany();
      res.status(200).json({ sucursales });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

export { V1ApiRouter };
