import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import { Transaccion } from "../orm/entity/transaccion";
import { verificarPrivilegio } from "../helpers/privilegios.helpers";
import {
  Acciones,
  EstatusPago,
  RolesBase,
  TipoTransaccion,
} from "shared/enums";
import { Usuario } from "../orm/entity/usuario";
import { Archivo } from "../orm/entity/archivo";
import { sendEmail } from "../providers/email";
import { currencyFormat } from "shared";
import { emitSocketEvent } from "../providers/sockets";
import { transcode } from "buffer";
import { Persona } from "../orm/entity/persona";

const TransaccionesRouter: Router = Router();

// GET - Transacciones por usuario
TransaccionesRouter.get(
  "/",
  verificarPrivilegio({
    entidad: Transaccion.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;

      const { page = "1", limit = "10", usuarioId } = req.query;

      const repo = AppDataSource.getRepository(Transaccion);

      const [transacciones, total] = await repo
        .createQueryBuilder("transaccion")
        .leftJoinAndSelect("transaccion.archivos", "archivos")
        .leftJoin("transaccion.usuario", "usuario")
        .addSelect("usuario.id") // Select only the 'id' from the 'usuario' relation
        .where("usuario.id = :usuarioId", { usuarioId })
        .take(parseInt(limit as string))
        .skip((parseInt(page as string) - 1) * parseInt(limit as string))
        .orderBy("transaccion.fechaActualizado", "DESC")
        .getManyAndCount();

      const pagosPendientes = await repo
        .createQueryBuilder("transaccion")
        .leftJoin("transaccion.usuario", "usuario")
        .where("usuario.id = :usuarioId", { usuarioId })
        .andWhere("transaccion.estatusPago = :estatusPago", {
          estatusPago: EstatusPago.pendiente,
        })
        .andWhere("transaccion.tipo = :tipo", {
          tipo: TipoTransaccion.pago,
        })
        .getMany();

      const reembolsosPendientes = await repo
        .createQueryBuilder("transaccion")
        .leftJoin("transaccion.usuario", "usuario")
        .where("usuario.id = :usuarioId", { usuarioId })
        .andWhere("transaccion.estatusPago = :estatusPago", {
          estatusPago: EstatusPago.pendiente,
        })
        .andWhere("transaccion.tipo = :tipo", {
          tipo: TipoTransaccion.reembolso,
        })
        .getMany();

      const totalPagos = pagosPendientes.reduce((sum, t) => sum + t.monto, 0);
      const totalReembolsos = reembolsosPendientes.reduce(
        (sum, t) => sum + t.monto,
        0
      );

      const { balance } = (await AppDataSource.getRepository(Usuario)
        .createQueryBuilder("usuario")
        .select("usuario.balance")
        .where("usuario.id = :usuarioId", { usuarioId })
        .getOne()) || { balance: 0 };

      res.status(200).json({
        transacciones,
        balance,
        pagosPendientes: pagosPendientes.length,
        reembolsosPendientes: reembolsosPendientes.length,
        totalPagos,
        totalReembolsos,
        total,
        page: parseInt(page as string),
        pageCount: Math.ceil(total / parseInt(limit as string) || 1),
      });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  }
);

/**
 * Processes a transaction and updates user balance accordingly.
 * Returns the new balance and saved transaction.
 */
export async function processTransaction(
  manager: any,
  data: Transaccion
): Promise<{ balance: number; transaccion: Transaccion }> {
  // Query simple para obtener el balance del usuario
  const persona = await manager
    .getRepository(Persona)
    .createQueryBuilder("persona")
    .select("persona.balance")
    .where("persona.id = :id", { id: data.persona.id })
    .getOne();

  if (!persona) {
    throw new Error("Persona no encontrada");
  }

  // calcular el nuevo balance basado en el tipo de transacción
  let nuevoBalance = persona.balance;
  if (
    (data.tipo === TipoTransaccion.pago ||
      data.tipo === TipoTransaccion.reembolso) &&
    data.estatusPago === EstatusPago.confirmado
  ) {
    nuevoBalance -= data.monto;
  } else if (data.tipo === TipoTransaccion.credito) {
    nuevoBalance -= data.monto;
  } else if (
    data.tipo === TipoTransaccion.factura ||
    data.tipo === TipoTransaccion.debito ||
    data.tipo === TipoTransaccion.avance_efectivo
  ) {
    nuevoBalance += data.monto;
  }

  // Actualizar el balance del usuario
  data.balance = nuevoBalance;
  await manager
    .getRepository(Persona)
    .update(data.persona.id, { balance: nuevoBalance });

  // Procesar archivos si existen
  const archivos = [] as Archivo[];
  if (data.archivos?.length) {
    const { AWS_ENDPOINT, AWS_BUCKET } = process.env;
    for (const a of data.archivos) {
      const archivo = new Archivo();
      archivo.id = a.id;
      archivo.nombre = a.nombre;
      archivo.tipo = a.tipo;
      archivo.estatus = a.estatus;
      archivo.url = `${AWS_ENDPOINT}/${AWS_BUCKET}/${a.url}`;
      const savedArchivo = await manager.getRepository(Archivo).save(archivo);
      archivos.push(savedArchivo);
    }
  }

  // Guardar la transacción con los archivos ya guardados
  const transaccionData = {
    ...data,
    archivos: archivos,
  };
  const savedTransaccion = await manager
    .getRepository(Transaccion)
    .save(transaccionData);

  return { balance: nuevoBalance, transaccion: savedTransaccion };
}

// POST - Crear transacción
TransaccionesRouter.post(
  "/",
  verificarPrivilegio({
    entidad: Transaccion.name,
    accion: Acciones.crear,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      const data = req.body.transaccion as Transaccion;

      await AppDataSource.manager.transaction(async (manager) => {
        const { balance, transaccion } = await processTransaction(
          manager,
          data
        );
        // emit socket event to the vendor
        emitSocketEvent(user.id, "nuevaTransaccion", {
          balance,
          transaccion,
          timestamp: new Date().toISOString(),
        });
      });

      res.status(201).json({ message: "Transacción creada exitosamente" });

      // email all Gerentes when a new Pago or Reembolso is created
      if (
        data.tipo === TipoTransaccion.pago ||
        data.tipo === TipoTransaccion.reembolso
      ) {
        const gerentes = await AppDataSource.getRepository(Usuario).find({
          where: {
            rol: {
              nombre: RolesBase.gerente,
            },
          },
        });
        // const gerentes = [{ email: "nvictor@pm.me" }];
        const emailPromises = gerentes.map((gerente) =>
          sendEmail(
            process.env.NO_REPLY_EMAIL_ADDRESS as string,
            gerente.email,
            `Nuevo ${data.tipo} de ${data.persona.nombre} ${data.persona.apellido}`,
            `
              <p>Se ha creado un nuevo ${data.tipo}</p>
              <p>Monto: ${currencyFormat({
                value: data.monto,
              })}</p>
              <p>Persona: ${data.persona.nombre} ${data.persona.apellido}</p>
              <p>Fecha: ${new Date()
                .toISOString()
                .slice(0, 16)
                .split("T")
                .join(" ")}</p>
              `
          )
        );

        await Promise.all(emailPromises);
      }
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: e.message });
    }
  }
);

