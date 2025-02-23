import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import {
  asignarPrivilegiosPorDefecto,
  verificarPrivilegio,
} from "../helpers/privilegios.helpers";
import { Rol } from "../orm/entity/rol";
import { Acciones } from "shared/enums";
import { IRol } from "shared/interfaces";
import { Privilegio } from "../orm/entity/privilegio";

const RolesRouter: Router = Router();

// GET - Todos los roles
RolesRouter.get(
  "/",
  verificarPrivilegio({
    entidad: Rol.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      // ordenar por fecha de creación y luego por entidad
      const roles = await AppDataSource.getRepository(Rol).find({
        relations: ["privilegios"],
        order: {
          fechaCreado: "ASC",
          privilegios: { entidad: "ASC" },
        },
      });
      res.status(200).json({ roles });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// POST - Crear un rol
RolesRouter.post(
  "/",
  verificarPrivilegio({
    entidad: Rol.name,
    accion: Acciones.crear,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const rol = req.body.rol as IRol;
      const mRol = new Rol();
      mRol.nombre = rol.nombre;
      rol.descripcion && (mRol.descripcion = rol.descripcion);
      const nRol = await AppDataSource.getRepository(Rol).save(mRol);
      // asignar privilegios por defecto al nuevo rol
      await asignarPrivilegiosPorDefecto(nRol);
      const _rol = await AppDataSource.getRepository(Rol).find({
        where: { id: nRol.id },
        relations: ["privilegios"],
      });
      res.status(201).json(_rol);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT - Actualizar un rol
RolesRouter.put(
  "/:idRol",
  verificarPrivilegio({
    entidad: Rol.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const rol = req.body.rol as IRol;
      const mRol = await AppDataSource.getRepository(Rol).findOne({
        where: { id: req.params.idRol },
      });
      if (!mRol) {
        return res.status(404).json({ error: "Rol no encontrado" });
      }
      mRol.nombre = rol.nombre;
      rol.descripcion && (mRol.descripcion = rol.descripcion);
      await AppDataSource.getRepository(Rol).update(mRol.id, {
        nombre: mRol.nombre,
        descripcion: mRol.descripcion,
      });
      // actualizar privilegios
      if (rol.privilegios?.length) {
        // seleccionar privilegios del rol
        const privilegios = await AppDataSource.getRepository(Privilegio).find({
          where: { rol: { id: mRol.id } },
        });
        for (const privilegio of privilegios) {
          const _privilegio = rol.privilegios.find(
            (p) => p.id === privilegio.id
          );
          // si no existe el privilegio, eliminarlo
          if (!_privilegio) {
            await AppDataSource.getRepository(Privilegio).delete(privilegio.id);
          } else {
            // si existe, actualizarlo
            await AppDataSource.getRepository(Privilegio).update(
              privilegio.id,
              {
                admin: _privilegio.admin,
                crear: _privilegio.crear,
                leer: _privilegio.leer,
                actualizar: _privilegio.actualizar,
                eliminar: _privilegio.eliminar,
              }
            );
          }
        }
      }
      const _rol = await AppDataSource.getRepository(Rol).find({
        where: { id: mRol.id },
        relations: ["privilegios"],
      });
      res.status(200).json(_rol);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

export { RolesRouter };
