import { Router, Request, Response } from "express";
import { Usuario } from "../orm/entity/usuario";
import { isSuperAdmin } from "shared/helpers";
import { AppDataSource } from "../orm/data-source";
import { Orden } from "../orm/entity/orden";
import { Producto } from "../orm/entity/producto";
import { Between } from "typeorm";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";

const DashboardRouter = Router();

DashboardRouter.get("/", async (req: Request, res: Response) => {
  const user = req.user as Usuario;
  const isAdmin = isSuperAdmin(user);

  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const ordenesRepository = AppDataSource.getRepository(Orden);

  const ventasMensuales = await ordenesRepository
    .createQueryBuilder("orden")
    .where(isAdmin ? "1=1" : "orden.vendedorId = :userId", {
      userId: user.id,
    })
    .andWhere("orden.fechaCreado BETWEEN :start AND :end", {
      start: monthStart,
      end: monthEnd,
    })
    .getMany();

  const totalVentasMes = ventasMensuales.reduce(
    (acc, orden) => acc + orden.total,
    0
  );
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
    .where(isAdmin ? "1=1" : "orden.vendedorId = :userId", {
      userId: user.id,
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
    .select("categoria.nombre", "category")
    .addSelect("SUM(item.cantidad)", "quantity")
    .addSelect("SUM(item.precio * item.cantidad)", "total")
    .where(isAdmin ? "1=1" : "orden.vendedorId = :userId", {
      userId: user.id,
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

  // Get sales by country (only for admin)
  const salesByCountry = isAdmin
    ? await ordenesRepository
        .createQueryBuilder("orden")
        .leftJoin("orden.vendedor", "vendedor")
        .addSelect("COUNT(orden.id)", "quantity")
        .addSelect("SUM(orden.total)", "total")
        .where("orden.fechaCreado BETWEEN :start AND :end", {
          start: monthStart,
          end: monthEnd,
        })
        .getRawMany()
    : [];

  return res.status(200).json({
    dailySales: formattedDailySales,
    salesByCategory: salesByCategory.map((category) => ({
      ...category,
      total: Number(category.total),
      quantity: Number(category.quantity),
    })),
    salesByCountry: salesByCountry.map((country) => ({
      ...country,
      total: Number(country.total),
      quantity: Number(country.quantity),
    })),
  });
});

export { DashboardRouter };