// PUT - actualizar estatus de pago
TransaccionesRouter.put(
  "/:transaccionId/estatus",
  verificarPrivilegio({
    entidad: Transaccion.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { transaccionId } = req.params;
      const estatusPago = req.body.estatusPago as EstatusPago;

      await AppDataSource.manager.transaction(async (manager) => {
        // obtener estado actual de la transacción
        const transaccion = await manager
          .getRepository(Transaccion)
          .findOneOrFail({
            where: { id: transaccionId },
            relations: ["usuario"],
          });

        // obtener balance actual del cliente
        const { balance } = await manager.getRepository(Persona).findOneOrFail({
          where: { id: transaccion.persona.id },
          select: ["balance"],
        });
        // calcular el nuevo balance si el estatus de pago es confirmado
        let nuevoBalance = balance;
        if (
          estatusPago === EstatusPago.confirmado &&
          (transaccion.tipo === TipoTransaccion.pago ||
            transaccion.tipo === TipoTransaccion.reembolso)
        ) {
          nuevoBalance -= transaccion.monto;
        }

        // Actualizar el balance del cliente
        await manager
          .getRepository(Persona)
          .update(transaccion.persona.id, { balance: nuevoBalance });

        // Actualizar el estatus de pago de la transacción y el balance
        await manager
          .getRepository(Transaccion)
          .update(transaccionId, { estatusPago, balance: nuevoBalance });
      });

      res.status(200).json({ message: "Estatus de pago actualizado" });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

export { TransaccionesRouter };
