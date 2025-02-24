import { Router, Request, Response } from "express";
import { AppDataSource } from "../orm/data-source";
import { Orden } from "../orm/entity/orden";
import { Stock } from "../orm/entity/stock";
import { Usuario } from "../orm/entity/usuario";
import { EstatusOrden, TipoOrden } from "shared/enums";
import { ReporteParams } from "shared/interfaces";
import { createObjectCsvWriter } from "csv-writer";
import PDFDocument from "pdfkit";
import { format, startOfDay, endOfDay, addDays } from "date-fns";
import path from "path";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { Producto } from "../orm/entity/producto";
import slugify from "slugify";
import { ItemOrden } from "../orm/entity/itemOrden";
import { isSuperAdmin } from "shared/helpers";
import { nanoid } from "nanoid";
const ReportesRouter = Router();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  endpoint: process.env.AWS_ENDPOINT,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// Helper function to upload file to S3
async function uploadToS3(filePath: string, fileName: string): Promise<string> {
  const fileContent = fs.readFileSync(filePath);
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET || "",
    Key: `reportes/${fileName}`,
    Body: fileContent,
    ACL: "public-read",
  });

  await s3Client.send(command);
  return `${process.env.AWS_ENDPOINT}/${process.env.AWS_BUCKET}/reportes/${fileName}`;
}

