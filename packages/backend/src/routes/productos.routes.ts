import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import { Producto } from "../orm/entity/producto";
import { verificarPrivilegio } from "../helpers/privilegios.helpers";
import { Acciones } from "shared/enums";
import slugify from "slugify";
import { Usuario } from "../orm/entity/usuario";
import { Archivo } from "../orm/entity/archivo";
import { Stock } from "../orm/entity/stock";
import { Dimension } from "../orm/entity/dimension";
import { IArchivo } from "shared/interfaces";
import { isSuperAdmin } from "shared/helpers";

const ProductosRouter: Router = Router();

// GET - Listar Productos
ProductosRouter.get(
  "/",
  verificarPrivilegio({
    entidad: Producto.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      const isAdmin = isSuperAdmin(user);

      const { page = "1", limit = "10", term, categoria, enOferta } = req.query;

      const queryBuilder = AppDataSource.getRepository(Producto)
        .createQueryBuilder("producto")
        .select([
          "producto.id",
          "producto.nombre",
          "producto.modelo",
          "producto.sku",
          "producto.slug",
          "producto.activo",
          "producto.descripcion",
          "producto.garantia",
          "producto.precio",
          "producto.enOferta",
          "producto.precioOferta",
          "producto.inicioOferta",
          "producto.finOferta",
          ...(isAdmin ? ["producto.costo"] : []),
        ])
        .leftJoin("producto.portada", "portada")
        .addSelect(["portada.id", "portada.url"])
        .leftJoin("producto.categoria", "categoria")
        .addSelect(["categoria.id", "categoria.nombre"])
        .leftJoin("producto.subcategoria", "subcategoria")
        .addSelect(["subcategoria.id", "subcategoria.nombre"])
        .where("producto.activo = :activo", { activo: true });

      // Add enOferta condition
      if (enOferta === "true") {
        queryBuilder.andWhere("precios.enOferta = :enOferta", {
          enOferta: true,
        });
        queryBuilder.andWhere("precios.inicioOferta <= :fechaActual", {
          fechaActual: new Date(),
        });
        // si finOferta es null, se considera que el precio está en oferta permanente
        queryBuilder.andWhere(
          "(precios.finOferta >= :fechaActual OR precios.finOferta IS NULL)",
          {
            fechaActual: new Date(),
          }
        );
      }

      // Add search condition if term is provided
      if (term) {
        queryBuilder.andWhere(
          "(LOWER(producto.nombre) LIKE LOWER(:term) OR LOWER(producto.modelo) LIKE LOWER(:term) OR LOWER(producto.sku) LIKE LOWER(:term))",
          { term: `%${term}%` }
        );
      }

      // Add categoria condition
      if (categoria) {
        queryBuilder.andWhere("categoria.id = :categoriaId", {
          categoriaId: categoria as string,
        });
      }

      const [productos, total] = await queryBuilder
        .orderBy("producto.sku", "ASC")
        .take(parseInt(limit as string))
        .skip((parseInt(page as string) - 1) * parseInt(limit as string))
        .getManyAndCount();

      res.status(200).json({
        productos,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pageCount: Math.ceil(total / (parseInt(limit as string) || 1)),
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// GET - Producto por ID
ProductosRouter.get(
  "/:idProducto",
  verificarPrivilegio({
    entidad: Producto.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { idProducto } = req.params;
      if (!idProducto) throw new Error("Parametros inválidos");

      const user = req.user as Usuario;
      const isAdmin = isSuperAdmin(user);

      // Query user's almacenes
      const userAlmacenes = await AppDataSource.getRepository(Usuario)
        .createQueryBuilder("usuario")
        .leftJoinAndSelect("usuario.sucursales", "sucursales")
        .leftJoinAndSelect("sucursales.almacenes", "almacenes")
        .where("usuario.id = :userId", { userId: user.id })
        .getOne();

      const almacenIds =
        userAlmacenes?.sucursales?.flatMap((sucursal) =>
          sucursal.almacenes.map((almacen) => almacen.id)
        ) || [];

      // Get base producto with basic relations
      const productoQuery = AppDataSource.getRepository(Producto)
        .createQueryBuilder("producto")
        .select([
          "producto.id",
          "producto.nombre",
          "producto.modelo",
          "producto.sku",
          "producto.slug",
          "producto.activo",
          "producto.descripcion",
          "producto.garantia",
          ...(isAdmin ? ["producto.costo"] : []),
        ])
        .leftJoinAndSelect("producto.dimensiones", "dimensiones")
        .leftJoinAndSelect("producto.embalaje", "embalaje")
        .leftJoinAndSelect("producto.portada", "portada")
        .leftJoinAndSelect("producto.categoria", "categoria")
        .leftJoinAndSelect("producto.subcategoria", "subcategoria")
        .leftJoinAndSelect("producto.galeria", "galeria")
        .where("producto.id = :idProducto", { idProducto });

      const producto = await productoQuery.getOne();
      if (!producto) throw new Error("Producto no existe");

      // Get stock for user's almacenes
      const stockQuery = AppDataSource.getRepository(Stock)
        .createQueryBuilder("stock")
        .leftJoinAndSelect("stock.almacen", "almacen")
        .where("stock.producto = :productoId", { productoId: producto.id });

      if (!isAdmin && almacenIds.length > 0) {
        stockQuery.andWhere("stock.almacen IN (:...almacenIds)", {
          almacenIds,
        });
      }

      const stock = await stockQuery.getMany();

      // Combine the results
      const result = {
        ...producto,
        stock,
      };

      if (!isAdmin) {
        result.costo = 0;
      }

      res.status(200).json({ producto: result });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// POST - Crear Producto
ProductosRouter.post(
  "/",
  verificarPrivilegio({
    entidad: Producto.name,
    accion: Acciones.crear,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const data = req.body.producto as Producto;
      const _producto = new Producto();
      _producto.nombre = data.nombre;
      _producto.modelo = data.modelo;
      _producto.descripcion = data.descripcion;
      _producto.sku = data.sku;
      _producto.categoria = data.categoria;
      _producto.subcategoria = data.subcategoria;
      _producto.costo = data.costo;
      _producto.garantia = data.garantia;

      _producto.slug = slugify(`${data.nombre} ${data.modelo} ${data.sku}`, {
        lower: true,
        strict: true,
        replacement: "-",
        trim: true,
      });

      // First save the producto to get its ID
      const savedProducto = await AppDataSource.getRepository(Producto).save(
        _producto
      );

      res.status(200).json(savedProducto);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT - Actualizar Producto
ProductosRouter.put(
  "/:productoId",
  verificarPrivilegio({
    entidad: Producto.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { productoId } = req.params;
      if (!productoId) throw new Error("Parametros inválidos");

      const data = req.body.producto as Producto;

      // Only exclude metadata fields and certain relations
      const {
        id,
        fechaCreado,
        fechaActualizado,
        fechaEliminado,
        portada,
        galeria,
        stock,
        ...updateData
      } = data;

      // Create update object with safe category/subcategory handling
      const updateObj = {
        ...updateData,
        slug: slugify(`${data.nombre} ${data.modelo} ${data.sku}`, {
          lower: true,
          strict: true,
          replacement: "-",
          trim: true,
        }),
        // Only include category/subcategory if they exist and have an id
        ...(data.categoria?.id && { categoria: { id: data.categoria.id } }),
        ...(data.subcategoria?.id && {
          subcategoria: { id: data.subcategoria.id },
        }),
      };

      await AppDataSource.getRepository(Producto).update(id, updateObj);

      const target = await AppDataSource.getRepository(Producto).findOne({
        where: { id: productoId },
        relations: ["dimensiones", "embalaje"],
      });
      if (!target) throw new Error("Producto no existe");

      // Update one-to-one relations if they exist
      if (data.dimensiones) {
        if (target.dimensiones) {
          // Update existing dimensiones
          await AppDataSource.getRepository(Dimension).update(
            target.dimensiones.id,
            {
              ...data.dimensiones,
              id: target.dimensiones.id,
            }
          );
        } else {
          // Create new dimensiones
          const newDimensiones = await AppDataSource.getRepository(
            Dimension
          ).save(data.dimensiones);
          target.dimensiones = newDimensiones;
        }
      }

      if (data.embalaje) {
        if (target.embalaje) {
          // Update existing embalaje
          await AppDataSource.getRepository(Dimension).update(
            target.embalaje.id,
            {
              ...data.embalaje,
              id: target.embalaje.id,
            }
          );
        } else {
          // Create new embalaje
          const newEmbalaje = await AppDataSource.getRepository(Dimension).save(
            data.embalaje
          );
          target.embalaje = newEmbalaje;
        }
      }

      // Save the target with updated relations
      await AppDataSource.getRepository(Producto).save(target);

      res.status(200).json({ message: "Producto actualizado exitosamente" });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// POST - Agregar Imagen a Galeria
ProductosRouter.post(
  "/:productoId/galeria",
  verificarPrivilegio({
    entidad: Producto.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { productoId } = req.params;
      const { archivo, isPortada } = req.body;
      if (!productoId) throw new Error("Parametros inválidos");

      // Cargar el producto con su galería existente
      const target = await AppDataSource.getRepository(Producto).findOne({
        where: { id: productoId },
        relations: ["galeria", "portada"], // Cargar las relaciones
      });
      if (!target) throw new Error("Producto no existe");

      // crear el nuevo archivo
      if (!archivo) throw new Error("Archivo inválido");

      const newArchivo = new Archivo();
      newArchivo.nombre = archivo.nombre;
      newArchivo.tipo = archivo.tipo;
      newArchivo.estatus = archivo.estatus;

      const { AWS_ENDPOINT, AWS_BUCKET } = process.env;
      newArchivo.url = `${AWS_ENDPOINT}/${AWS_BUCKET}/${archivo.url}`;

      const saved = await AppDataSource.getRepository(Archivo).save(newArchivo);

      // Update producto with the new file
      if (isPortada) {
        target.portada = saved;
      } else {
        // Mantener los archivos existentes y agregar el nuevo
        target.galeria = [...(target.galeria || []), saved];
      }
      await AppDataSource.getRepository(Producto).save(target);

      res.status(200).json(saved);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// DELETE - Eliminar Imagen de Galeria
ProductosRouter.delete(
  "/:productoId/galeria/:archivoId",
  verificarPrivilegio({
    entidad: Producto.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { productoId, archivoId } = req.params;
      if (!productoId || !archivoId) throw new Error("Parametros inválidos");

      // Cargar el producto con sus relaciones
      const producto = await AppDataSource.getRepository(Producto).findOne({
        where: { id: productoId },
        relations: ["portada", "galeria"],
      });
      if (!producto) throw new Error("Producto no existe");

      // Verificar si es la portada o un item de la galería
      if (producto.portada?.id === archivoId) {
        producto.portada = null as unknown as Archivo;
        await AppDataSource.getRepository(Producto).save(producto);
      } else {
        producto.galeria = producto.galeria.filter(
          (archivo) => archivo.id !== archivoId
        );
        await AppDataSource.getRepository(Producto).save(producto);
      }

      // Una vez removida la referencia, eliminar el archivo
      const archivo = await AppDataSource.getRepository(Archivo).findOne({
        where: { id: archivoId },
      });
      if (archivo) {
        await AppDataSource.getRepository(Archivo).remove(archivo);
      }

      res.status(200).json({ message: "Archivo eliminado" });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT - Actualizar Stock
ProductosRouter.put(
  "/:productoId/stock/:almacenId",
  verificarPrivilegio({
    entidad: Producto.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { productoId, almacenId } = req.params;
      const { stock } = req.body;

      if (!productoId || !almacenId) throw new Error("Parametros inválidos");

      const stockItem = await AppDataSource.getRepository(Stock)
        .createQueryBuilder("stock")
        .where("stock.producto = :productoId", { productoId })
        .andWhere("stock.almacen = :almacenId", { almacenId })
        .getOne();

      if (stockItem) {
        await AppDataSource.getRepository(Stock).update(stockItem.id, stock);
      } else {
        await AppDataSource.getRepository(Stock).save({
          ...stock,
          producto: { id: productoId },
          almacen: { id: almacenId },
        });
      }

      res.status(200).json({ message: "Stock actualizado" });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// GET - Stock por Producto por almacen
ProductosRouter.get(
  "/:productoId/stock/:almacenId",
  verificarPrivilegio({
    entidad: Producto.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { productoId, almacenId } = req.params;
      const stock = await AppDataSource.getRepository(Stock)
        .createQueryBuilder("stock")
        .leftJoinAndSelect("stock.almacen", "almacen")
        .leftJoinAndSelect("stock.producto", "producto")
        .where("producto.id = :productoId", { productoId })
        .andWhere("almacen.id = :almacenId", { almacenId })
        .getOne();

      if (!stock) {
        return res.status(404).json({ message: "Stock no encontrado" });
      }

      res.status(200).json({ stock });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT - Actualizar Portada
ProductosRouter.put(
  "/:productoId/portada",
  verificarPrivilegio({
    entidad: Producto.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { productoId } = req.params;
      const data = req.body.archivo as IArchivo;
      if (!productoId) throw new Error("Parametros inválidos");

      const archivo = new Archivo();
      archivo.nombre = data.nombre;
      archivo.tipo = data.tipo;
      archivo.estatus = data.estatus;
      archivo.url = data.url || "";

      const saved = await AppDataSource.getRepository(Archivo).save(archivo);

      await AppDataSource.getRepository(Producto).update(productoId, {
        portada: saved,
      });

      res.status(200).json({ message: "Portada actualizada" });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// DELETE - Eliminar Portada
ProductosRouter.delete(
  "/:productoId/portada/:archivoId",
  verificarPrivilegio({
    entidad: Producto.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { productoId, archivoId } = req.params;

      // Primero eliminar la referencia en el producto
      await AppDataSource.getRepository(Producto).update(productoId, {
        portada: null as unknown as Archivo,
      });

      // Luego eliminar el archivo
      await AppDataSource.getRepository(Archivo).delete(archivoId);

      res.status(200).json({ message: "Portada eliminada" });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

export { ProductosRouter };
