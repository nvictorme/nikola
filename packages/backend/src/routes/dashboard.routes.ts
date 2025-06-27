import { Router, Request, Response } from "express";
import { Usuario } from "../orm/entity/usuario";
import { isSuperAdmin } from "shared/helpers";
import { AppDataSource } from "../orm/data-source";
import { Orden } from "../orm/entity/orden";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { eachDayOfInterval } from "date-fns/eachDayOfInterval";
import { EstatusOrden, TipoOrden } from "shared/enums";
import { Persona } from "../orm/entity/persona";
import { MoreThan } from "typeorm";
import { Stock } from "../orm/entity/stock";
import { calcularStockDisponible } from "shared/helpers";
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
    .andWhere("orden.estatus IN (:...estatus)", {
      estatus: [EstatusOrden.confirmado, EstatusOrden.entregado],
    })
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

  // Get reposiciones del mes
  const reposicionesMes = await ordenesRepository
    .createQueryBuilder("orden")
    .select(["orden.id", "orden.total"])
    .leftJoin("orden.vendedor", "vendedor")
    .where(isAdmin ? "1=1" : "vendedor.id = :userId", {
      userId: user.id,
    })
    .andWhere("orden.tipo = :tipo", { tipo: TipoOrden.reposicion })
    .andWhere("orden.fechaCreado BETWEEN :start AND :end", {
      start: monthStart,
      end: monthEnd,
    })
    .getRawMany();

  // Return response
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
    reposicionesMes: reposicionesMes.map((r) => ({
      id: r.orden_id || r.id,
      monto: Number(r.orden_total || r.total),
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

DashboardRouter.get("/valor-costo", async (req: Request, res: Response) => {
  try {
    const user = req.user as Usuario;
    const isAdmin = isSuperAdmin(user);

    // Base query to get inventory value across all almacenes
    const queryBuilder = AppDataSource.getRepository(Stock)
      .createQueryBuilder("stock")
      .leftJoinAndSelect("stock.producto", "producto")
      .leftJoinAndSelect("stock.almacen", "almacen")
      .select([
        "producto.id",
        "producto.nombre",
        "producto.costo",
        "producto.precioInstalador",
        "stock.actual",
        "stock.reservado",
        "stock.transito",
        "stock.rma",
        "almacen.id",
        "almacen.nombre",
      ])
      .where("(stock.actual + stock.transito - stock.reservado) > 0"); // Only products with available stock

    // If not admin, filter by user's almacenes
    if (!isAdmin) {
      const almacenesIds = user.sucursales
        .map((sucursal) => sucursal.almacenes)
        .flat()
        .map((almacen) => almacen.id);

      if (almacenesIds.length === 0) {
        return res.status(200).json({
          totalInventoryValue: 0,
          totalInventoryCost: 0,
          totalItems: 0,
          breakdownByAlmacen: [],
          breakdownByProduct: [],
        });
      }

      queryBuilder.andWhere("almacen.id IN (:...almacenesIds)", {
        almacenesIds,
      });
    }

    const inventoryData = await queryBuilder.getMany();

    // Calculate total inventory value and cost
    let totalInventoryValue = 0;
    let totalInventoryCost = 0;
    let totalItems = 0;
    const breakdownByAlmacen: {
      [key: string]: {
        nombre: string;
        valor: number;
        costo: number;
        items: number;
        margen: number;
      };
    } = {};
    const breakdownByProduct: {
      [key: string]: {
        nombre: string;
        valor: number;
        costo: number;
        cantidad: number;
        margen: number;
      };
    } = {};

    inventoryData.forEach((stock) => {
      const availableStock = calcularStockDisponible(stock);
      const productCost = (stock.producto.costo || 0) * availableStock;
      const productValue =
        (stock.producto.precioInstalador || 0) * availableStock;

      totalInventoryValue += productValue;
      totalInventoryCost += productCost;
      totalItems += availableStock;

      // Breakdown by almacen
      const almacenId = stock.almacen.id;
      if (!breakdownByAlmacen[almacenId]) {
        breakdownByAlmacen[almacenId] = {
          nombre: stock.almacen.nombre,
          valor: 0,
          costo: 0,
          items: 0,
          margen: 0,
        };
      }
      breakdownByAlmacen[almacenId].valor += productValue;
      breakdownByAlmacen[almacenId].costo += productCost;
      breakdownByAlmacen[almacenId].items += availableStock;

      // Breakdown by product
      const productoId = stock.producto.id;
      if (!breakdownByProduct[productoId]) {
        breakdownByProduct[productoId] = {
          nombre: stock.producto.nombre,
          valor: 0,
          costo: 0,
          cantidad: 0,
          margen: 0,
        };
      }
      breakdownByProduct[productoId].valor += productValue;
      breakdownByProduct[productoId].costo += productCost;
      breakdownByProduct[productoId].cantidad += availableStock;
    });

    // Calculate margins for breakdowns
    Object.values(breakdownByAlmacen).forEach((almacen) => {
      almacen.margen =
        almacen.costo > 0
          ? ((almacen.valor - almacen.costo) / almacen.costo) * 100
          : 0;
    });

    Object.values(breakdownByProduct).forEach((product) => {
      product.margen =
        product.costo > 0
          ? ((product.valor - product.costo) / product.costo) * 100
          : 0;
    });

    return res.status(200).json({
      totalInventoryValue,
      totalInventoryCost,
      totalItems,
      totalMargin:
        totalInventoryCost > 0
          ? ((totalInventoryValue - totalInventoryCost) / totalInventoryCost) *
            100
          : 0,
      breakdownByAlmacen: Object.values(breakdownByAlmacen),
      breakdownByProduct: Object.values(breakdownByProduct),
    });
  } catch (error: any) {
    console.error("Error calculating inventory value:", error);
    return res.status(500).json({ error: error.message });
  }
});

export { DashboardRouter };
// =============================
// Se modificó el endpoint /dashboard/charts para calcular y devolver la suma de los montos
// de las órdenes de reposición del mes (reposicionesMes), permitiendo que el frontend muestre
// esta métrica en el dashboard.
// =============================
