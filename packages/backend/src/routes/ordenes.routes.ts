import { Request, Response, Router } from "express";
import { AppDataSource } from "../orm/data-source";
import { Orden } from "../orm/entity/orden";
import { ItemOrden } from "../orm/entity/itemOrden";
import { verificarPrivilegio } from "../helpers/privilegios.helpers";
import {
  Acciones,
  EstatusOrden,
  RolesBase,
  TipoOrden,
  TipoTransaccion,
  UnidadesLongitud,
  UnidadesPeso,
  TipoCambio,
} from "shared/enums";
import { Usuario } from "../orm/entity/usuario";
import { Archivo } from "../orm/entity/archivo";
import { sendEmail } from "../providers/email";
import { currencyFormat, isSuperAdmin } from "shared/helpers";
import { Producto } from "../orm/entity/producto";
import { partition } from "lodash";
import slugify from "slugify";
import { Dimension } from "../orm/entity/dimension";
import { Transaccion } from "../orm/entity/transaccion";
import { processTransaction } from "./transacciones.routes";
import { Stock } from "../orm/entity/stock";
import { Envio } from "../orm/entity/envio";
import { HistorialOrden } from "../orm/entity/historial";
import { emitSocketEvent } from "../providers/sockets";
const OrdenesRouter: Router = Router();

