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
        // Al recibir, agregar stock al destino
        for (const item of updatedMovimiento.items) {
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
          });
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
      const movimiento = await AppDataSource.getRepository(Movimiento).findOne({
        where: { id: movimientoId },
        relations: ["usuario"],
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
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

export { MovimientosRouter };
