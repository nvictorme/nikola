import { Router, Request, Response } from "express";
import { AppDataSource } from "../../orm/data-source";
import { Producto } from "../../orm/entity/producto";
import { Pais } from "../../orm/entity/pais";
import fs from "fs";
const PublicRouter: Router = Router();

// GET /api/public/paises - Listar paises
PublicRouter.get("/paises", async (req: Request, res: Response) => {
  try {
    const paises = await AppDataSource.getRepository(Pais)
      .createQueryBuilder("pais")
      .select(["pais.id", "pais.nombre", "pais.name", "pais.iso2"])
      .where("pais.activo = :activo", { activo: true })
      .andWhere("pais.nombre != :nombre", { nombre: "China" })
      .cache(true, 3600000) // Cache for 1 hour (optional)
      .orderBy("pais.nombre", "ASC")
      .getMany();

    res.status(200).json({
      success: true,
      count: paises.length,
      data: paises,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: "Error al obtener países",
    });
  }
});

// GET /api/public/productos - Listar productos por pais
PublicRouter.get("/productos", async (req: Request, res: Response) => {
  try {
    const { pais } = req.query;
    const productos = await AppDataSource.createQueryBuilder(
      Producto,
      "producto"
    )
      .cache(true, 3600000) // Cache for 1 hour (optional)
      .leftJoinAndSelect("producto.categoria", "categoria")
      .leftJoinAndSelect("producto.portada", "portada")
      .leftJoinAndSelect("producto.galeria", "galeria")
      .leftJoinAndSelect("producto.dimensiones", "dimensiones")
      .leftJoinAndSelect("producto.paises", "paises")
      .andWhere("producto.activo = :activo", { activo: true })
      .andWhere("paises.id = :pais", { pais })
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

// POST /api/public/webhook/bitrix
PublicRouter.post("/webhook/bitrix", async (req: Request, res: Response) => {
  try {
    const data = req.body || {};

    console.log(
      "EVENTO WEBHOOK",
      `Guardando webhook en bitrix.post.${data.ts}.json`
    );
    // fs.writeFileSync(
    //   __dirname + `/${data.ts}.post.json`,
    //   JSON.stringify(data, null, 2)
    // );
    res.status(200).json({ success: true });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, error: "Error al procesar webhook" });
  }
});

export { PublicRouter };
