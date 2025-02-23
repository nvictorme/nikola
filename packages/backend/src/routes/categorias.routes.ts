import { Router, Request, Response } from "express";
import { Categoria } from "../orm/entity/categoria";
import { Subcategoria } from "../orm/entity/subcategoria";
import { AppDataSource } from "../orm/data-source";
import { Producto } from "../orm/entity/producto";

const CategoriasRouter: Router = Router();

CategoriasRouter.get("/", async (req: Request, res: Response) => {
  try {
    const categorias = await AppDataSource.getRepository(Categoria).find({
      relations: ["subcategorias"],
      order: {
        orden: "ASC",
        subcategorias: { orden: "ASC" },
      },
      cache: {
        id: "categorias",
        milliseconds: 30 * 24 * 60 * 60 * 1000,
      },
    });
    return res.status(200).json({ categorias });
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener las categorías" });
  }
});

CategoriasRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const categoria = await AppDataSource.getRepository(Categoria).findOne({
      where: { id: req.params.id },
      relations: ["subcategorias"],
      order: {
        orden: "ASC",
        subcategorias: { orden: "ASC" },
      },
      cache: {
        id: `categoria-${req.params.id}`,
        milliseconds: 30 * 24 * 60 * 60 * 1000,
      },
    });
    return res.status(200).json({ categoria });
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener la categoría" });
  }
});

CategoriasRouter.post("/", async (req: Request, res: Response) => {
  try {
    const categoria = await AppDataSource.getRepository(Categoria).save(
      req.body
    );
    await AppDataSource.queryResultCache?.remove(["categorias"]);
    return res.status(200).json({ categoria });
  } catch (error) {
    return res.status(500).json({ error: "Error al crear la categoría" });
  }
});

CategoriasRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const categoria = await AppDataSource.getRepository(Categoria).update(
      req.params.id,
      req.body
    );
    await AppDataSource.queryResultCache?.remove(["categorias"]);
    return res.status(200).json({ categoria });
  } catch (error) {
    return res.status(500).json({ error: "Error al actualizar la categoría" });
  }
});

CategoriasRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const categoria = await AppDataSource.getRepository(Categoria).delete(
      req.params.id
    );
    await AppDataSource.queryResultCache?.remove(["categorias"]);
    return res.status(200).json({ categoria });
  } catch (error) {
    return res.status(500).json({ error: "Error al eliminar la categoría" });
  }
});

CategoriasRouter.get(
  "/:id/subcategorias",
  async (req: Request, res: Response) => {
    try {
      const subcategorias = await AppDataSource.getRepository(
        Subcategoria
      ).find({
        where: { categoria: { id: req.params.id } },
        order: {
          orden: "ASC",
        },
        cache: {
          id: `subcategorias-${req.params.id}`,
          milliseconds: 30 * 24 * 60 * 60 * 1000,
        },
      });
      return res.status(200).json({ subcategorias });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Error al obtener las subcategorías" });
    }
  }
);

CategoriasRouter.post(
  "/:id/subcategorias",
  async (req: Request, res: Response) => {
    try {
      const subcategoria = await AppDataSource.getRepository(Subcategoria).save(
        req.body
      );
      await AppDataSource.queryResultCache?.remove([
        `subcategorias-${req.params.id}`,
      ]);
      return res.status(200).json({ subcategoria });
    } catch (error) {
      return res.status(500).json({ error: "Error al crear la subcategoría" });
    }
  }
);

CategoriasRouter.put(
  "/:id/subcategorias/:subcategoriaId",
  async (req: Request, res: Response) => {
    try {
      const subcategoriaRepository = AppDataSource.getRepository(Subcategoria);

      // Perform the update
      await subcategoriaRepository.update(req.params.subcategoriaId, req.body);

      // Fetch the updated subcategoria
      const subcategoria = await subcategoriaRepository.findOne({
        where: { id: req.params.subcategoriaId },
      });

      await AppDataSource.queryResultCache?.remove([
        `subcategorias-${req.params.id}`,
      ]);

      return res.status(200).json({ subcategoria });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Error al actualizar la subcategoría" });
    }
  }
);

CategoriasRouter.delete(
  "/:id/subcategorias/:subcategoriaId",
  async (req: Request, res: Response) => {
    try {
      const subcategoria = await AppDataSource.getRepository(
        Subcategoria
      ).delete(req.params.subcategoriaId);
      await AppDataSource.queryResultCache?.remove([
        `subcategorias-${req.params.id}`,
      ]);
      return res.status(200).json({ subcategoria });
    } catch (error) {
      return res
        .status(500)
        .json({ error: "Error al eliminar la subcategoría" });
    }
  }
);

CategoriasRouter.get("/:id/productos", async (req: Request, res: Response) => {
  try {
    const productos = await AppDataSource.getRepository(Producto).find({
      where: { categoria: { id: req.params.id } },
      cache: {
        id: `productos-${req.params.id}`,
        milliseconds: 24 * 60 * 60 * 1000,
      },
    });
    return res.status(200).json({ productos });
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener los productos" });
  }
});

export { CategoriasRouter };
