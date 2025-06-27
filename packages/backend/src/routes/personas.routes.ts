import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import { verificarPrivilegio } from "../helpers/privilegios.helpers";
import { Acciones } from "shared/enums";
import { Persona } from "../orm/entity/persona";
import { IPersona } from "shared/interfaces";

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
      const { page = "1", limit = "10", term } = req.query;

      const queryBuilder = AppDataSource.getRepository(Persona)
        .createQueryBuilder("persona")
        .orderBy("persona.fechaCreado", "DESC")
        .take(parseInt(limit as string))
        .skip((parseInt(page as string) - 1) * parseInt(limit as string));

      if (term) {
        queryBuilder
          .where("persona.nombre ILIKE :term", { term: `%${term}%` })
          .orWhere("persona.apellido ILIKE :term", { term: `%${term}%` })
          .orWhere("persona.nif ILIKE :term", { term: `%${term}%` })
          .orWhere("persona.email ILIKE :term", { term: `%${term}%` })
          .orWhere("persona.empresa ILIKE :term", { term: `%${term}%` });
      }

      const [personas, total] = await queryBuilder.getManyAndCount();

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
      // Si existe empresa, se asigna
      persona.empresa && (newPersona.empresa = persona.empresa);
      // Si existe teléfono, se asigna
      persona.telefono && (newPersona.telefono = persona.telefono);
      // Guardar las notas del cliente si existen
      persona.notas && (newPersona.notas = persona.notas);
      // Guardar el tipo de cliente si viene en el request
      persona.tipoCliente && (newPersona.tipoCliente = persona.tipoCliente);
      // Guardar si el crédito está habilitado si viene en el request
      persona.creditoHabilitado &&
        (newPersona.creditoHabilitado = persona.creditoHabilitado);
      // Guardar el límite de crédito si viene en el request
      persona.creditoLimite &&
        (newPersona.creditoLimite = persona.creditoLimite);
      // Guardar la persona en la base de datos
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
