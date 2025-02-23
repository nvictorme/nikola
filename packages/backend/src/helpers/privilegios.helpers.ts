import { Rol } from "../orm/entity/rol";
import { AppDataSource } from "../orm/data-source";
import { Usuario } from "../orm/entity/usuario";
import { Privilegio } from "../orm/entity/privilegio";
import { IPrivilegioEsperado } from "shared/interfaces";
import { Request, Response, NextFunction } from "express";
import { RolesBase } from "shared/enums";
import { entidades } from "shared/constants";

export const asignarPrivilegiosPorDefecto = async (rol: Rol): Promise<void> => {
  for (const entity of entidades) {
    const p: Privilegio = new Privilegio();
    p.rol = rol;
    p.entidad = entity;

    // set default privileges
    p.leer = true;
    p.crear = false;
    p.actualizar = false;
    p.eliminar = false;
    p.admin = false;

    switch (rol.nombre) {
      case RolesBase.gerente: {
        p.admin = true;
        p.crear = true;
        p.actualizar = true;
        p.eliminar = true;
        break;
      }
      case RolesBase.logistica: {
        p.crear = true;
        p.actualizar = true;
        break;
      }
      default: {
        break;
      }
    }
    await AppDataSource.getRepository(Privilegio).save(p);
  }
};

export const usuarioTienePrivilegio = (
  usuario: Usuario,
  expectativa: IPrivilegioEsperado
): boolean => {
  let hasPrivilege = false;
  if (!usuario.rol) return hasPrivilege;

  hasPrivilege = usuario.rol.privilegios.some(
    (privilege: Privilegio) =>
      privilege.entidad === expectativa.entidad &&
      privilege[expectativa.accion] === expectativa.valor
  );

  return hasPrivilege;
};

export const usuarioAutorizado = async (
  usuario: Usuario,
  expectativa: IPrivilegioEsperado
): Promise<boolean> => {
  // verificar si el usuario es super o tiene privilegios
  const _usuario = await AppDataSource.getRepository(Usuario).findOne({
    where: { id: usuario.id },
    relations: ["rol", "rol.privilegios"],
  });
  if (!_usuario) return false;
  if (_usuario.super) return true;
  const hasPrivilege = usuarioTienePrivilegio(usuario, expectativa);
  return hasPrivilege;
};

export const verificarPrivilegio =
  (privilegio: IPrivilegioEsperado) =>
  async (req: Request, res: Response, next: NextFunction) => {
    const usuario = req.user as Usuario;
    const isAuthorized = await usuarioAutorizado(usuario, privilegio);
    if (!isAuthorized) {
      return res.status(403).json({ message: "No tiene privilegios" });
    }
    next();
  };

export const crearRol = async (rol: RolesBase | string): Promise<void> => {
  const _rol = new Rol();
  _rol.nombre = rol;
  _rol.descripcion = rol;
  const nuevoRol = await AppDataSource.getRepository(Rol).save(_rol);
  await asignarPrivilegiosPorDefecto(nuevoRol);
};
