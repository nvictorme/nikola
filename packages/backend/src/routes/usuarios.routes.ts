import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import { Usuario } from "../orm/entity/usuario";
import { verificarPrivilegio } from "../helpers/privilegios.helpers";
import { Invitacion } from "../orm/entity/invitacion";
import { EstatusInvitacion, Acciones, RolesBase } from "shared/enums";
import { Rol } from "../orm/entity/rol";
import { Persona } from "../orm/entity/persona";
import { emailInviteLink, emailWelcome } from "../providers/email";
import { generateComplexPassword, isSuperAdmin } from "shared/helpers";
import crypto from "crypto";
import { Like, Not } from "typeorm";
import { Sucursal } from "../orm/entity/sucursal";
import { redis } from "../providers/redis";

const UsuariosRouter: Router = Router();

// GET - Todos los usuarios
UsuariosRouter.get(
  "/",
  verificarPrivilegio({
    entidad: Usuario.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { page = "1", limit = "10", nif, email, pais } = req.query;
      const [usuarios, total] = await AppDataSource.getRepository(
        Usuario
      ).findAndCount({
        where:
          pais || nif || email
            ? {
                ...(pais && { pais: { id: pais as string } }),
                ...(nif && { nif: Like(`%${nif}%`) }),
                ...(email && { email: Like(`%${email}%`) }),
              }
            : undefined,
        relations: [
          "rol",
          "pais",
          "sucursales",
          "sucursales.pais",
          "sucursales.almacenes",
        ],
        take: parseInt(limit as string),
        skip: (parseInt(page as string) - 1) * parseInt(limit as string),
        order: { fechaCreado: "DESC" },
      });
      res.status(200).json({
        usuarios: usuarios.map((u) => {
          const { password, ...usuario } = u;
          return usuario;
        }),
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

// GET - Distribuidores
UsuariosRouter.get(
  "/distribuidores",
  verificarPrivilegio({
    entidad: Usuario.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      const isAdmin = isSuperAdmin(user);
      if (!isAdmin) {
        return res
          .status(403)
          .json({ message: "No tienes permisos para realizar esta acción." });
      }

      const distribuidores = await AppDataSource.getRepository(Usuario)
        .createQueryBuilder("usuario")
        .leftJoinAndSelect("usuario.rol", "rol")
        .leftJoinAndSelect("usuario.pais", "pais")
        .where("usuario.activo = :activo", { activo: true })
        .andWhere("rol.nombre = :rolNombre", {
          rolNombre: RolesBase.distribuidor,
        })
        .select([
          "usuario.id",
          "usuario.nif",
          "usuario.empresa",
          "usuario.nombre",
          "usuario.apellido",
          "usuario.email",
          "usuario.balance",
          "pais",
        ])
        .orderBy("pais.nombre", "ASC")
        .getMany();

      res.status(200).json({ distribuidores });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// GET - Usuarios del chat
// /usuarios/chat
UsuariosRouter.get(
  "/chat",
  verificarPrivilegio({
    entidad: Usuario.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      const isAdmin = isSuperAdmin(user);

      const usuarios = await AppDataSource.getRepository(Usuario).find({
        select: ["id", "nombre", "apellido", "email", "avatar", "pais"],
        where: {
          activo: true,
          id: Not(user.id),
          ...(!isAdmin && {
            rol: {
              nombre: RolesBase.gerente,
            },
          }),
        },
        relations: ["pais"],
      });

      res.status(200).json({ usuarios });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// GET - Usuario por ID
UsuariosRouter.get(
  "/:userId",
  verificarPrivilegio({
    entidad: Usuario.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const usuario = await AppDataSource.getRepository(Usuario).findOne({
        where: { id: userId },
        relations: [
          "rol",
          "pais",
          "sucursales",
          "sucursales.pais",
          "sucursales.almacenes",
        ],
      });
      if (!usuario)
        return res.status(404).json({ message: `Usuario no existe.` });
      const { password, ...person } = usuario;
      return res.status(200).json(person);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// POST - Crear usuario
UsuariosRouter.post(
  "/",
  verificarPrivilegio({
    entidad: Usuario.name,
    accion: Acciones.crear,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const usuarioData = req.body.usuario as Usuario;
      if (!usuarioData) throw new Error("Faltan datos.");

      const complexPassword = generateComplexPassword({
        length: 12,
        useLowercase: true,
        useUppercase: true,
        useNumbers: true,
        useSpecialCharacters: false,
      });

      // Create a new Usuario instance instead of using a plain object
      const usuario = new Usuario();
      Object.assign(usuario, {
        ...usuarioData,
        password: complexPassword,
      });

      const nuevoUsuario = await AppDataSource.getRepository(Usuario).save(
        usuario
      );
      const { password, ...safeUser } = nuevoUsuario;

      await emailWelcome({
        email: usuario.email,
        firstName: usuario.nombre,
        password: complexPassword,
        companyName: process.env.APP_NAME as string,
      });

      res.status(200).json(safeUser);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT - Actualizar usuario
UsuariosRouter.put(
  "/:idUsuario",
  verificarPrivilegio({
    entidad: Usuario.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { idUsuario } = req.params;
      const usuarioData = req.body.user as Usuario;

      // Validate request
      if (!usuarioData || idUsuario !== usuarioData.id) {
        return res
          .status(400)
          .json({ error: "Invalid user data or ID mismatch" });
      }

      // Get user repository
      const userRepository = AppDataSource.getRepository(Usuario);

      // Find existing user with relationships
      const existingUser = await userRepository.findOne({
        where: { id: idUsuario },
        relations: ["rol", "pais", "sucursales", "sucursales.pais"],
      });

      if (!existingUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // if user was disabled, we need to invalidate the token
      if (existingUser.activo && !usuarioData.activo) {
        // invalidate the token, this will log the user out
        await redis.del(existingUser.id);
      }

      // Declare validSucursales outside the if block
      let validSucursales = usuarioData.sucursales || [];

      // If updating sucursales and pais, filter out those from different countries
      if (usuarioData.sucursales?.length && usuarioData.pais) {
        // Fetch full sucursal data to check their countries
        const sucursalesWithPais = (await AppDataSource.createQueryBuilder()
          .select("sucursal")
          .from(Sucursal, "sucursal")
          .leftJoinAndSelect("sucursal.pais", "pais")
          .where("sucursal.id IN (:...ids)", {
            ids: usuarioData.sucursales.map((s) => s.id),
          })
          .getMany()) as Sucursal[];

        // Filter sucursales to only include those from the same country
        validSucursales = sucursalesWithPais.filter(
          (sucursal) => sucursal.pais.id === usuarioData.pais.id
        );

        // Update the sucursales array to only include valid ones
        usuarioData.sucursales = validSucursales.map((s) => ({
          id: s.id,
        })) as Sucursal[];
      }

      // Prepare update data - only update allowed fields
      const updateData = {
        ...existingUser,
        email: usuarioData.email,
        nombre: usuarioData.nombre,
        apellido: usuarioData.apellido,
        empresa: usuarioData.empresa,
        nif: usuarioData.nif,
        telefono: usuarioData.telefono,
        notas: usuarioData.notas,
        avatar: usuarioData.avatar,
        activo: usuarioData.activo,
        exw: usuarioData.exw,
        balance: usuarioData.balance,
        seudonimo: usuarioData.seudonimo,
        // Handle relationships
        rol: usuarioData.rol ? { id: usuarioData.rol.id } : existingUser.rol,
        pais: usuarioData.pais
          ? { id: usuarioData.pais.id }
          : existingUser.pais,
        // Map sucursales to just their IDs for the relation
        sucursales:
          usuarioData.sucursales?.map((s) => ({ id: s.id })) ||
          existingUser.sucursales,
      };

      // Save the updated user
      const updatedUser = await userRepository.save(updateData);

      // Fetch the complete updated user with all relations
      const result = await userRepository.findOne({
        where: { id: updatedUser.id },
        relations: [
          "rol",
          "rol.privilegios",
          "pais",
          "sucursales",
          "sucursales.pais",
          "sucursales.almacenes",
        ],
      });

      // Remove sensitive data before sending response
      const { password, ...safeUser } = result!;

      const originalCount = usuarioData.sucursales?.length || 0;
      const validCount = validSucursales.length;

      // Modify the response to include a warning if branches were filtered
      if (originalCount > validCount) {
        return res.status(200).json({
          ...safeUser,
          warning: `Se excluyeron ${
            originalCount - validCount
          } sucursales que no pertenecen al país del usuario.`,
        });
      }
      return res.status(200).json(safeUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      return res.status(500).json({
        error: "Error updating user",
        details: error.message,
      });
    }
  }
);

// Invitar a un usuario
UsuariosRouter.post(
  "/invitar",
  verificarPrivilegio({
    entidad: Invitacion.name,
    accion: Acciones.crear,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const {
        email,
        nombre,
        apellido,
        rol: { id: idRol },
      } = req.body;
      if (!email || !nombre || !apellido || !idRol) {
        throw new Error("Faltan datos.");
      }

      const invitacion = new Invitacion();
      invitacion.email = email.toLowerCase();
      invitacion.nombre = nombre;
      invitacion.apellido = apellido;
      invitacion.rol = { id: idRol } as Rol;
      invitacion.token = crypto.randomUUID();
      invitacion.estatus = EstatusInvitacion.pendiente;

      const _invitacion = await AppDataSource.getRepository(Invitacion).save(
        invitacion
      );

      await emailInviteLink({
        email: _invitacion.email,
        firstName: _invitacion.nombre,
        companyName: process.env.APP_NAME as string,
        token: _invitacion.token,
      });

      res.status(200).json(_invitacion);
    } catch (e: any) {
      console.error(e.message);
      res.status(500).json({ error: e.message });
    }
  }
);

// Get pending invitations
UsuariosRouter.get(
  "/invitaciones",
  verificarPrivilegio({
    entidad: Invitacion.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const invitations = await AppDataSource.getRepository(Invitacion).find({
        where: {
          estatus: EstatusInvitacion.pendiente,
        },
      });
      res.status(200).json({ invitations });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  }
);

// Accept invitation
UsuariosRouter.get("/invitar/:token", async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const invitation = await AppDataSource.getRepository(Invitacion).findOne({
      where: { token, estatus: EstatusInvitacion.pendiente },
      relations: ["role"],
    });
    if (!invitation) {
      return res
        .status(404)
        .json({ message: "La invitación no existe o ya fue utilizada." });
    }
    if (!invitation.rol) {
      return res.status(404).json({
        message: "La invitación no tiene un rol asociado.",
      });
    }
    let person = await AppDataSource.getRepository(Persona).findOne({
      where: { email: invitation.email },
    });

    // if there is no person with that email, create it
    if (!person) {
      person = new Persona();
      person.email = invitation.email;
      const password = generateComplexPassword({
        length: 10,
        useLowercase: true,
        useUppercase: true,
        useNumbers: true,
        useSpecialCharacters: true,
      });
      person.nombre = invitation.nombre;
      person.apellido = invitation.apellido;
      person = await AppDataSource.getRepository(Persona).save(person);
      await emailWelcome({
        email: invitation.email,
        firstName: invitation.nombre,
        password: password,
        companyName: process.env.APP_NAME ?? "Inflalo Inc.",
      });
    }

    // check if the user already exists in the company
    if (person) {
      const existingUser = await AppDataSource.getRepository(Usuario).findOne({
        where: {
          email: invitation.email,
        },
      });
      if (existingUser) {
        throw new Error(
          "El usuario ya existe, no se puede aceptar la invitación."
        );
      }
    }

    // create the user
    const user = new Usuario();
    Object.assign(user, {
      nombre: invitation.nombre,
      apellido: invitation.apellido,
      email: invitation.email,
      rol: invitation.rol,
    });

    const savedUser = await AppDataSource.getRepository(Usuario).save(user);

    // update the invitation status
    invitation.estatus = EstatusInvitacion.aceptada;
    await AppDataSource.getRepository(Invitacion).save(invitation);

    // send the response with the user
    const { password, ...safePerson } = savedUser;
    return res.status(200).json(safePerson);
  } catch (e: any) {
    console.error(e.message);
    res.status(500).json({ error: e.message });
  }
});

export { UsuariosRouter };
