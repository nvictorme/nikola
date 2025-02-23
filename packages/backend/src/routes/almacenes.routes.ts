import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import { Almacen } from "../orm/entity/almacen";
import { verificarPrivilegio } from "../helpers/privilegios.helpers";
import { Acciones } from "shared/enums";
import { Paises } from "shared/enums";
import { Usuario } from "../orm/entity/usuario";
import { calcularStockDisponible, isSuperAdmin, IStockProducto } from "shared";
import { Sucursal } from "../orm/entity/sucursal";
import { redis } from "../providers/redis";

const AlmacenesRouter: Router = Router();

// listar todos los almacenes
AlmacenesRouter.get(
  "/",
  verificarPrivilegio({
    entidad: Almacen.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { page = "1", limit = "10", pais } = req.query;
      const pageNumber = parseInt(page as string);
      const limitNumber = parseInt(limit as string);

      const queryBuilder = AppDataSource.getRepository(Almacen)
        .createQueryBuilder("almacen")
        .leftJoinAndSelect("almacen.pais", "pais")
        .leftJoinAndSelect("almacen.direccion", "direccion")
        .orderBy("pais.nombre", "ASC")
        .addOrderBy("almacen.nombre", "ASC")
        .take(limitNumber)
        .skip((pageNumber - 1) * limitNumber);

      if (pais) {
        queryBuilder.where("pais.id = :pais", { pais });
      }

      const [almacenes, total] = await queryBuilder.getManyAndCount();

      res.status(200).json({
        almacenes,
        total,
        page: pageNumber,
        pageCount: Math.ceil(total / limitNumber || 1),
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// crear almacen
AlmacenesRouter.post(
  "/",
  verificarPrivilegio({
    entidad: Almacen.name,
    accion: Acciones.crear,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const data = req.body.almacen as Almacen;

      await AppDataSource.manager.transaction(
        async (transactionalEntityManager) => {
          // Si hay dirección, guardarla primero
          let direccion;
          if (data.direccion) {
            direccion = await transactionalEntityManager.save(
              "Direccion",
              data.direccion
            );
          }

          // crear un nuevo almacen
          const almacen = await transactionalEntityManager.save(Almacen, {
            nombre: data.nombre,
            pais: data.pais, // This should be { id: paisId }
            direccion: direccion || undefined,
          });

          // responder con el almacen creado
          res.status(201).json(almacen);
        }
      );
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// actualizar almacen
AlmacenesRouter.put(
  "/:id",
  verificarPrivilegio({
    entidad: Almacen.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const data = req.body.almacen as Almacen;

      await AppDataSource.manager.transaction(
        async (transactionalEntityManager) => {
          // Si hay dirección, actualizarla o crearla primero
          if (data.direccion) {
            if (data.direccion.id) {
              // Actualizar dirección existente
              await transactionalEntityManager.update(
                "Direccion",
                data.direccion.id,
                data.direccion
              );
            } else {
              // Crear nueva dirección
              const nuevaDireccion = await transactionalEntityManager.save(
                "Direccion",
                data.direccion
              );
              data.direccion = nuevaDireccion;
            }
          }

          // Preparar los datos para actualizar
          const updateData = {
            nombre: data.nombre,
            pais: data.pais,
            direccion: data.direccion,
          };

          // Actualizar el almacen
          await transactionalEntityManager.update(
            Almacen,
            req.params.id,
            updateData
          );

          const updatedWarehouse = await transactionalEntityManager.findOne(
            Almacen,
            {
              where: { id: req.params.id },
              relations: ["pais", "direccion"],
            }
          );

          res.status(200).json({ almacen: updatedWarehouse });
        }
      );
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// GET - Almacenes donde el producto tiene stock disponible
AlmacenesRouter.get(
  "/producto/:productoId",
  verificarPrivilegio({
    entidad: Almacen.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { productoId } = req.params;
      const user = req.user as Usuario;
      const cacheKey = `almacenes:producto:${productoId}:user:${user.id}`;

      // Check Redis cache
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        return res.status(200).json({ almacenes: JSON.parse(cachedResult) });
      }

      const isAdmin = isSuperAdmin(user);

      // Base query for regular almacenes
      const queryBuilder = AppDataSource.getRepository(Almacen)
        .createQueryBuilder("almacen")
        .leftJoinAndSelect("almacen.pais", "pais")
        .innerJoin(
          "producto_stock",
          "stock",
          "stock.almacenId = almacen.id AND stock.productoId = :productoId",
          { productoId }
        )
        .addSelect([
          "stock.actual",
          "stock.reservado",
          "stock.transito",
          "stock.rma",
        ])
        .where("almacen.nombre NOT IN (:...specialNames)", {
          specialNames: [Paises.panama, Paises.china],
        })
        .andWhere("(stock.actual + stock.transito - stock.reservado) > 0");

      // If not admin, filter by user's almacenes
      if (!isAdmin) {
        const almacenesIds = user.sucursales
          .map((sucursal) => sucursal.almacenes)
          .flat()
          .map((almacen) => almacen.id);

        queryBuilder.andWhere("almacen.id IN (:...almacenesIds)", {
          almacenesIds,
        });
      }

      const almacenes = await queryBuilder.getMany();
      const rawResults = await queryBuilder
        .select([
          "almacen",
          "pais",
          "stock.actual as actual",
          "stock.reservado as reservado",
          "stock.transito as transito",
          "stock.rma as rma",
        ])
        .getRawMany();

      // Combine results
      const result = almacenes.map((almacen, index) => ({
        ...almacen,
        stock: {
          actual: rawResults[index].actual,
          reservado: rawResults[index].reservado,
          transito: rawResults[index].transito,
          rma: rawResults[index].rma,
        },
      }));

      // Function to get special almacen (Panama or China)
      const getSpecialAlmacen = async (nombre: string) => {
        // First, find the almacen ID
        const almacenBase = await AppDataSource.getRepository(Almacen)
          .createQueryBuilder("almacen")
          .leftJoinAndSelect("almacen.pais", "pais")
          .where("almacen.nombre = :nombre", { nombre })
          .getOne();

        if (!almacenBase) {
          console.log(`Special almacen ${nombre} not found`);
          return null;
        }

        // Then get the stock information
        const stockInfo = await AppDataSource.createQueryBuilder()
          .select([
            "stock.actual as actual",
            "stock.reservado as reservado",
            "stock.transito as transito",
            "stock.rma as rma",
          ])
          .from("producto_stock", "stock")
          .where("stock.almacenId = :almacenId", { almacenId: almacenBase.id })
          .andWhere("stock.productoId = :productoId", { productoId })
          .getRawOne();

        console.log(`Stock info for ${nombre}:`, stockInfo);

        if (!stockInfo) {
          console.log(`No stock found for ${nombre}`);
          return null;
        }

        const stock = {
          actual: stockInfo.actual || 0,
          reservado: stockInfo.reservado || 0,
          transito: stockInfo.transito || 0,
          rma: stockInfo.rma || 0,
        };

        console.log(`Processed stock for ${nombre}:`, stock);
        console.log(
          `Stock disponible calculation:`,
          calcularStockDisponible(stock as IStockProducto)
        );

        // Return the almacen if there's any stock (including transit)
        if (
          stock.actual > 0 ||
          stock.transito > 0 ||
          calcularStockDisponible(stock as IStockProducto) > 0
        ) {
          return { ...almacenBase, stock };
        }

        return null;
      };

      // Add special almacenes if they have disponible stock
      const [panamaSummary, chinaSummary] = await Promise.all([
        getSpecialAlmacen(Paises.panama),
        getSpecialAlmacen(Paises.china),
      ]);

      if (panamaSummary) result.push(panamaSummary);
      if (chinaSummary) result.push(chinaSummary);

      // Cache the result in Redis for 60 seconds
      await redis.set(cacheKey, JSON.stringify(result), "EX", 60);
      res.status(200).json({ almacenes: result });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// GET - Almacenes donde la sucursal tiene stock disponible del producto en sus almacenes
AlmacenesRouter.get(
  "/sucursal/:sucursalId/producto/:productoId",
  verificarPrivilegio({
    entidad: Almacen.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { sucursalId, productoId } = req.params;
      const cacheKey = `almacenes:sucursal:${sucursalId}:producto:${productoId}`;

      // Check Redis cache
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        return res.status(200).json({ almacenes: JSON.parse(cachedResult) });
      }

      // Find the sucursal first
      const sucursal = await AppDataSource.getRepository(Sucursal).findOne({
        where: { id: sucursalId },
      });
      if (!sucursal) {
        return res.status(404).json({ error: "Sucursal no encontrada" });
      }

      const almacenesIds = sucursal.almacenes.map((almacen) => almacen.id);
      if (almacenesIds.length === 0) {
        return res.status(200).json({ almacenes: [] });
      }

      const queryBuilder = AppDataSource.getRepository(Almacen)
        .createQueryBuilder("almacen")
        .leftJoinAndSelect("almacen.pais", "pais")
        .innerJoin(
          "producto_stock",
          "stock",
          "stock.almacenId = almacen.id AND stock.productoId = :productoId",
          { productoId }
        )
        .addSelect([
          "stock.actual",
          "stock.reservado",
          "stock.transito",
          "stock.rma",
        ])
        .where("almacen.id IN (:...almacenesIds)", { almacenesIds })
        .andWhere("(stock.actual + stock.transito - stock.reservado) > 0");

      const almacenes = await queryBuilder.getMany();
      const rawResults = await queryBuilder
        .select([
          "almacen",
          "pais",
          "stock.actual as actual",
          "stock.reservado as reservado",
          "stock.transito as transito",
          "stock.rma as rma",
        ])
        .getRawMany();

      // Combine results with stock information
      const result = almacenes.map((almacen, index) => ({
        ...almacen,
        stock: {
          actual: rawResults[index].actual,
          reservado: rawResults[index].reservado,
          transito: rawResults[index].transito,
          rma: rawResults[index].rma,
        },
      }));

      // Function to get special almacen (Panama or China)
      const getSpecialAlmacen = async (nombre: string) => {
        // First, find the almacen ID
        const almacenBase = await AppDataSource.getRepository(Almacen)
          .createQueryBuilder("almacen")
          .leftJoinAndSelect("almacen.pais", "pais")
          .where("almacen.nombre = :nombre", { nombre })
          .getOne();

        if (!almacenBase) {
          console.log(`Special almacen ${nombre} not found`);
          return null;
        }

        // Then get the stock information
        const stockInfo = await AppDataSource.createQueryBuilder()
          .select([
            "stock.actual as actual",
            "stock.reservado as reservado",
            "stock.transito as transito",
            "stock.rma as rma",
          ])
          .from("producto_stock", "stock")
          .where("stock.almacenId = :almacenId", { almacenId: almacenBase.id })
          .andWhere("stock.productoId = :productoId", { productoId })
          .getRawOne();

        console.log(`Stock info for ${nombre}:`, stockInfo);

        if (!stockInfo) {
          console.log(`No stock found for ${nombre}`);
          return null;
        }

        const stock = {
          actual: stockInfo.actual || 0,
          reservado: stockInfo.reservado || 0,
          transito: stockInfo.transito || 0,
          rma: stockInfo.rma || 0,
        };

        console.log(`Processed stock for ${nombre}:`, stock);
        console.log(
          `Stock disponible calculation:`,
          calcularStockDisponible(stock as IStockProducto)
        );

        // Return the almacen if there's any stock (including transit)
        if (
          stock.actual > 0 ||
          stock.transito > 0 ||
          calcularStockDisponible(stock as IStockProducto) > 0
        ) {
          return { ...almacenBase, stock };
        }

        return null;
      };

      // Add special almacenes if they have disponible stock
      const [panamaSummary, chinaSummary] = await Promise.all([
        getSpecialAlmacen(Paises.panama),
        getSpecialAlmacen(Paises.china),
      ]);

      if (panamaSummary) result.push(panamaSummary);
      if (chinaSummary) result.push(chinaSummary);

      // Cache the result in Redis for 60 seconds
      await redis.set(cacheKey, JSON.stringify(result), "EX", 60);
      res.status(200).json({ almacenes: result });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

export { AlmacenesRouter };
