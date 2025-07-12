import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import { Movimiento } from "../orm/entity/movimiento";
import { ItemMovimiento } from "../orm/entity/itemMovimiento";
import { MovimientoHistorial } from "../orm/entity/historialMovimiento";
import { verificarPrivilegio } from "../helpers/privilegios.helpers";
import { Acciones, EstatusMovimiento, RolesBase } from "shared/enums";
import { Usuario } from "../orm/entity/usuario";
import { Stock } from "../orm/entity/stock";
import { emitSocketEvent } from "../providers/sockets";
import { isSuperAdmin } from "shared/helpers";
import { sendEmail } from "../providers/email";

const MovimientosRouter: Router = Router();

// Get - Todas las movimientos
MovimientosRouter.get(
  "/",
  verificarPrivilegio({
    entidad: Movimiento.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      const isAdmin = isSuperAdmin(user);

      const { page = "1", limit = "10", term, estatus } = req.query;

      const query = AppDataSource.getRepository(Movimiento)
        .createQueryBuilder("movimiento")
        .distinct(true)
        .select("movimiento")
        .leftJoinAndSelect("movimiento.origen", "origen")
        .leftJoinAndSelect("movimiento.destino", "destino")
        .leftJoinAndSelect("movimiento.usuario", "usuario")
        .leftJoinAndSelect("movimiento.items", "items")
        .leftJoinAndSelect("items.producto", "producto");

      if (!isAdmin) {
        query.andWhere("usuario.id = :idUsuario", { idUsuario: user.id });
      }

      if (term) {
        const orConditions = [
          "CAST(movimiento.serial AS TEXT) ILIKE :term",
          "origen.nombre ILIKE :term",
          "destino.nombre ILIKE :term",
          "usuario.nombre ILIKE :term",
          "usuario.apellido ILIKE :term",
          'EXISTS (SELECT 1 FROM movimientos_items mi INNER JOIN productos p ON p.id = mi."productoId" WHERE mi."movimientoId" = movimiento.id AND (p.nombre ILIKE :term OR p.sku ILIKE :term))',
        ];
        query.andWhere(`(${orConditions.join(" OR ")})`, { term: `%${term}%` });
      }

      if (estatus) {
        query.andWhere("movimiento.estatus = :estatus", {
          estatus: estatus as EstatusMovimiento,
        });
      }

      const total = await query.getCount();

      const movimientos = await query
        .orderBy("movimiento.fechaCreado", "DESC")
        .skip((parseInt(page as string) - 1) * parseInt(limit as string))
        .take(parseInt(limit as string))
        .getMany();

      res.status(200).json({
        movimientos,
        total,
        page: parseInt(page as string),
        pageCount: Math.ceil(total / parseInt(limit as string)),
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// GET - Movimiento by id
MovimientosRouter.get(
  "/:movimientoId",
  verificarPrivilegio({
    entidad: Movimiento.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { movimientoId } = req.params;
      const movimiento = await AppDataSource.getRepository(Movimiento).findOne({
        where: { id: movimientoId },
        relations: [
          "origen",
          "destino",
          "usuario",
          "items",
          "items.producto",
          "historial",
          "historial.usuario",
        ],
      });
      if (!movimiento) {
        return res.status(404).json({ error: "Movimiento no encontrado" });
      }
      res.status(200).json(movimiento);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// POST - Crear nuevo movimiento
MovimientosRouter.post(
  "/",
  verificarPrivilegio({
    entidad: Movimiento.name,
    accion: Acciones.crear,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      const data = req.body.movimiento as Movimiento;

      if (!data)
        return res
          .status(400)
          .json({ error: "Datos de movimiento requeridos" });

      // Validar que items existe y no está vacío
      if (
        !data.items ||
        !Array.isArray(data.items) ||
        data.items.length === 0
      ) {
        return res
          .status(400)
          .json({ error: "El movimiento debe tener al menos un item" });
      }

      // Validar que origen y destino son diferentes
      if (data.origen.id === data.destino.id) {
        return res
          .status(400)
          .json({ error: "El almacén origen y destino no pueden ser iguales" });
      }

      const newMovimiento = new Movimiento();

      // Basic movement details
      newMovimiento.estatus = EstatusMovimiento.pendiente;
      newMovimiento.notas = data.notas;

      // Relationships
      newMovimiento.origen = data.origen;
      newMovimiento.destino = data.destino;
      newMovimiento.usuario = user;

      // Guardar items del movimiento
      const savedItems = await AppDataSource.getRepository(ItemMovimiento).save(
        data.items.map((item) => ({
          producto: item.producto,
          cantidad: item.cantidad,
          notas: item.notas || "",
        })),
        { chunk: 100 }
      );

      newMovimiento.items = savedItems;

      // Save the complete movement
      const savedMovimiento = await AppDataSource.getRepository(
        Movimiento
      ).save(newMovimiento);

      // Fetch the updated movement with relations
      const updatedMovimiento = await AppDataSource.getRepository(
        Movimiento
      ).findOne({
        where: { id: savedMovimiento.id },
        relations: ["origen", "destino", "usuario", "items", "items.producto"],
      });

      res.status(201).json({ movimiento: updatedMovimiento });

      // Add a new history record
      const historial = new MovimientoHistorial();
      historial.estatus = EstatusMovimiento.pendiente;
      historial.usuario = user;
      historial.movimiento = savedMovimiento;
      historial.notas = "Movimiento creado";
      await AppDataSource.getRepository(MovimientoHistorial).save(historial);

      // emit socket event to gerentes when a new movement is created
      const gerentes = await AppDataSource.getRepository(Usuario).find({
        where: {
          rol: { nombre: RolesBase.gerente },
        },
      });
      gerentes.forEach((gerente) => {
        emitSocketEvent(gerente.id, "nuevoMovimiento", {
          movimiento: updatedMovimiento,
          timestamp: new Date().toISOString(),
        });
      });

      // Email gerentes when a new movement is created
      const emailPromises = gerentes.map((gerente) =>
        sendEmail(
          process.env.NO_REPLY_EMAIL_ADDRESS as string,
          gerente.email,
          `Nuevo movimiento #${savedMovimiento.serial} entre ${savedMovimiento.origen.nombre} y ${savedMovimiento.destino.nombre}`,
          `
            <p>Se ha creado un nuevo movimiento</p>
            <p>Responsable: ${savedMovimiento.usuario.nombre} ${
            savedMovimiento.usuario.apellido
          }</p>
            <p>Almacén Origen: ${savedMovimiento.origen.nombre}</p>
            <p>Almacén Destino: ${savedMovimiento.destino.nombre}</p>
            <p>Productos: ${savedMovimiento.items.length} productos</p>
            <p>Total Unidades: ${savedMovimiento.items.reduce(
              (sum, item) => sum + item.cantidad,
              0
            )}</p>
            <p>Estatus: ${savedMovimiento.estatus}</p>
            <p>Fecha: ${new Date(savedMovimiento.fechaCreado).toLocaleString(
              "es-US",
              { timeZone: "America/New_York" }
            )} (EST)</p>
          `
        )
      );

      try {
        await Promise.allSettled(emailPromises);
      } catch (emailError) {
        console.error(JSON.stringify(emailError, null, 2));
      }
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT - Actualizar movimiento
MovimientosRouter.put(
  "/:movimientoId",
  verificarPrivilegio({
    entidad: Movimiento.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { movimientoId } = req.params;
      const data = req.body.movimiento as Movimiento;
      const user = req.user as Usuario;

      if (!data)
        return res
          .status(400)
          .json({ error: "Datos de movimiento requeridos" });

      const movimiento = await AppDataSource.getRepository(Movimiento).findOne({
        where: { id: movimientoId },
        relations: ["origen", "destino", "usuario", "items", "items.producto"],
      });

      if (!movimiento) {
        return res.status(404).json({ error: "Movimiento no encontrado" });
      }

      // Solo permitir editar movimientos pendientes
      if (movimiento.estatus !== EstatusMovimiento.pendiente) {
        return res
          .status(400)
          .json({ error: "Solo se pueden editar movimientos pendientes" });
      }

      // Validar que items existe y no está vacío
      if (
        !data.items ||
        !Array.isArray(data.items) ||
        data.items.length === 0
      ) {
        return res
          .status(400)
          .json({ error: "El movimiento debe tener al menos un item" });
      }

      // Validar que origen y destino son diferentes
      if (data.origen.id === data.destino.id) {
        return res
          .status(400)
          .json({ error: "El almacén origen y destino no pueden ser iguales" });
      }

      // Actualizar datos básicos del movimiento
      await AppDataSource.getRepository(Movimiento).update(movimientoId, {
        origen: data.origen,
        destino: data.destino,
        notas: data.notas,
      });

      // Eliminar items existentes
      await AppDataSource.getRepository(ItemMovimiento).delete({
        movimiento: { id: movimientoId },
      });

      // Crear nuevos items
      const savedItems = await AppDataSource.getRepository(ItemMovimiento).save(
        data.items.map((item) => ({
          movimiento: { id: movimientoId },
          producto: item.producto,
          cantidad: item.cantidad,
          notas: item.notas || "",
        })),
        { chunk: 100 }
      );

      // Fetch the updated movement with relations
      const updatedMovimiento = await AppDataSource.getRepository(
        Movimiento
      ).findOne({
        where: { id: movimientoId },
        relations: ["origen", "destino", "usuario", "items", "items.producto"],
      });

      if (!updatedMovimiento) {
        return res.status(404).json({ error: "Movimiento no encontrado" });
      }

      res.status(200).json({ movimiento: updatedMovimiento });

      // Add a new history record
      const historial = new MovimientoHistorial();
      historial.estatus = updatedMovimiento.estatus;
      historial.usuario = user;
      historial.movimiento = updatedMovimiento;
      historial.notas = "Movimiento actualizado";
      await AppDataSource.getRepository(MovimientoHistorial).save(historial);

      // emit socket event
      emitSocketEvent(updatedMovimiento.usuario.id, "movimientoActualizado", {
        movimiento: updatedMovimiento,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT - Actualizar estatus de movimiento
MovimientosRouter.put(
  "/:movimientoId/estatus",
  verificarPrivilegio({
    entidad: Movimiento.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { movimientoId } = req.params;
      const { estatus, notas } = req.body;
      const user = req.user as Usuario;

      const movimiento = await AppDataSource.getRepository(Movimiento).findOne({
        where: { id: movimientoId },
        relations: ["origen", "destino", "usuario", "items", "items.producto"],
      });

      if (!movimiento) {
        return res.status(404).json({ error: "Movimiento no encontrado" });
      }

      await AppDataSource.getRepository(Movimiento).update(movimientoId, {
        estatus,
      });

      // Fetch the updated movement with all relations
      const updatedMovimiento = await AppDataSource.getRepository(
        Movimiento
      ).findOne({
        where: { id: movimientoId },
        relations: ["origen", "destino", "usuario", "items", "items.producto"],
      });

      if (!updatedMovimiento) {
        return res.status(404).json({ error: "Movimiento no encontrado" });
      }

      // Aplicar cambios de stock según el estatus
      if (updatedMovimiento.estatus === EstatusMovimiento.aprobado) {
        // Al aprobar, verificar stock disponible en origen
        for (const item of updatedMovimiento.items) {
          const stockOrigen = await AppDataSource.getRepository(Stock).findOne({
            where: {
              almacen: { id: updatedMovimiento.origen.id },
              producto: { id: item.producto.id },
            },
          });

          if (!stockOrigen || stockOrigen.actual < item.cantidad) {
            return res.status(400).json({
              error: `Stock insuficiente para ${item.producto.nombre} en ${updatedMovimiento.origen.nombre}`,
            });
          }
        }
      }

      if (updatedMovimiento.estatus === EstatusMovimiento.transito) {
        // Al poner en tránsito, reducir stock del origen y actualizar stocks
        for (const item of updatedMovimiento.items) {
          // Actualizar stock del almacén origen
          const stockOrigen = await AppDataSource.getRepository(Stock).findOne({
            where: {
              almacen: { id: updatedMovimiento.origen.id },
              producto: { id: item.producto.id },
            },
          });

          if (stockOrigen) {
            await AppDataSource.getRepository(Stock).update(stockOrigen.id, {
              actual: stockOrigen.actual - item.cantidad,
              reservado: stockOrigen.reservado + item.cantidad,
            });
          }

          // Actualizar stock del almacén destino
          let stockDestino = await AppDataSource.getRepository(Stock).findOne({
            where: {
              almacen: { id: updatedMovimiento.destino.id },
              producto: { id: item.producto.id },
            },
          });

          if (!stockDestino) {
            // Crear nuevo registro de stock si no existe
            stockDestino = new Stock();
            stockDestino.almacen = updatedMovimiento.destino;
            stockDestino.producto = item.producto;
            stockDestino.actual = 0;
            stockDestino.reservado = 0;
            stockDestino.transito = 0;
            stockDestino.rma = 0;
            await AppDataSource.getRepository(Stock).save(stockDestino);
          }

          await AppDataSource.getRepository(Stock).update(stockDestino.id, {
            transito: stockDestino.transito + item.cantidad,
          });
        }
      }

      if (updatedMovimiento.estatus === EstatusMovimiento.recibido) {
        // Al recibir, agregar stock al destino y liberar reservas
        for (const item of updatedMovimiento.items) {
          // Actualizar stock del almacén origen (liberar reserva)
          const stockOrigen = await AppDataSource.getRepository(Stock).findOne({
            where: {
              almacen: { id: updatedMovimiento.origen.id },
              producto: { id: item.producto.id },
            },
          });

          if (stockOrigen) {
            await AppDataSource.getRepository(Stock).update(stockOrigen.id, {
              reservado: stockOrigen.reservado - item.cantidad,
            });
          }

          // Actualizar stock del almacén destino
          let stockDestino = await AppDataSource.getRepository(Stock).findOne({
            where: {
              almacen: { id: updatedMovimiento.destino.id },
              producto: { id: item.producto.id },
            },
          });

          if (!stockDestino) {
            // Crear nuevo registro de stock si no existe
            stockDestino = new Stock();
            stockDestino.almacen = updatedMovimiento.destino;
            stockDestino.producto = item.producto;
            stockDestino.actual = 0;
            stockDestino.reservado = 0;
            stockDestino.transito = 0;
            stockDestino.rma = 0;
            await AppDataSource.getRepository(Stock).save(stockDestino);
          }

          await AppDataSource.getRepository(Stock).update(stockDestino.id, {
            actual: stockDestino.actual + item.cantidad,
            transito: stockDestino.transito - item.cantidad,
          });
        }
      }

      if (updatedMovimiento.estatus === EstatusMovimiento.anulado) {
        // Al anular, restaurar stock según el estatus anterior
        const estatusAnterior = movimiento.estatus;

        for (const item of updatedMovimiento.items) {
          // Si venía de Transito o Recibido, restaurar stock del origen
          if (
            estatusAnterior === EstatusMovimiento.transito ||
            estatusAnterior === EstatusMovimiento.recibido
          ) {
            const stockOrigen = await AppDataSource.getRepository(
              Stock
            ).findOne({
              where: {
                almacen: { id: updatedMovimiento.origen.id },
                producto: { id: item.producto.id },
              },
            });

            if (stockOrigen) {
              await AppDataSource.getRepository(Stock).update(stockOrigen.id, {
                actual: stockOrigen.actual + item.cantidad,
                reservado: stockOrigen.reservado - item.cantidad,
              });
            }
          }

          // Si venía de Recibido, reducir stock del destino
          if (estatusAnterior === EstatusMovimiento.recibido) {
            const stockDestino = await AppDataSource.getRepository(
              Stock
            ).findOne({
              where: {
                almacen: { id: updatedMovimiento.destino.id },
                producto: { id: item.producto.id },
              },
            });

            if (stockDestino) {
              await AppDataSource.getRepository(Stock).update(stockDestino.id, {
                actual: stockDestino.actual - item.cantidad,
              });
            }
          }

          // Si venía de Transito, reducir tránsito del destino
          if (estatusAnterior === EstatusMovimiento.transito) {
            const stockDestino = await AppDataSource.getRepository(
              Stock
            ).findOne({
              where: {
                almacen: { id: updatedMovimiento.destino.id },
                producto: { id: item.producto.id },
              },
            });

            if (stockDestino) {
              await AppDataSource.getRepository(Stock).update(stockDestino.id, {
                transito: stockDestino.transito - item.cantidad,
              });
            }
          }
        }
      }

      res.status(200).json({ message: `Estatus de movimiento actualizado` });

      // Add a new history record
      const historial = new MovimientoHistorial();
      historial.estatus = updatedMovimiento.estatus;
      historial.usuario = user;
      historial.movimiento = updatedMovimiento;
      historial.notas =
        notas || `Movimiento actualizado a ${updatedMovimiento.estatus}`;
      await AppDataSource.getRepository(MovimientoHistorial).save(historial);

      // After updating the movement status, emit socket event
      emitSocketEvent(updatedMovimiento.usuario.id, "movimientoActualizado", {
        movimiento: updatedMovimiento,
        timestamp: new Date().toISOString(),
      });

      // Email usuario when movement status changes (excepto si es gerente y el estatus es anulado)
      // Verificar si el usuario es gerente consultando la base de datos
      const usuarioCompleto = await AppDataSource.getRepository(
        Usuario
      ).findOne({
        where: { id: updatedMovimiento.usuario.id },
        relations: ["rol"],
      });

      const isGerente = usuarioCompleto?.rol?.nombre === RolesBase.gerente;
      const shouldSendUserEmail = !(
        isGerente && updatedMovimiento.estatus === EstatusMovimiento.anulado
      );

      if (shouldSendUserEmail) {
        const subject = `Movimiento #${updatedMovimiento.serial} actualizado a ${updatedMovimiento.estatus}`;
        const body = `
          <p>El movimiento #${updatedMovimiento.serial} ha sido actualizado a ${
          updatedMovimiento.estatus
        }</p>
          <p>Responsable: ${updatedMovimiento.usuario.nombre} ${
          updatedMovimiento.usuario.apellido
        }</p>
          <p>Almacén Origen: ${updatedMovimiento.origen.nombre}</p>
          <p>Almacén Destino: ${updatedMovimiento.destino.nombre}</p>
          <p>Productos: ${updatedMovimiento.items.length} productos</p>
          <p>Total Unidades: ${updatedMovimiento.items.reduce(
            (sum, item) => sum + item.cantidad,
            0
          )}</p>
          <p>Estatus: ${updatedMovimiento.estatus}</p>
          <p>Fecha: ${new Date().toLocaleString("es-US", {
            timeZone: "America/New_York",
          })} (EST)</p>
        `;

        try {
          await sendEmail(
            process.env.NO_REPLY_EMAIL_ADDRESS as string,
            updatedMovimiento.usuario.email,
            subject,
            body
          );
        } catch (emailError) {
          console.error("Error sending movement status email:", emailError);
        }
      }

      // Si es gerente y el estatus es anulado, enviar correo personalizado
      if (
        isGerente &&
        updatedMovimiento.estatus === EstatusMovimiento.anulado
      ) {
        const subject = `Movimiento #${updatedMovimiento.serial} ANULADO - Usted es el responsable`;
        const body = `
          <p><strong>Usted ha anulado el movimiento #${
            updatedMovimiento.serial
          }</strong></p>
          <p>Movimiento #${updatedMovimiento.serial} ha sido anulado</p>
          <p>Responsable: ${updatedMovimiento.usuario.nombre} ${
          updatedMovimiento.usuario.apellido
        }</p>
          <p>Almacén Origen: ${updatedMovimiento.origen.nombre}</p>
          <p>Almacén Destino: ${updatedMovimiento.destino.nombre}</p>
          <p>Productos: ${updatedMovimiento.items.length} productos</p>
          <p>Total Unidades: ${updatedMovimiento.items.reduce(
            (sum, item) => sum + item.cantidad,
            0
          )}</p>
          <p>Estatus Anterior: ${movimiento.estatus}</p>
          <p>Estatus Actual: ${updatedMovimiento.estatus}</p>
          <p>Fecha: ${new Date().toLocaleString("es-US", {
            timeZone: "America/New_York",
          })} (EST)</p>
          <p><em>Este movimiento ha sido cancelado y requiere atención de gestión.</em></p>
        `;

        try {
          await sendEmail(
            process.env.NO_REPLY_EMAIL_ADDRESS as string,
            updatedMovimiento.usuario.email,
            subject,
            body
          );
        } catch (emailError) {
          console.error("Error sending gerente responsable email:", emailError);
        }
      }

      // Email adicional a gerentes cuando el movimiento se anula
      if (updatedMovimiento.estatus === EstatusMovimiento.anulado) {
        const gerentes = await AppDataSource.getRepository(Usuario).find({
          where: {
            rol: { nombre: RolesBase.gerente },
          },
        });

        // Filtrar gerentes para excluir al responsable (ya recibió su correo personalizado)
        const gerentesSinResponsable = gerentes.filter(
          (gerente) => gerente.id !== updatedMovimiento.usuario.id
        );

        const gerentesEmailPromises = gerentesSinResponsable.map((gerente) => {
          return sendEmail(
            process.env.NO_REPLY_EMAIL_ADDRESS as string,
            gerente.email,
            `ALERTA: Movimiento #${updatedMovimiento.serial} ANULADO`,
            `
              <p><strong>ALERTA: Se ha anulado un movimiento</strong></p>
              <p>Movimiento #${updatedMovimiento.serial} ha sido anulado</p>
              <p>Responsable: ${updatedMovimiento.usuario.nombre} ${
              updatedMovimiento.usuario.apellido
            }</p>
              <p>Almacén Origen: ${updatedMovimiento.origen.nombre}</p>
              <p>Almacén Destino: ${updatedMovimiento.destino.nombre}</p>
              <p>Productos: ${updatedMovimiento.items.length} productos</p>
              <p>Total Unidades: ${updatedMovimiento.items.reduce(
                (sum, item) => sum + item.cantidad,
                0
              )}</p>
              <p>Estatus Anterior: ${movimiento.estatus}</p>
              <p>Estatus Actual: ${updatedMovimiento.estatus}</p>
              <p>Fecha: ${new Date().toLocaleString("es-US", {
                timeZone: "America/New_York",
              })} (EST)</p>
              <p><em>Este movimiento ha sido cancelado y requiere atención de gestión.</em></p>
            `
          );
        });

        try {
          await Promise.allSettled(gerentesEmailPromises);
        } catch (gerentesEmailError) {
          console.error(
            "Error sending gerentes email for anulado status:",
            gerentesEmailError
          );
        }
      }
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// DELETE - Eliminar movimiento
MovimientosRouter.delete(
  "/:movimientoId",
  verificarPrivilegio({
    entidad: Movimiento.name,
    accion: Acciones.eliminar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { movimientoId } = req.params;
      const user = req.user as Usuario;
      const movimiento = await AppDataSource.getRepository(Movimiento).findOne({
        where: { id: movimientoId },
        relations: ["usuario", "origen", "destino", "items", "items.producto"],
      });

      if (!movimiento) {
        return res.status(404).json({ error: "Movimiento no encontrado" });
      }

      // Solo permitir eliminar movimientos pendientes
      if (movimiento.estatus !== EstatusMovimiento.pendiente) {
        return res.status(400).json({
          error: "Solo se pueden eliminar movimientos pendientes",
        });
      }

      await AppDataSource.getRepository(Movimiento).softRemove(movimiento);
      res.status(200).json({ message: "Movimiento eliminado" });

      emitSocketEvent(movimiento.usuario.id, "movimientoEliminado", {
        movimiento,
        timestamp: new Date().toISOString(),
      });

      // Email a gerentes cuando se elimina un movimiento
      const gerentes = await AppDataSource.getRepository(Usuario).find({
        where: {
          rol: { nombre: RolesBase.gerente },
        },
      });

      const emailPromises = gerentes.map((gerente) =>
        sendEmail(
          process.env.NO_REPLY_EMAIL_ADDRESS as string,
          gerente.email,
          `ALERTA: Movimiento #${movimiento.serial} ELIMINADO`,
          `
            <p><strong>ALERTA: Se ha eliminado un movimiento</strong></p>
            <p>Movimiento #${movimiento.serial} ha sido eliminado</p>
            <p>Responsable: ${movimiento.usuario.nombre} ${
            movimiento.usuario.apellido
          }</p>
            <p>Eliminado por: ${user.nombre} ${user.apellido}</p>
            <p>Almacén Origen: ${movimiento.origen.nombre}</p>
            <p>Almacén Destino: ${movimiento.destino.nombre}</p>
            <p>Productos: ${movimiento.items.length} productos</p>
            <p>Total Unidades: ${movimiento.items.reduce(
              (sum, item) => sum + item.cantidad,
              0
            )}</p>
            <p>Estatus: ${movimiento.estatus}</p>
            <p>Fecha: ${new Date().toLocaleString("es-US", {
              timeZone: "America/New_York",
            })} (EST)</p>
            <p><em>Este movimiento ha sido eliminado permanentemente y requiere atención de gestión.</em></p>
          `
        )
      );

      try {
        await Promise.allSettled(emailPromises);
      } catch (emailError) {
        console.error(
          "Error sending gerentes email for deleted movement:",
          emailError
        );
      }
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

export { MovimientosRouter };
