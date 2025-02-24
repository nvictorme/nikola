import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import { verificarPrivilegio } from "../helpers/privilegios.helpers";
import { Acciones } from "shared/enums";
import { Persona } from "../orm/entity/persona";
import { IPersona } from "shared/interfaces";
import { Usuario } from "../orm/entity/usuario";
import { ILike } from "typeorm";

const PersonasRouter: Router = Router();

// GET - Listar todas las personas
PersonasRouter.get(
  "/",
  verificarPrivilegio({
    entidad: Persona.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      const {
        page = "1",
        limit = "10",
        term,
        nif,
        email,
        empresa,
        nombre,
      } = req.query;

      const where: any = {};

      if (term) {
        where[0] = { nif: ILike(`%${term}%`) };
        where[1] = { email: ILike(`%${term}%`) };
        where[2] = { empresa: ILike(`%${term}%`) };
        where[3] = { nombre: ILike(`%${term}%`) };
        where[4] = { apellido: ILike(`%${term}%`) };
      } else {
        if (nif) where.nif = ILike(`%${nif}%`);
        if (email) where.email = ILike(`%${email}%`);
        if (empresa) where.empresa = ILike(`%${empresa}%`);
        if (nombre) {
          where[0] = { nombre: ILike(`%${nombre}%`) };
          where[1] = { apellido: ILike(`%${nombre}%`) };
        }
      }

      const [personas, total] = await AppDataSource.getRepository(
        Persona
      ).findAndCount({
        where: term
          ? [where[0], where[1], where[2], where[3], where[4]]
          : nombre
          ? [where[0], where[1]]
          : where,
        take: parseInt(limit as string),
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        order: { fechaCreado: "DESC" },
      });

      res.status(200).json({
        personas,
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

// Get - persona por id
PersonasRouter.get(
  "/:id",
  verificarPrivilegio({
    entidad: Persona.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const persona = await AppDataSource.getRepository(Persona).findOne({
        where: { id },
      });
      if (!persona)
        return res.status(404).json({ message: `Persona no existe.` });
      return res.status(200).json(persona);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// Crear Persona
PersonasRouter.post(
  "/",
  verificarPrivilegio({
    entidad: Persona.name,
    accion: Acciones.crear,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const persona = req.body.persona as IPersona;
      const newPersona = new Persona();
      newPersona.nombre = persona.nombre;
      newPersona.apellido = persona.apellido;
      newPersona.email = persona.email;
      newPersona.nif = persona.nif;
      persona.empresa && (newPersona.empresa = persona.empresa);
      persona.telefono && (newPersona.telefono = persona.telefono);
      const savedPersona = await AppDataSource.getRepository(Persona).save(
        newPersona
      );
      return res.status(201).json(savedPersona);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// Actualizar Persona
PersonasRouter.put(
  "/:id",
  verificarPrivilegio({
    entidad: Persona.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const persona = req.body.persona as Persona;
      if (id !== persona.id) {
        throw new Error("Persona no concuerda.");
      }
      const updatedPersona = await AppDataSource.getRepository(Persona).save(
        persona
      );
      return res.status(200).json(updatedPersona);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

export { PersonasRouter };
