import { Router, Request, Response } from "express";
import { AppDataSource } from "../../orm/data-source";
import { Producto } from "../../orm/entity/producto";
const PublicRouter: Router = Router();

// GET /api/public/productos - Listar productos
PublicRouter.get("/productos", async (req: Request, res: Response) => {
  try {
    const productos = await AppDataSource.createQueryBuilder(
      Producto,
      "producto"
    )
      .cache(true, 3600000) // Cache for 1 hour (optional)
      .leftJoinAndSelect("producto.categoria", "categoria")
      .leftJoinAndSelect("producto.portada", "portada")
      .leftJoinAndSelect("producto.galeria", "galeria")
      .leftJoinAndSelect("producto.dimensiones", "dimensiones")
      .andWhere("producto.activo = :activo", { activo: true })
      .orderBy("producto.costo", "DESC")
      .getMany();
    const safeProductos = productos.map((producto) => {
      const {
        id,
        sku,
        nombre,
        modelo,
        descripcion,
        categoria,
        portada,
        galeria,
        dimensiones,
        slug,
      } = producto;
      return {
        id,
        sku,
        nombre,
        modelo,
        descripcion,
        categoria,
        portada,
        galeria,
        dimensiones,
        slug,
      };
    });
    res.status(200).json({
      success: true,
      count: safeProductos.length,
      data: safeProductos,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Error al obtener productos",
    });
  }
});

export { PublicRouter };
