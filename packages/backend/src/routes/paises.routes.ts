import { Router, Request, Response } from "express";
import { Pais } from "../orm/entity/pais";
import { AppDataSource } from "../orm/data-source";
import { Usuario } from "../orm/entity/usuario";
import { isSuperAdmin } from "shared/helpers";

const PaisesRouter: Router = Router();

PaisesRouter.get("/", async (req: Request, res: Response) => {
  try {
    const { page = "1", limit = "10" } = req.query;
    const [paises, total] = await AppDataSource.getRepository(
      Pais
    ).findAndCount({
      where: {
        activo: true,
      },
      order: {
        nombre: "ASC",
      },
      take: parseInt(limit as string),
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
    });
    return res.status(200).json({
      paises,
      total,
      page: parseInt(page as string),
      pageCount: Math.ceil(total / parseInt(limit as string) || 1),
    });
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener los países" });
  }
});

PaisesRouter.get("/todos", async (req: Request, res: Response) => {
  try {
    const user = req.user as Usuario;
    const isAdmin = isSuperAdmin(user);
    const paises = await AppDataSource.getRepository(Pais).find({
      where: {
        activo: true,
        ...(!isAdmin && { id: user.pais.id }),
      },
      order: {
        nombre: "ASC",
      },
      cache: {
        id: `paises-todos-${user.id}`,
        milliseconds: 30 * 24 * 60 * 60 * 1000,
      },
    });
    return res.status(200).json({ paises });
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener los países" });
  }
});

PaisesRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const pais = await AppDataSource.getRepository(Pais).findOneBy({
      id: req.params.id,
    });
    return res.status(200).json({ pais });
  } catch (error) {
    return res.status(500).json({ error: "Error al obtener el país" });
  }
});

PaisesRouter.post("/", async (req: Request, res: Response) => {
  try {
    const user = req.user as Usuario;
    const pais = await AppDataSource.getRepository(Pais).save(req.body);
    await AppDataSource.queryResultCache?.remove([`paises-todos-${user.id}`]);
    return res.status(200).json({ pais });
  } catch (error) {
    return res.status(500).json({ error: "Error al crear el país" });
  }
});

PaisesRouter.put("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as Usuario;
    const pais = await AppDataSource.getRepository(Pais).update(
      req.params.id,
      req.body
    );
    await AppDataSource.queryResultCache?.remove([`paises-todos-${user.id}`]);
    return res.status(200).json({ pais });
  } catch (error) {
    return res.status(500).json({ error: "Error al actualizar el país" });
  }
});

PaisesRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const user = req.user as Usuario;
    const paisRepo = AppDataSource.getRepository(Pais);
    const pais = await paisRepo.findOneBy({ id: req.params.id });
    if (!pais) {
      return res.status(404).json({ error: "País no encontrado" });
    }
    pais.activo = false;
    pais.fechaEliminado = new Date().toUTCString();
    await paisRepo.save(pais);
    await AppDataSource.queryResultCache?.remove([`paises-todos-${user.id}`]);
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: "Error al eliminar el país" });
  }
});

export { PaisesRouter };