// Get - Todas las ordenes
OrdenesRouter.get(
  "/",
  verificarPrivilegio({
    entidad: Orden.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      const isAdmin = isSuperAdmin(user);

      const { page = "1", limit = "10", term, tipo, estatus } = req.query;

      const query = AppDataSource.getRepository(Orden)
        .createQueryBuilder("orden")
        .distinct(true)
        .select("orden") // Select only the orden entity
        .leftJoinAndSelect("orden.sucursal", "sucursal")
        .leftJoinAndSelect("orden.vendedor", "vendedor")
        .leftJoinAndSelect("orden.cliente", "cliente")
        .leftJoinAndSelect("orden.proveedor", "proveedor")
        .leftJoinAndSelect("orden.archivos", "ordenArchivos")
        .leftJoinAndSelect("orden.items", "items")
        .leftJoinAndSelect("items.producto", "producto")
        .leftJoinAndSelect("items.almacen", "almacen");

      if (!isAdmin) {
        query.andWhere("vendedor.id = :idVendedor", { idVendedor: user.id });
      }

      if (term) {
        // Build an array of OR conditions
        const orConditions = [
          "CAST(orden.serial AS TEXT) ILIKE :term",
          "cliente.nif ILIKE :term",
          "cliente.empresa ILIKE :term",
          "cliente.nombre ILIKE :term",
          "cliente.apellido ILIKE :term",
          'EXISTS (SELECT 1 FROM ordenes_items oi INNER JOIN productos p ON p.id = oi."productoId" WHERE oi."ordenId" = orden.id AND (p.nombre ILIKE :term OR p.sku ILIKE :term))',
        ];
        // Combine conditions with OR
        query.andWhere(`(${orConditions.join(" OR ")})`, { term: `%${term}%` });
      }

      if (tipo) {
        query.andWhere("orden.tipo = :tipo", { tipo });
      }

      if (estatus) {
        query.andWhere("orden.estatus = :estatus", {
          estatus: estatus as EstatusOrden,
        });
      }

      // Get total count using a subquery to ensure accurate counting with distinct
      const total = await query.getCount();

      // Get paginated results
      const ordenes = await query
        .orderBy("orden.fechaCreado", "DESC")
        .skip((parseInt(page as string) - 1) * parseInt(limit as string))
        .take(parseInt(limit as string))
        .getMany();

      res.status(200).json({
        ordenes,
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

// GET - Orden by id
OrdenesRouter.get(
  "/:ordenId",
  verificarPrivilegio({
    entidad: Orden.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { ordenId } = req.params;
      const orden = await AppDataSource.getRepository(Orden).findOne({
        where: { id: ordenId },
        relations: [
          "sucursal",
          "vendedor",
          "cliente",
          "proveedor",
          "archivos",
          "items",
          "items.producto",
          "items.almacen",
        ],
      });
      if (!orden) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }
      res.status(200).json(orden);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// GET - Historial de orden
OrdenesRouter.get(
  "/:ordenId/historial",
  verificarPrivilegio({
    entidad: Orden.name,
    accion: Acciones.leer,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { ordenId } = req.params;
      const historial = await AppDataSource.getRepository(HistorialOrden).find({
        where: { orden: { id: ordenId } },
        relations: ["usuario", "envio"],
        select: {
          id: true,
          fechaCreado: true,
          estatus: true,
          usuario: {
            nombre: true,
            apellido: true,
          },
          envio: {
            transportista: true,
            tracking: true,
            notas: true,
          },
        },
        order: { fechaCreado: "DESC" },
      });
      res.status(200).json(historial);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// Add this helper function before the routes
async function handleCustomProducts(orden: Orden): Promise<void> {
  const [customItems, otherItems] = partition(
    orden.items,
    (item) => item.producto.sku === "ZZ"
  );

  if (customItems.length === 0) return;

  const productoRepo = AppDataSource.getRepository(Producto);

  const newProducts = [] as Producto[];
  const newDimensiones = [] as Dimension[];
  const newEmbalajes = [] as Dimension[];

  for (let i = 0; i < customItems.length; i++) {
    const item = customItems[i];
    const itemIndex = orden.items.findIndex(
      (orderItem) => orderItem.id === item.id
    );
    const newSku = `ZZ-${orden.serial}-${itemIndex + 1}`;

    // Create new product with specific properties
    const newProduct = new Producto();
    newProduct.id = crypto.randomUUID();
    newProduct.nombre = item.producto.nombre;
    newProduct.descripcion = item.producto.descripcion;
    newProduct.modelo = item.producto.modelo;
    newProduct.slug = slugify(
      `${item.producto.nombre} ${item.producto.modelo} ${newSku}`,
      {
        lower: true,
        strict: true,
        replacement: "-",
        trim: true,
      }
    );
    newProduct.sku = newSku;
    newProduct.costo = 0;
    newProduct.activo = true;
    newProduct.garantia = item.producto.garantia;
    newProduct.categoria = item.producto.categoria;
    newProduct.subcategoria = item.producto.subcategoria;

    // Dimensiones de producto
    const newDimension = new Dimension();
    newDimension.id = crypto.randomUUID();
    newDimension.alto = 0;
    newDimension.ancho = 0;
    newDimension.largo = 0;
    newDimension.peso = 0;
    newDimension.unidadLongitud = UnidadesLongitud.cm;
    newDimension.unidadPeso = UnidadesPeso.kg;
    newDimensiones.push(newDimension);

    // Dimensiones de embalaje
    const newEmbalaje = new Dimension();
    newEmbalaje.id = crypto.randomUUID();
    newEmbalaje.alto = 0;
    newEmbalaje.ancho = 0;
    newEmbalaje.largo = 0;
    newEmbalaje.peso = 0;
    newEmbalaje.unidadLongitud = UnidadesLongitud.cm;
    newEmbalaje.unidadPeso = UnidadesPeso.kg;
    newEmbalajes.push(newEmbalaje);

    newProduct.dimensiones = newDimension;
    newProduct.embalaje = newEmbalaje;

    newProducts.push(newProduct);
    // Update the item to use the new product
    item.producto = newProduct;
  }

  // Las relaciones 1:1 se guardan antes que la entidad padre
  // Save the new dimensiones
  await AppDataSource.getRepository(Dimension).save(newDimensiones, {
    chunk: 500,
  });
  // Save the new embalajes
  await AppDataSource.getRepository(Dimension).save(newEmbalajes, {
    chunk: 500,
  });

  // Save the new products
  await productoRepo.save(newProducts, { chunk: 500 });

  // Save the updated items
  await AppDataSource.getRepository(ItemOrden).save([
    ...otherItems,
    ...customItems,
  ]);
}

// POST - Crear nueva orden
OrdenesRouter.post(
  "/",
  verificarPrivilegio({
    entidad: Orden.name,
    accion: Acciones.crear,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as Usuario;
      const data = req.body.orden as Orden;

      if (!data)
        return res.status(400).json({ error: "Datos de orden requeridos" });

      const newOrden = new Orden();

      // Basic order details
      newOrden.subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
      newOrden.totalLista = data.items.reduce((sum, item) => {
        return sum + item.precio * item.cantidad;
      }, 0);
      newOrden.descuento = data.descuento || 0;
      newOrden.tipoDescuento = data.tipoDescuento;
      newOrden.credito = data.credito || 0;
      newOrden.impuesto = data.impuesto || 0;
      newOrden.impuestoIncluido = data.impuestoIncluido || false;
      newOrden.tasaCambio = data.tasaCambio || 1;
      newOrden.tipoCambio = data.tipoCambio || TipoCambio.usd;

      // Validate provider for reposicion orders
      if (data.tipo === TipoOrden.reposicion && !data.proveedor) {
        return res
          .status(400)
          .json({ error: "Las órdenes de reposición requieren un proveedor" });
      }

      // Calculate total based on subtotal, discount, and tax
      const discountAmount =
        newOrden.tipoDescuento === "Porcentual"
          ? (newOrden.subtotal * newOrden.descuento) / 100
          : newOrden.descuento;

      const subtotalAfterDiscount = newOrden.subtotal - discountAmount;
      const taxAmount = newOrden.impuestoIncluido
        ? 0
        : (subtotalAfterDiscount * newOrden.impuesto) / 100;

      newOrden.total = subtotalAfterDiscount + taxAmount;

      // Order metadata
      newOrden.tipo = data.tipo || TipoOrden.venta;
      newOrden.validez = data.validez;
      newOrden.estatus = EstatusOrden.pendiente;
      newOrden.notas = data.notas;

      // Relationships
      newOrden.cliente = data.cliente;
      newOrden.vendedor = user;
      newOrden.sucursal = data.sucursal;
      newOrden.proveedor = data.proveedor;

      const archivos = [] as Archivo[];
      const { AWS_ENDPOINT, AWS_BUCKET } = process.env;

      // Manejo de archivos de soporte de la orden
      if (data.archivos?.length) {
        data.archivos.forEach((a) => {
          const archivo = new Archivo();
          archivo.nombre = a.nombre;
          archivo.tipo = a.tipo;
          archivo.estatus = a.estatus;
          archivo.url = `${AWS_ENDPOINT}/${AWS_BUCKET}/${a.url}`;
          archivos.push(archivo);
        });
      }

      // Guardar archivos de soporte
      if (archivos.length > 0) {
        await AppDataSource.getRepository(Archivo).save(archivos, {
          chunk: 100,
        });
      }

      // Guardar items de la orden
      const savedItems = await AppDataSource.getRepository(ItemOrden).save(
        data.items.map((item) => ({
          ...item,
          garantia: item.garantia || item.producto.garantia || "Sin garantía",
          serial: item.serial || null,
        })),
        { chunk: 100 }
      );

      newOrden.items = savedItems;
      newOrden.archivos = archivos;

      // Save the complete order
      const savedOrden = await AppDataSource.getRepository(Orden).save(
        newOrden
      );

      // Handle custom products after saving the order
      await handleCustomProducts(savedOrden);

      // Fetch the updated order with new products
      const updatedOrden = await AppDataSource.getRepository(Orden).findOne({
        where: { id: savedOrden.id },
        relations: [
          "sucursal",
          "vendedor",
          "cliente",
          "items",
          "items.producto",
        ],
      });

      res.status(201).json({ orden: updatedOrden });

      // Add a new history record
      const historial = new HistorialOrden();
      historial.estatus = EstatusOrden.pendiente;
      historial.usuario = user;
      historial.orden = savedOrden;
      await AppDataSource.getRepository(HistorialOrden).save(historial);

      // emit socket event to gerentes when a new order is created
      const gerentes = await AppDataSource.getRepository(Usuario).find({
        where: {
          rol: { nombre: RolesBase.gerente },
        },
      });
      gerentes.forEach((gerente) => {
        emitSocketEvent(gerente.id, "nuevaOrden", {
          orden: updatedOrden,
          timestamp: new Date().toISOString(),
        });
      });

      // Email gerentes when a new order is created
      const emailPromises = gerentes.map((gerente) =>
        sendEmail(
          process.env.NO_REPLY_EMAIL_ADDRESS as string,
          gerente.email,
          `Nueva orden #${savedOrden.serial} en sucursal ${savedOrden.sucursal.nombre}`,
          `
            <p>Se ha creado una nueva orden</p>
            <p>Cliente: ${
              savedOrden.cliente?.empresa ||
              `${savedOrden.cliente?.nombre} ${savedOrden.cliente?.apellido}`
            }</p>
            <p>Vendedor: ${
              savedOrden.vendedor?.empresa ||
              `${savedOrden.vendedor?.nombre} ${savedOrden.vendedor?.apellido}`
            }</p>
            <p>Sucursal: ${savedOrden.sucursal.nombre}</p>
            <p>Tipo: ${savedOrden.tipo}</p>
            <p>Total Lista: ${currencyFormat({
              value: savedOrden.totalLista,
            })}</p>
            <p>Fecha: ${new Date(savedOrden.fechaCreado).toLocaleString(
              "es-US",
              { timeZone: "America/New_York" }
            )} (EST)</p>
          `
        )
      );

      await Promise.all(emailPromises);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// POST - Agregar envío a orden
OrdenesRouter.post(
  "/:ordenId/envios",
  verificarPrivilegio({
    entidad: Orden.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { ordenId } = req.params;
      const { envio } = req.body;
      const user = req.user as Usuario;
      const orden = await AppDataSource.getRepository(Orden).findOne({
        where: { id: ordenId },
        relations: ["envios"],
      });

      if (!orden) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }

      const newEnvio = new Envio();
      newEnvio.transportista = envio.transportista;
      newEnvio.tracking = envio.tracking;
      newEnvio.notas = envio.notas;

      const savedEnvio = await AppDataSource.getRepository(Envio).save(
        newEnvio
      );

      orden.envios = [...(orden.envios || []), savedEnvio];
      orden.estatus = EstatusOrden.enviado;
      await AppDataSource.getRepository(Orden).save(orden);

      res.status(201).json({ envio: savedEnvio });

      // Add a new history record
      const historial = new HistorialOrden();
      historial.estatus = EstatusOrden.enviado;
      historial.usuario = user;
      historial.orden = orden;
      historial.envio = savedEnvio;
      await AppDataSource.getRepository(HistorialOrden).save(historial);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT - Convertir cotización en orden
OrdenesRouter.put(
  "/convertir",
  verificarPrivilegio({
    entidad: Orden.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const ordenId = req.body.ordenId as string;
      const repo = AppDataSource.getRepository(Orden);
      const before = await repo.findOne({
        where: { id: ordenId },
      });
      if (!before) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }
      await repo.update(ordenId, { tipo: TipoOrden.venta as TipoOrden });
      res.status(200).json({
        message: `Cotización #${before.serial} convertida en orden`,
      });
      const after = await repo.findOneOrFail({
        where: { id: ordenId },
        relations: ["sucursal", "cliente", "vendedor"],
      });
      // Email gerentes when cotizacion is converted to orden
      const gerentes = await AppDataSource.getRepository(Usuario).find({
        where: {
          rol: { nombre: RolesBase.gerente },
        },
      });
      // const gerentes = [{ email: "nvictor@pm.me" }];
      const emailPromises = gerentes.map((gerente) =>
        sendEmail(
          process.env.NO_REPLY_EMAIL_ADDRESS as string,
          gerente.email,
          `Nueva orden #${after.serial} en ${after.sucursal.nombre}`,
          `
            <p>Se ha creado una nueva orden</p>
            <p>Cliente: ${
              after.cliente?.empresa ||
              `${after.cliente?.nombre} ${after.cliente?.apellido}`
            }</p>
            <p>Vendedor: ${
              after.vendedor?.empresa ||
              `${after.vendedor?.nombre} ${after.vendedor?.apellido}`
            }</p>
            <p>Sucursal: ${after.sucursal.nombre}</p>
            <p>Tipo: ${after.tipo}</p>
            <p>Total Lista: ${currencyFormat({
              value: after.totalLista,
            })}</p>
            <p>Fecha: ${new Date(after.fechaCreado).toLocaleString("es-US", {
              timeZone: "America/New_York",
            })} (EST)</p>
          `
        )
      );

      await Promise.all(emailPromises);
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT - Actualizar orden
OrdenesRouter.put(
  "/:ordenId",
  verificarPrivilegio({
    entidad: Orden.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { ordenId } = req.params;
      const data = req.body.orden as Orden;
      const orden = await AppDataSource.getRepository(Orden).findOne({
        where: { id: ordenId },
        relations: ["items"],
      });
      if (!orden) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }
      if (
        ![
          EstatusOrden.pendiente,
          EstatusOrden.aprobado,
          EstatusOrden.rechazado,
        ].includes(orden.estatus)
      ) {
        return res.status(400).json({
          error: `Ya no se puede editar la orden #${orden.serial}, ya que se encuentra en estatus ${orden.estatus}`,
        });
      }

      // Calculate order totals
      orden.subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
      orden.totalLista = data.items.reduce((sum, item) => {
        return sum + item.precio * item.cantidad;
      }, 0);
      orden.descuento = data.descuento || 0;
      orden.tipoDescuento = data.tipoDescuento;
      orden.credito = data.credito || 0;
      orden.impuesto = data.impuesto || 0;
      orden.impuestoIncluido = data.impuestoIncluido || false;
      orden.tasaCambio = data.tasaCambio || 1;
      orden.tipoCambio = data.tipoCambio || TipoCambio.usd;

      // Calculate final total
      const discountAmount =
        orden.tipoDescuento === "Porcentual"
          ? (orden.subtotal * orden.descuento) / 100
          : orden.descuento;

      const subtotalAfterDiscount = orden.subtotal - discountAmount;
      const taxAmount = orden.impuestoIncluido
        ? 0
        : (subtotalAfterDiscount * orden.impuesto) / 100;

      orden.total = subtotalAfterDiscount + taxAmount;

      // Update order metadata
      orden.tipo = data.tipo;
      orden.validez = data.validez;
      orden.estatus = data.estatus;
      orden.notas = data.notas;

      // Validate provider for reposicion orders
      if (data.tipo === TipoOrden.reposicion && !data.proveedor) {
        return res
          .status(400)
          .json({ error: "Las órdenes de reposición requieren un proveedor" });
      }

      // Update relationships
      orden.cliente = data.cliente;
      orden.sucursal = data.sucursal;
      orden.proveedor = data.proveedor;

      const archivos = [] as Archivo[];
      const archivosToRemove = [] as Archivo[];
      const { AWS_ENDPOINT, AWS_BUCKET } = process.env;

      // Manejo de archivos de soporte de la orden
      const filesToRemove = orden.archivos.filter(
        (a) => !data.archivos?.some((na) => na.id === a.id)
      );
      archivosToRemove.push(...filesToRemove);

      if (data.archivos?.length) {
        const existingFiles = orden.archivos.filter((a) =>
          data.archivos.some((na) => na.id === a.id)
        );

        const newFiles = data.archivos
          .filter((na) => !na.id || !orden.archivos.some((a) => a.id === na.id))
          .map((a) => {
            const archivo = new Archivo();
            archivo.nombre = a.nombre;
            archivo.tipo = a.tipo;
            archivo.estatus = a.estatus;
            archivo.url = a.url.startsWith("http")
              ? a.url
              : `${AWS_ENDPOINT}/${AWS_BUCKET}/${a.url}`;
            return archivo;
          });

        if (newFiles.length > 0) {
          const savedFiles = await AppDataSource.getRepository(Archivo).save(
            newFiles
          );
          orden.archivos = [...existingFiles, ...savedFiles];
        } else {
          orden.archivos = existingFiles;
        }
      }

      // Eliminar items que no están en los nuevos datos mientras se preservan los IDs existentes
      const itemsToRemove = orden.items.filter(
        (i) => !data.items.some((ni) => ni.id === i.id)
      );
      await AppDataSource.getRepository(ItemOrden).remove(itemsToRemove);

      // Actualizar items existentes mientras se preservan sus IDs
      const updatedItems = await Promise.all(
        data.items.map(async (newItem) => {
          const existingItem = orden.items.find((i) => i.id === newItem.id);

          if (existingItem) {
            // Actualizar item existente mientras se preservan su ID
            existingItem.producto = newItem.producto;
            existingItem.cantidad = newItem.cantidad;
            existingItem.precio = newItem.precio;
            existingItem.total = newItem.total;
            existingItem.notas = newItem.notas || "";
            existingItem.almacen = newItem.almacen;
            existingItem.garantia =
              newItem.garantia || newItem.producto.garantia || "Sin garantía";
            existingItem.serial = newItem.serial || null;

            return existingItem;
          } else {
            // Crear nuevo item con su ID original
            const item = new ItemOrden();
            item.id = newItem.id; // Preservar el ID desde el frontend
            item.producto = newItem.producto;
            item.cantidad = newItem.cantidad;
            item.precio = newItem.precio;
            item.total = newItem.total;
            item.notas = newItem.notas || "";
            item.almacen = newItem.almacen;
            item.garantia =
              newItem.garantia || newItem.producto.garantia || "Sin garantía";
            item.serial = newItem.serial || null;

            return item;
          }
        })
      );

      // Guardar todos los items
      const savedItems = await AppDataSource.getRepository(ItemOrden).save(
        updatedItems,
        { chunk: 100 }
      );

      orden.items = savedItems;

      // Guardar la orden completa
      const savedOrden = await AppDataSource.getRepository(Orden).save(orden);

      // Manejar productos personalizados después de guardar la orden
      await handleCustomProducts(savedOrden);

      // Obtener la orden actualizada con todas las relaciones
      const updatedOrden = await AppDataSource.getRepository(Orden).findOne({
        where: { id: savedOrden.id },
        relations: [
          "sucursal",
          "vendedor",
          "cliente",
          "items",
          "items.producto",
        ],
      });

      return res.status(200).json({ orden: updatedOrden });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// PUT - Actualizar estatus de orden
OrdenesRouter.put(
  "/:ordenId/estatus",
  verificarPrivilegio({
    entidad: Orden.name,
    accion: Acciones.actualizar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { ordenId } = req.params;
      const { estatus } = req.body;
      const user = req.user as Usuario;
      const orden = await AppDataSource.getRepository(Orden).findOne({
        where: { id: ordenId },
      });
      if (!orden) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }
      await AppDataSource.getRepository(Orden).update(ordenId, { estatus });
      // Fetch the updated order with all relations
      const updatedOrden = await AppDataSource.getRepository(
        Orden
      ).findOneOrFail({
        where: { id: ordenId },
        relations: [
          "sucursal",
          "vendedor",
          "cliente",
          "items",
          "items.almacen",
          "items.producto",
        ],
      });

      if (
        (updatedOrden.tipo === TipoOrden.venta ||
          updatedOrden.tipo === TipoOrden.credito) &&
        updatedOrden.estatus === EstatusOrden.confirmado
      ) {
        // Insertar transacción de tipo factura
        const transaccion = new Transaccion();
        transaccion.usuario = updatedOrden.vendedor;
        transaccion.monto = updatedOrden.total;
        transaccion.tipo = TipoTransaccion.factura;
        transaccion.descripcion = `Factura de venta #${updatedOrden.serial}`;
        await AppDataSource.manager.transaction(async (manager) => {
          await processTransaction(manager, transaccion);
        });
      }

      res.status(200).json({ message: `Estatus de orden actualizado` });

      // Add a new history record
      const historial = new HistorialOrden();
      historial.estatus = updatedOrden.estatus;
      historial.usuario = user;
      historial.orden = updatedOrden;
      await AppDataSource.getRepository(HistorialOrden).save(historial);

      // After updating the order status, emit socket event to the vendor
      emitSocketEvent(updatedOrden.vendedor.id, "ordenActualizada", {
        orden: updatedOrden,
        timestamp: new Date().toISOString(),
      });

      // aplicar reglas de stock para cada item de la orden si es venta o credito y el estatus es confirmado o entregado
      if (
        [TipoOrden.venta, TipoOrden.credito].includes(updatedOrden.tipo) &&
        [EstatusOrden.confirmado, EstatusOrden.entregado].includes(
          updatedOrden.estatus
        )
      ) {
        updatedOrden.items.forEach(async (item) => {
          const almacen = item.almacen;
          if (almacen) {
            const producto = item.producto;
            const stock = await AppDataSource.getRepository(Stock).findOne({
              where: {
                almacen: { id: almacen.id },
                producto: { id: producto.id },
              },
            });
            if (stock) {
              let payload = {};
              if (updatedOrden.estatus === EstatusOrden.confirmado) {
                // si el estatus es confirmado, se incrementa el stock reservado
                payload = {
                  reservado: stock.reservado + item.cantidad,
                };
              } else if (updatedOrden.estatus === EstatusOrden.entregado) {
                // si el estatus es entregado, se decrementa el stock reservado y el stock actual
                payload = {
                  reservado: stock.reservado - item.cantidad,
                  actual: stock.actual - item.cantidad,
                };
              }
              await AppDataSource.getRepository(Stock).update(
                stock.id,
                payload
              );
            }
          }
        });
      }

      // aplicar reglas de stock para cada item de la orden si es reposicion y el estatus es confirmado o recibido
      if (
        updatedOrden.tipo === TipoOrden.reposicion &&
        [EstatusOrden.confirmado, EstatusOrden.recibido].includes(
          updatedOrden.estatus
        )
      ) {
        updatedOrden.items.forEach(async (item) => {
          const almacen = item.almacen;
          if (almacen) {
            const producto = item.producto;
            const stock = await AppDataSource.getRepository(Stock).findOne({
              where: {
                almacen: { id: almacen.id },
                producto: { id: producto.id },
              },
            });
            if (stock) {
              let payload = {};
              if (updatedOrden.estatus === EstatusOrden.confirmado) {
                // si el estatus es confirmado, se incrementa el stock transito
                payload = {
                  transito: stock.transito + item.cantidad,
                };
              } else if (updatedOrden.estatus === EstatusOrden.recibido) {
                // si el estatus es recibido, se decrementa el stock transito y se incrementa el stock actual
                payload = {
                  transito: stock.transito - item.cantidad,
                  actual: stock.actual + item.cantidad,
                };
              }
              await AppDataSource.getRepository(Stock).update(
                stock.id,
                payload
              );
            }
          }
        });
      }

      // Email vendedor when order status changes
      const subject = `Orden #${updatedOrden.serial} actualizada a ${updatedOrden.estatus}`;
      const body = `
        <p>La orden #${updatedOrden.serial} ha sido actualizada a ${
        updatedOrden.estatus
      }</p>
        <p>Estatus: ${updatedOrden.estatus}</p>
        <p>Fecha: ${new Date().toLocaleString("es-US", {
          timeZone: "America/New_York",
        })} (EST)</p>
      `;
      await sendEmail(
        process.env.NO_REPLY_EMAIL_ADDRESS as string,
        updatedOrden.vendedor.email,
        subject,
        body
      );
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// DELETE - Eliminar orden
OrdenesRouter.delete(
  "/:ordenId",
  verificarPrivilegio({
    entidad: Orden.name,
    accion: Acciones.eliminar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { ordenId } = req.params;
      const orden = await AppDataSource.getRepository(Orden).findOne({
        where: { id: ordenId },
        relations: ["vendedor"],
      });
      if (!orden) {
        return res.status(404).json({ error: "Orden no encontrada" });
      }
      await AppDataSource.getRepository(Orden).softRemove(orden);
      res.status(200).json({ message: "Orden eliminada" });
      emitSocketEvent(orden.vendedor.id, "ordenEliminada", {
        orden,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// DELETE - Eliminar archivos de item de orden
OrdenesRouter.delete(
  "/:ordenId/items/:itemId/archivos/:archivoId",
  verificarPrivilegio({
    entidad: Orden.name,
    accion: Acciones.eliminar,
    valor: true,
  }),
  async (req: Request, res: Response) => {
    try {
      const { ordenId, itemId, archivoId } = req.params;
      const archivo = await AppDataSource.getRepository(Archivo).findOne({
        where: { id: archivoId },
      });
      if (!archivo) {
        return res.status(404).json({ error: "Archivo no encontrado" });
      }
      await AppDataSource.getRepository(Archivo).softRemove(archivo);
      res.status(200).json({ message: "Archivo eliminado" });
    } catch (e: any) {
      console.error(e);
      return res.status(500).json({ error: e.message });
    }
  }
);

export { OrdenesRouter };