// POST - Generate Report
ReportesRouter.post("/generar", async (req: Request, res: Response) => {
  try {
    const user = req.user as Usuario;
    const isAdmin = isSuperAdmin(user);

    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "No tienes permisos para generar reportes" });
    }

    const params = req.body as ReporteParams;

    const baseQuery = AppDataSource.createQueryBuilder();
    const timestamp = format(new Date(), "yyyy-MM-dd-HH-mm-ss");

    // Get names for the filter entities
    let sucursalName, vendedorName, categoriaName;

    if (params.sucursalId) {
      const sucursal = await AppDataSource.getRepository("Sucursal")
        .createQueryBuilder("sucursal")
        .select("sucursal.nombre")
        .where("sucursal.id = :id", { id: params.sucursalId })
        .getOne();
      sucursalName = sucursal?.nombre;
    }

    if (params.vendedorId) {
      const vendedor = await AppDataSource.getRepository("Usuario")
        .createQueryBuilder("usuario")
        .select(["usuario.nombre", "usuario.apellido"])
        .where("usuario.id = :id", { id: params.vendedorId })
        .getOne();
      vendedorName = vendedor
        ? `${vendedor.nombre}-${vendedor.apellido}`
        : undefined;
    }

    if (params.categoriaId) {
      const categoria = await AppDataSource.getRepository("Categoria")
        .createQueryBuilder("categoria")
        .select("categoria.nombre")
        .where("categoria.id = :id", { id: params.categoriaId })
        .getOne();
      categoriaName = categoria?.nombre;
    }

    // Build filename with descriptive names
    let fileNameParts = [`reporte-${params.tipo}`];

    if (params.fechaInicio) {
      const startDate = new Date(params.fechaInicio);
      startDate.setUTCHours(0, 0, 0, 0);
      fileNameParts.push(`desde-${format(startDate, "yyyy-MM-dd")}`);
    }
    if (params.fechaFin) {
      const endDate = new Date(params.fechaFin);
      endDate.setUTCDate(endDate.getUTCDate() + 1);
      endDate.setUTCHours(0, 0, 0, 0);
      fileNameParts.push(`hasta-${format(endDate, "yyyy-MM-dd")}`);
    }
    if (sucursalName) {
      fileNameParts.push(`sucursal-${sucursalName}`);
    }
    if (vendedorName) {
      fileNameParts.push(`vendedor-${vendedorName}`);
    }
    if (categoriaName) {
      fileNameParts.push(`categoria-${categoriaName}`);
    }

    if (params.tipo !== "ventas") {
      fileNameParts.push(timestamp);
    }

    // Use slugify with the same options as in productos
    const fileName = slugify(fileNameParts.join("-"), {
      lower: true,
      strict: true,
      replacement: "-",
      trim: true,
    });

    let data: any[] = [];

    switch (params.tipo) {
      case "ventas": {
        const query = AppDataSource.getRepository(Orden)
          .createQueryBuilder("orden")
          .leftJoinAndSelect("orden.items", "items")
          .leftJoinAndSelect("items.producto", "producto")
          .where("orden.fechaEliminado IS NULL")
          .andWhere("orden.tipo IN (:...tipos)", {
            tipos: [TipoOrden.venta, TipoOrden.credito],
          })
          .andWhere("orden.estatus = :estatus", {
            estatus: EstatusOrden.entregado,
          });

        if (params.fechaInicio) {
          const startDate = startOfDay(new Date(params.fechaInicio));
          query.andWhere("orden.fechaCreado >= :fechaInicio", {
            fechaInicio: format(startDate, "yyyy-MM-dd"),
          });
        }

        if (params.fechaFin) {
          const endDate = endOfDay(addDays(new Date(params.fechaFin), 1));
          query.andWhere("orden.fechaCreado <= :fechaFin", {
            fechaFin: format(endDate, "yyyy-MM-dd"),
          });
        }

        if (params.sucursalId) {
          query.andWhere("orden.sucursalId = :sucursalId", {
            sucursalId: params.sucursalId,
          });
        }

        const ordenes = await query.getMany();

        // Initialize empty data array if no orders found
        data = [];

        if (ordenes.length > 0) {
          // Group items by SKU and calculate totals
          const skuTotals = new Map<
            string,
            {
              sku: string;
              producto: string;
              cantidadTotal: number;
              ventaTotal: number;
            }
          >();

          ordenes.forEach((orden: Orden) => {
            orden.items?.forEach((item: ItemOrden) => {
              const sku = item.producto.sku;
              const current = skuTotals.get(sku) || {
                sku,
                producto: item.producto.nombre,
                cantidadTotal: 0,
                ventaTotal: 0,
              };

              current.cantidadTotal += item.cantidad;
              current.ventaTotal += item.cantidad * item.precio;

              skuTotals.set(sku, current);
            });
          });

          // Transform grouped data for report
          data = Array.from(skuTotals.values())
            .sort((a, b) => a.sku.localeCompare(b.sku))
            .map((item) => ({
              SKU: item.sku,
              Producto: item.producto,
              CantidadTotal: item.cantidadTotal,
              VentaTotal: item.ventaTotal,
            }));
        }

        break;
      }

      case "inventario": {
        const query = AppDataSource.getRepository(Stock)
          .createQueryBuilder("stock")
          .leftJoinAndSelect("stock.producto", "producto")
          .leftJoinAndSelect("stock.almacen", "almacen")
          .leftJoinAndSelect("producto.categoria", "categoria");

        if (params.sucursalId) {
          query.andWhere("almacen.sucursal.id = :sucursalId", {
            sucursalId: params.sucursalId,
          });
        }

        if (params.categoriaId) {
          query.andWhere("categoria.id = :categoriaId", {
            categoriaId: params.categoriaId,
          });
        }

        const stocks = await query.getMany();

        data = stocks.map((stock) => ({
          SKU: stock.producto.sku,
          Producto: stock.producto.nombre,
          Modelo: stock.producto.modelo,
          Almacen: stock.almacen.nombre,
          Actual: stock.actual,
          Reservado: stock.reservado,
          Transito: stock.transito,
          Total: stock.actual + stock.reservado + stock.transito,
        }));
        break;
      }

      case "productos": {
        const query = AppDataSource.getRepository(Producto)
          .createQueryBuilder("producto")
          .leftJoinAndSelect("producto.categoria", "categoria")
          .leftJoinAndSelect("producto.subcategoria", "subcategoria");

        query.addOrderBy("producto.sku", "ASC", "NULLS LAST");
        const productos = await query.getMany();

        data = productos.map((producto) => ({
          SKU: producto.sku,
          Producto: producto.nombre,
          Modelo: producto.modelo,
          Categoria: producto.categoria.nombre,
          Subcategoria: producto.subcategoria?.nombre,
          Costo: producto.costo,
        }));

        break;
      }
    }

    let fileUrl = "";

    if (params.formato === "csv") {
      const csvPath = path.join(__dirname, `/${fileName}.csv`);

      // Define default headers based on report type
      let headers;
      if (params.tipo === "ventas") {
        headers = [
          { id: "SKU", title: "SKU" },
          { id: "Producto", title: "Producto" },
          { id: "CantidadTotal", title: "CantidadTotal" },
          { id: "VentaTotal", title: "VentaTotal" },
        ];
      } else if (params.tipo === "inventario") {
        headers = [
          { id: "SKU", title: "SKU" },
          { id: "Producto", title: "Producto" },
          { id: "Modelo", title: "Modelo" },
          { id: "Almacen", title: "Almacen" },
          { id: "Disponible", title: "Disponible" },
          { id: "Reservado", title: "Reservado" },
          { id: "Transito", title: "Transito" },
          { id: "Total", title: "Total" },
        ];
      } else if (params.tipo === "productos") {
        headers = [
          { id: "SKU", title: "SKU" },
          { id: "Producto", title: "Producto" },
          { id: "Modelo", title: "Modelo" },
          { id: "Categoria", title: "Categoria" },
          { id: "Subcategoria", title: "Subcategoria" },
          { id: "Costo", title: "Costo" },
        ];
      }

      const csvWriter = createObjectCsvWriter({
        path: csvPath,
        header: headers || [],
      });

      await csvWriter.writeRecords(data);
      fileUrl = await uploadToS3(csvPath, `${fileName}.csv`);
      fs.unlinkSync(csvPath);
    } else if (params.formato === "pdf") {
      const pdfPath = path.join(__dirname, `/${fileName}.pdf`);
      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(pdfPath);

      doc.pipe(writeStream);

      // Add report header
      doc.fontSize(20).text(`Reporte de ${params.tipo}`, { align: "center" });
      doc.moveDown();

      // Add table headers
      const headers = Object.keys(data[0]);
      const rowSpacing = 20;
      let yPosition = 150;

      headers.forEach((header, i) => {
        doc.fontSize(10).text(header, 50 + i * 100, yPosition);
      });

      yPosition += rowSpacing;

      // Add data rows
      data.forEach((row) => {
        Object.values(row).forEach((value, i) => {
          doc.fontSize(10).text(String(value), 50 + i * 100, yPosition);
        });
        yPosition += rowSpacing;

        if (yPosition > 700) {
          doc.addPage();
          yPosition = 50;
        }
      });

      doc.end();

      await new Promise((resolve) =>
        writeStream.on("finish", () => resolve(true))
      );
      fileUrl = await uploadToS3(pdfPath, `${fileName}.pdf`);
      fs.unlinkSync(pdfPath);
    }

    res.status(200).json({
      id: nanoid(),
      url: fileUrl,
      nombre: `${fileName}.${params.formato}`,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
});

export { ReportesRouter };
