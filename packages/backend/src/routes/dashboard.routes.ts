import { Router, Request, Response } from "express";
import { Usuario } from "../orm/entity/usuario";
import { isSuperAdmin } from "shared/helpers";
import { AppDataSource } from "../orm/data-source";
import { Orden } from "../orm/entity/orden";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import { TipoOrden } from "shared/enums";
import { Persona } from "../orm/entity/persona";
import { MoreThan } from "typeorm";
const DashboardRouter = Router();

DashboardRouter.get("/", async (req: Request, res: Response) => {
  const user = req.user as Usuario;
  const isAdmin = isSuperAdmin(user);

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const ordenesRepository = AppDataSource.getRepository(Orden);

  // Solo se consideran ventas con estatus Confirmado o Entregado para el dashboard
  const ventasMensuales = await ordenesRepository
    .createQueryBuilder("orden")
    .leftJoin("orden.vendedor", "vendedor")
    .where(isAdmin ? "1=1" : "vendedor.id = :userId", {
      userId: user.id,
    })
    .andWhere("orden.tipo IN (:...tipos)", {
      tipos: [TipoOrden.venta, TipoOrden.credito],
    })
    // Filtrar solo órdenes con estatus Confirmado o Entregado
    .andWhere("orden.estatus IN (:...estatus)", { estatus: ["Confirmado", "Entregado"] })
    .andWhere("orden.fechaCreado BETWEEN :start AND :end", {
      start: monthStart,
      end: monthEnd,
    })
    .getMany();

  // Sumar el total de ventas del mes solo con las órdenes filtradas
  const totalVentasMes = ventasMensuales.reduce(
    (acc, orden) => acc + orden.total,
    0
  );
  // Calcular el promedio de venta solo con las órdenes filtradas
  const promedioVenta =
    ventasMensuales.length > 0 ? totalVentasMes / ventasMensuales.length : 0;

  return res.status(200).json({
    ventasMensuales: ventasMensuales.length,
    totalVentasMes,
    promedioVenta,
  });
});

DashboardRouter.get("/charts", async (req: Request, res: Response) => {
  const user = req.user as Usuario;
  const isAdmin = isSuperAdmin(user);

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const ordenesRepository = AppDataSource.getRepository(Orden);

  // Get daily sales for the current month
  const dailySales = await ordenesRepository
    .createQueryBuilder("orden")
    .select("DATE(orden.fechaCreado)", "date")
    .addSelect("SUM(orden.total)", "total")
    .leftJoin("orden.vendedor", "vendedor")
    .where(isAdmin ? "1=1" : "vendedor.id = :userId", {
      userId: user.id,
    })
    .andWhere("orden.tipo IN (:...tipos)", {
      tipos: [TipoOrden.venta, TipoOrden.credito],
    })
    .andWhere("orden.fechaCreado BETWEEN :start AND :end", {
      start: monthStart,
      end: monthEnd,
    })
    .groupBy("DATE(orden.fechaCreado)")
    .getRawMany();

  // Get sales by category
  const salesByCategory = await ordenesRepository
    .createQueryBuilder("orden")
    .leftJoin("orden.items", "item")
    .leftJoin("item.producto", "producto")
    .leftJoin("producto.categoria", "categoria")
    .leftJoin("orden.vendedor", "vendedor")
    .select("categoria.nombre", "category")
    .addSelect("SUM(item.cantidad)", "quantity")
    .addSelect("SUM(item.precio * item.cantidad)", "total")
    .where(isAdmin ? "1=1" : "vendedor.id = :userId", {
      userId: user.id,
    })
    .andWhere("orden.tipo IN (:...tipos)", {
      tipos: [TipoOrden.venta, TipoOrden.credito],
    })
    .andWhere("orden.fechaCreado BETWEEN :start AND :end", {
      start: monthStart,
      end: monthEnd,
    })
    .groupBy("categoria.nombre")
    .getRawMany();

  // Fill in missing dates with zero values
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const formattedDailySales = allDays.map((day) => {
    const formattedDate = format(day, "yyyy-MM-dd");
    const sale = dailySales.find(
      (s) => format(new Date(s.date), "yyyy-MM-dd") === formattedDate
    );
    return {
      date: formattedDate,
      total: sale ? Number(sale.total) : 0,
    };
  });

  // Get sales by branch (sucursal)
  const salesByBranch = await ordenesRepository
    .createQueryBuilder("orden")
    .select("sucursal.nombre", "branch")
    .addSelect("COUNT(orden.id)", "quantity")
    .addSelect("SUM(orden.total)", "total")
    .leftJoin("orden.vendedor", "vendedor")
    .leftJoin("orden.sucursal", "sucursal")
    .where(isAdmin ? "1=1" : "vendedor.id = :userId", {
      userId: user.id,
    })
    .andWhere("orden.tipo IN (:...tipos)", {
      tipos: [TipoOrden.venta, TipoOrden.credito],
    })
    .andWhere("orden.fechaCreado BETWEEN :start AND :end", {
      start: monthStart,
      end: monthEnd,
    })
    .groupBy("sucursal.nombre")
    .getRawMany();

  return res.status(200).json({
    dailySales: formattedDailySales,
    salesByCategory: salesByCategory.map((category) => ({
      ...category,
      total: Number(category.total),
      quantity: Number(category.quantity),
    })),
    salesByBranch: salesByBranch.map((branch) => ({
      ...branch,
      total: Number(branch.total),
      quantity: Number(branch.quantity),
    })),
  });
});

DashboardRouter.get("/deudores", async (req: Request, res: Response) => {
  const deudores = await AppDataSource.getRepository(Persona).find({
    select: ["id", "nombre", "apellido", "empresa", "balance", "creditoLimite"],
    where: {
      balance: MoreThan(0),
    },
    order: {
      balance: "DESC",
    },
  });

  return res.status(200).json({
    deudores,
  });
});

export { DashboardRouter };
