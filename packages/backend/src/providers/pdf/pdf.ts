import path from "path";
import { AppDataSource } from "../../orm/data-source";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as qrcode from "qrcode";
import fs from "fs/promises";
import { IOrden } from "shared/interfaces";
import {
  currencyFormat,
  calcularTotalOrden,
  formatearFecha,
} from "shared/helpers";
import { TipoDescuento, TipoOrden, TipoCambio } from "shared/enums";

// Constants for PDF messages
const PDF_MESSAGES = {
  IVA_NOTICE: "Los Precios aquí expresados NO INCLUYEN IVA.",
  USD_SPECIAL_PRICE: "Precio especial para pagos en DIVISAS.",
} as const;

export class PDFProvider {
  private readonly LETTER = {
    width: 612,
    height: 792,
    center: {
      x: 612 / 2,
      y: 792 / 2,
    },
    margins: {
      top: 792 - 72, // 1 inch from top
      bottom: 72, // 1 inch from bottom
      left: 40, // Doubled from 20 to 40
      right: 612 - 40, // Adjusted for new left margin
    },
  };

  // Helper function to draw header on any page
  private async drawHeader(
    page: any,
    pdfDoc: any,
    helveticaFont: any,
    helveticaBold: any,
    primaryColor: any
  ) {
    const { height } = page.getSize();

    // Logo (left)
    const logoPath = path.join(__dirname, "templates", "acdc-logo.png");
    let yPosition = height - 15; // Top margin
    let logoHeight = 100; // Increased from 55 to make logo taller
    let logoWidth = 250; // Increased width constraint to allow for taller scaling
    try {
      const logoBytes = await fs.readFile(logoPath);
      const logoImage = await pdfDoc.embedPng(logoBytes);
      const scaled = logoImage.scaleToFit(logoWidth, logoHeight);
      page.drawImage(logoImage, {
        x: 40,
        y: yPosition - scaled.height + 10,
        width: scaled.width,
        height: scaled.height,
      });
    } catch (e) {
      console.error("Could not load logo image:", e);
    }

    // Company info (right)
    const infoX = 350;
    const infoY = height - 35;
    let infoLine = 0;
    const infoLineHeight = 15;
    page.drawText("ACDC SOLUCIONES ELÉCTRICAS, C.A.", {
      x: infoX,
      y: infoY - infoLine * infoLineHeight,
      size: 9,
      font: helveticaBold,
      color: primaryColor,
    });
    infoLine++;
    page.drawText("RIF:", {
      x: infoX,
      y: infoY - infoLine * infoLineHeight,
      size: 9,
      font: helveticaBold,
      color: primaryColor,
    });
    page.drawText(" J-50684131-2", {
      x: infoX + 17, // Position after "RIF:"
      y: infoY - infoLine * infoLineHeight,
      size: 9,
      font: helveticaFont,
      color: primaryColor,
    });
    infoLine++;
    page.drawText("Urb Lago Jardin, Manzana 5, Guacara, Carabobo.", {
      x: infoX,
      y: infoY - infoLine * infoLineHeight,
      size: 9,
      font: helveticaFont,
      color: primaryColor,
    });
    infoLine++;
    page.drawText("TLF:", {
      x: infoX,
      y: infoY - infoLine * infoLineHeight,
      size: 9,
      font: helveticaBold,
      color: primaryColor,
    });
    page.drawText(" 0412-2143534 / 0412-7582630", {
      x: infoX + 19, // Position after "TLF:"
      y: infoY - infoLine * infoLineHeight,
      size: 9,
      font: helveticaFont,
      color: primaryColor,
    });
    infoLine++;
    page.drawText("CORREO:", {
      x: infoX,
      y: infoY - infoLine * infoLineHeight,
      size: 9,
      font: helveticaBold,
      color: primaryColor,
    });
    page.drawText(" acdcsolucioneselectricas.ca@gmail.com", {
      x: infoX + 42, // Position after "CORREO:" (longer label)
      y: infoY - infoLine * infoLineHeight,
      size: 9,
      font: helveticaFont,
      color: primaryColor,
    });
  }

  // Helper function to draw table headers
  private drawTableHeaders(
    page: any,
    helveticaBold: any,
    primaryColor: any,
    yPosition: number,
    itemLabel: string,
    columnWidths: number[]
  ) {
    const tableHeaders = [
      itemLabel,
      "Descripción",
      "Cantidad",
      "Precio",
      "Total",
    ];
    let currentX = 40;

    tableHeaders.forEach((header, index) => {
      let headerX = currentX;

      // Center the "Item" header
      if (index === 0) {
        // Item column
        const headerWidth = helveticaBold.widthOfTextAtSize(header, 10);
        headerX = 40 + columnWidths[0] / 2 - headerWidth / 2;
      }

      // Center the "Producto" header
      if (index === 1) {
        // Producto column
        const headerWidth = helveticaBold.widthOfTextAtSize(header, 10);
        const productoColumnStart = 40 + columnWidths[0]; // Start of Producto column
        const productoColumnCenter = productoColumnStart + columnWidths[1] / 2;
        headerX = productoColumnCenter - headerWidth / 2;
      }

      // Center the "Cantidad" header
      if (index === 2) {
        // Cantidad column
        const headerWidth = helveticaBold.widthOfTextAtSize(header, 10);
        const cantidadColumnStart = 40 + columnWidths[0] + columnWidths[1]; // Start of Cantidad column
        const cantidadColumnCenter = cantidadColumnStart + columnWidths[2] / 2;
        headerX = cantidadColumnCenter - headerWidth / 2;
      }

      // Center the "Precio" header
      if (index === 3) {
        // Precio column
        const headerWidth = helveticaBold.widthOfTextAtSize(header, 10);
        const precioColumnStart =
          40 + columnWidths[0] + columnWidths[1] + columnWidths[2]; // Start of Precio column
        const precioColumnCenter = precioColumnStart + columnWidths[3] / 2;
        headerX = precioColumnCenter - headerWidth / 2;
      }

      // Center the "Total" header
      if (index === 4) {
        // Total column
        const headerWidth = helveticaBold.widthOfTextAtSize(header, 10);
        const totalColumnStart =
          40 +
          columnWidths[0] +
          columnWidths[1] +
          columnWidths[2] +
          columnWidths[3]; // Start of Total column
        const totalColumnCenter = totalColumnStart + columnWidths[4] / 2;
        headerX = totalColumnCenter - headerWidth / 2;
      }

      page.drawText(header, {
        x: headerX,
        y: yPosition,
        size: 10,
        font: helveticaBold,
        color: primaryColor,
      });

      // Add "Unitario" below "Precio" for the price column
      if (index === 3) {
        // Precio column
        const unitarioWidth = helveticaBold.widthOfTextAtSize("Unitario", 10);
        const precioColumnStart =
          40 + columnWidths[0] + columnWidths[1] + columnWidths[2]; // Start of Precio column
        const precioColumnCenter = precioColumnStart + columnWidths[3] / 2;
        page.drawText("Unitario", {
          x: precioColumnCenter - unitarioWidth / 2, // Center "Unitario"
          y: yPosition - 12, // Below "Precio"
          size: 10,
          font: helveticaBold,
          color: primaryColor,
        });
      }

      currentX += columnWidths[index];
    });

    // Draw separator line
    page.drawLine({
      start: { x: 40, y: yPosition - 20 },
      end: { x: page.getSize().width - 40, y: yPosition - 20 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
  }

  // Helper function to draw IVA message at bottom of page
  private drawIVAMessage(
    page: any,
    helveticaFont: any,
    primaryColor: any,
    tipoCambio?: TipoCambio
  ) {
    page.drawText(PDF_MESSAGES.IVA_NOTICE, {
      x: 40 + 14, //(width - messageWidth) / 2, // Center the message
      y: 30, // 30 points from bottom
      size: 9,
      font: helveticaFont,
      color: primaryColor,
    });

    // Only show the second message if tipoCambio is USD
    if (tipoCambio === TipoCambio.usd) {
      page.drawText(PDF_MESSAGES.USD_SPECIAL_PRICE, {
        x: 40 + 14, // Aligned with the first message
        y: 15, // 15 points from bottom (below the first message)
        size: 9,
        font: helveticaFont,
        color: primaryColor,
      });
    }
  }

  private getTemplatePath(garantia: string): string {
    const templateMap = {
      ["1 año"]: "cert_1_ano.pdf",
      ["2 años"]: "cert_2_anos.pdf",
      ["6 meses"]: "cert_6_meses.pdf",
    };

    const templateName = templateMap[garantia as keyof typeof templateMap];
    if (!templateName) {
      throw new Error(
        "No certificate template available for this warranty period"
      );
    }

    // Log the full path for debugging
    const fullPath = path.join(__dirname, "templates", templateName);
    console.log("Template path:", fullPath);
    return fullPath;
  }

  public async generatePDF({ itemId }: { itemId: string }): Promise<Buffer> {
    try {
      console.log("Starting PDF generation for itemId:", itemId);

      const certificado = {
        id: "1",
        serial: "1234567890",
        fechaCreado: "2021-01-01",
        orden: {
          id: "1",
          cliente: {
            empresa: "Empresa",
            nombre: "Nombre",
            apellido: "Apellido",
          },
        },
        item: {
          id: "1",
          garantia: "1 año",
          producto: {
            nombre: "Producto",
            sku: "1234567890",
          },
        },
      };

      console.log("Found certificado:", {
        id: certificado.id,
        garantia: certificado.item.garantia,
        producto: certificado.item.producto?.nombre,
        orden: certificado.orden?.id,
      });

      // Get the appropriate template path
      const templatePath = this.getTemplatePath(certificado.item.garantia);

      try {
        // Check if template file exists
        await fs.access(templatePath);
        console.log("Template file exists at:", templatePath);
      } catch (error) {
        console.error("Template file access error:", error);
        throw new Error(`Template file not found at: ${templatePath}`);
      }

      // Load the template PDF
      console.log("Reading template file...");
      const templateBytes = await fs.readFile(templatePath);
      console.log("Template file read successfully");

      console.log("Loading PDF document...");
      const pdfDoc = await PDFDocument.load(templateBytes);
      console.log("PDF document loaded successfully");

      // Get the first page
      const pages = pdfDoc.getPages();
      if (pages.length === 0) {
        throw new Error("PDF template has no pages");
      }
      const page = pages[0];
      console.log("Got first page of PDF");

      // Add content to the template
      const { height } = page.getSize();
      console.log("Adding text to PDF...");

      // Draw serial
      page.drawText(`00${certificado.serial}`, {
        x: this.LETTER.center.x + 84,
        y: this.LETTER.center.y + 108, // Vertically centered
        size: 12,
      });

      // Draw fecha de emision
      const fechaEmision = new Date(certificado.fechaCreado).toLocaleDateString(
        "es-ES",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );
      page.drawText(`${fechaEmision}`, {
        x: this.LETTER.center.x,
        y: this.LETTER.center.y + 84, // Vertically centered
        size: 12,
      });

      // Draw the client name
      page.drawText(
        `${
          certificado.orden.cliente?.empresa
            ? certificado.orden.cliente.empresa
            : certificado.orden.cliente?.nombre +
              " " +
              certificado.orden.cliente?.apellido
        }`,
        {
          x: this.LETTER.center.x - 120,
          y: this.LETTER.center.y + 62, // Vertically centered
          size: 12,
        }
      );

      // Draw the product SKU
      page.drawText(`${certificado.item.producto.sku}`, {
        x: this.LETTER.center.x - 145,
        y: this.LETTER.center.y + 38, // Vertically centered
        size: 12,
      });

      // Draw the product name
      page.drawText(`${certificado.item.producto.nombre}`, {
        x: this.LETTER.center.x - 100,
        y: this.LETTER.center.y + 16, // Vertically centered
        size: 12,
      });

      // Draw the QR code
      const qrCodeUrl = `${process.env.CERT_URL}/${certificado.item.id}`;
      const qrCodeData = await qrcode.toDataURL(qrCodeUrl);
      const qrCodeImage = await pdfDoc.embedPng(qrCodeData);

      // Calculate position for bottom right placement
      const qrCodeSize = 100; // Size in points
      page.drawImage(qrCodeImage, {
        x: this.LETTER.width - qrCodeSize - 50, // 1 inch from right
        y: this.LETTER.margins.bottom + 20, // 1.5 inches from bottom
        width: qrCodeSize,
        height: qrCodeSize,
      });

      // Save the modified PDF
      console.log("Saving modified PDF...");
      const pdfBytes = await pdfDoc.save();
      console.log("PDF saved successfully");

      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error("PDF generation error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to generate PDF");
    }
  }

  public async generateOrderPDF(orden: IOrden): Promise<Buffer> {
    try {
      console.log("Starting order PDF generation for order:", orden.serial);

      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([this.LETTER.width, this.LETTER.height]);
      const { width, height } = page.getSize();

      // Load fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Colors
      const primaryColor = rgb(0.2, 0.2, 0.2);
      const secondaryColor = rgb(0.4, 0.4, 0.4);
      const accentColor = rgb(1, 0.4, 0); // Orange for accent

      // --- HEADER ---
      await this.drawHeader(
        page,
        pdfDoc,
        helveticaFont,
        helveticaBold,
        primaryColor
      );

      // --- END HEADER ---

      let yPosition = height - 120;

      // Order title
      page.drawText(`Orden de ${orden.tipo}:`, {
        x: 40,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });
      page.drawText(` #${orden.serial}`, {
        x: 40,
        y: yPosition - 20, // Below "Orden de ${orden.tipo}:"
        size: 12,
        font: helveticaFont,
        color: secondaryColor,
      });

      yPosition -= 30;

      // Order date - moved to right side aligned with order title
      const orderDate = new Date(orden.fechaCreado).toLocaleDateString(
        "es-ES",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );
      page.drawText("Fecha:", {
        x: width - 150, // Right side positioning
        y: yPosition + 30, // Same Y as order title
        size: 10,
        font: helveticaBold,
        color: primaryColor,
      });
      page.drawText(` ${orderDate}`, {
        x: width - 150 + 35, // Position after "Fecha:"
        y: yPosition + 30, // Same Y as order title
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
      });

      // BCV rate if applicable
      if (orden.tipoCambio === TipoCambio.bcv) {
        page.drawText("Tasa BCV:", {
          x: width - 150, // Right side positioning, aligned with date
          y: yPosition + 10, // Below the date
          size: 10,
          font: helveticaBold,
          color: primaryColor,
        });
        page.drawText(` ${orden.tasaCambio}`, {
          x: width - 150 + 50, // Position after "Tasa BCV:" (longer label)
          y: yPosition + 10, // Below the date
          size: 10,
          font: helveticaFont,
          color: secondaryColor,
        });
      }

      // Order type and validity (if applicable)
      if (
        orden.tipo === TipoOrden.credito ||
        orden.tipo === TipoOrden.cotizacion
      ) {
        if (orden.validez) {
          page.drawText("Válido por:", {
            x: width / 2 - 50, // Center positioning
            y: yPosition + 30, // Same Y as order title and date
            size: 10,
            font: helveticaBold,
            color: primaryColor,
          });
          page.drawText(
            ` ${orden.validez} día${orden.validez > 1 ? "s" : ""}`,
            {
              x: width / 2 - 43, // Center positioning
              y: yPosition + 10, // Below "Válido por:"
              size: 10,
              font: helveticaFont,
              color: primaryColor,
            }
          );
        }
      }

      yPosition -= 20;

      // Client and Seller Information - Aligned
      const clientSectionX = 40;
      const sellerSectionX = 350;
      const sectionStartY = yPosition;

      // Client section
      page.drawText("Cliente:", {
        x: clientSectionX,
        y: sectionStartY,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });

      let clientY = sectionStartY - 17;

      const clientName = orden.cliente?.empresa
        ? orden.cliente.empresa
        : `${orden.cliente?.nombre} ${orden.cliente?.apellido}`;

      page.drawText(clientName, {
        x: clientSectionX,
        y: clientY,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      clientY -= 15;

      if (orden.cliente?.empresa) {
        page.drawText(`${orden.cliente?.nombre} ${orden.cliente?.apellido}`, {
          x: clientSectionX,
          y: clientY,
          size: 10,
          font: helveticaFont,
          color: secondaryColor,
        });
        clientY -= 15;
      }

      if (orden.cliente?.telefono) {
        page.drawText(`Tel: ${orden.cliente.telefono}`, {
          x: clientSectionX,
          y: clientY,
          size: 10,
          font: helveticaFont,
          color: secondaryColor,
        });
      }

      // Seller section - aligned with client section
      page.drawText("Vendedor:", {
        x: sellerSectionX,
        y: sectionStartY,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });

      let sellerY = sectionStartY - 17;

      const sellerName = orden.vendedor.empresa
        ? orden.vendedor.empresa
        : `${orden.vendedor.nombre} ${orden.vendedor.apellido}`;

      page.drawText(sellerName, {
        x: sellerSectionX,
        y: sellerY,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      sellerY -= 15;

      if (orden.vendedor.empresa) {
        page.drawText(`${orden.vendedor.nombre} ${orden.vendedor.apellido}`, {
          x: sellerSectionX,
          y: sellerY,
          size: 10,
          font: helveticaFont,
          color: secondaryColor,
        });
        sellerY -= 15;
      }

      if (orden.vendedor.telefono) {
        page.drawText(`Tel: ${orden.vendedor.telefono}`, {
          x: sellerSectionX,
          y: sellerY,
          size: 10,
          font: helveticaFont,
          color: secondaryColor,
        });
      }

      // Reset Y position for items table
      yPosition = sectionStartY - 70;

      // Table headers (without PRODUCTOS title)
      const itemLabel = orden.items.length > 1 ? "Items" : "Item";
      const columnWidths = [35, 295, 100, 25, 100];

      // Draw table headers
      this.drawTableHeaders(
        page,
        helveticaBold,
        primaryColor,
        yPosition,
        itemLabel,
        columnWidths
      );

      yPosition -= 35; // Account for headers and separator line

      // Items
      for (let index = 0; index < orden.items.length; index++) {
        const item = orden.items[index];
        // Check if we need a new page
        if (yPosition < 100) {
          page = pdfDoc.addPage([this.LETTER.width, this.LETTER.height]);
          await this.drawHeader(
            page,
            pdfDoc,
            helveticaFont,
            helveticaBold,
            primaryColor
          );
          // Fijar Y para encabezado de columnas justo debajo del logo
          let tableHeaderY = height - 120;
          this.drawTableHeaders(
            page,
            helveticaBold,
            primaryColor,
            tableHeaderY,
            itemLabel,
            columnWidths
          );
          yPosition = tableHeaderY - 35; // Ajustar para que los ítems sigan debajo del encabezado de columnas
          // Add IVA message to new page
          this.drawIVAMessage(
            page,
            helveticaFont,
            primaryColor,
            orden.tipoCambio
          );
        }

        let currentX = 40;

        // Item number
        const itemNumber = (index + 1).toString();
        const itemNumberWidth = helveticaFont.widthOfTextAtSize(itemNumber, 10);
        const itemColumnCenter = 40 + columnWidths[0] / 2;
        page.drawText(itemNumber, {
          x: itemColumnCenter - itemNumberWidth / 2, // Center the text
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[0];

        // Product name
        page.drawText(item.producto.nombre, {
          x: currentX,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[1];

        // Quantity
        const quantityText = item.cantidad.toString();
        const quantityWidth = helveticaFont.widthOfTextAtSize(quantityText, 10);
        const quantityColumnStart = 40 + columnWidths[0] + columnWidths[1]; // Start of Cantidad column
        const quantityColumnCenter = quantityColumnStart + columnWidths[2] / 2;
        page.drawText(quantityText, {
          x: quantityColumnCenter - quantityWidth / 2, // Center the text
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[2];

        // Unit price
        const unitPriceText = currencyFormat({ value: item.precio });
        const unitPriceWidth = helveticaFont.widthOfTextAtSize(
          unitPriceText,
          10
        );
        const unitPriceColumnStart =
          40 + columnWidths[0] + columnWidths[1] + columnWidths[2]; // Start of Precio column
        const unitPriceColumnEnd = unitPriceColumnStart + columnWidths[3]; // End of Precio column
        page.drawText(unitPriceText, {
          x: unitPriceColumnEnd - unitPriceWidth + 7, // Right-aligned (moved right)
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[3];

        // Total
        const totalText = currencyFormat({
          value: item.precio * item.cantidad,
        });
        const totalWidth = helveticaFont.widthOfTextAtSize(totalText, 10);
        const totalColumnStart =
          40 +
          columnWidths[0] +
          columnWidths[1] +
          columnWidths[2] +
          columnWidths[3]; // Start of Total column
        const totalColumnEnd = totalColumnStart + columnWidths[4]; // End of Total column
        page.drawText(totalText, {
          x: totalColumnEnd - totalWidth - 32, // Right-aligned (moved right)
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });

        yPosition -= 15;

        // SKU below product name
        page.drawText(`SKU: ${item.producto.sku}`, {
          x: 40 + 35, // Align with "Producto" column (after "Item" column)
          y: yPosition,
          size: 8,
          font: helveticaFont,
          color: secondaryColor,
        });

        yPosition -= 12;

        // Item notes if any
        if (item.notas) {
          page.drawText(`Notas: ${item.notas}`, {
            x: 40 + 35, // Align with "Producto" column (after "Item" column)
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: secondaryColor,
          });
          yPosition -= 12;
        }

        yPosition -= 5;
      }

      // Reset Y position for totals
      yPosition = height - 720;

      // Totals section
      const totalConCredito = calcularTotalOrden({
        subtotal: orden.subtotal,
        descuento: orden.descuento,
        tipoDescuento: orden.tipoDescuento!,
        impuesto: orden.impuesto,
        credito: orden.credito,
      });

      const totalsX = width - 200;
      let totalsY = yPosition;
      const lineHeight = 15; //12

      // Sub-total
      page.drawText("Sub-total:", {
        x: totalsX,
        y: totalsY, // -10
        size: 10,
        font: helveticaBold,
        color: primaryColor,
      });
      page.drawText(currencyFormat({ value: orden.subtotal }), {
        x: totalsX + 80,
        y: totalsY, //-10
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });
      totalsY -= lineHeight;

      // Discount if applicable
      if (orden.descuento > 0) {
        const discountText =
          orden.tipoDescuento === TipoDescuento.porcentual
            ? `Descuento (${orden.descuento}%):`
            : "Descuento:";

        page.drawText(discountText, {
          x: totalsX,
          y: totalsY,
          size: 10,
          font: helveticaBold,
          color: rgb(0.8, 0.2, 0.2),
        });

        const discountAmount =
          orden.tipoDescuento === TipoDescuento.porcentual
            ? (orden.subtotal * orden.descuento) / 100
            : orden.descuento;

        page.drawText(`-${currencyFormat({ value: discountAmount })}`, {
          x: totalsX + 80,
          y: totalsY,
          size: 10,
          font: helveticaFont,
          color: rgb(0.8, 0.2, 0.2),
        });
        totalsY -= lineHeight;
      }

      // Credit if applicable
      if (orden.credito > 0) {
        page.drawText("Crédito aplicado:", {
          x: totalsX,
          y: totalsY,
          size: 10,
          font: helveticaBold,
          color: rgb(0.8, 0.2, 0.2),
        });
        page.drawText(`-${currencyFormat({ value: orden.credito })}`, {
          x: totalsX + 80,
          y: totalsY,
          size: 10,
          font: helveticaFont,
          color: rgb(0.8, 0.2, 0.2),
        });
        totalsY -= lineHeight;
      }

      // Total separator line
      page.drawLine({
        start: { x: totalsX, y: totalsY + 3 },
        end: { x: totalsX + 120, y: totalsY + 3 },
        thickness: 1,
        color: primaryColor,
      });
      totalsY -= lineHeight;

      // Final total
      page.drawText("TOTAL USD:", {
        x: totalsX,
        y: totalsY,
        size: 10,
        font: helveticaBold,
        color: primaryColor,
      });
      page.drawText(currencyFormat({ value: totalConCredito }), {
        x: totalsX + 80,
        y: totalsY,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });
      totalsY -= lineHeight;

      // BCV rate if applicable
      if (orden.tipoCambio === TipoCambio.bcv) {
        page.drawText("TOTAL VES:", {
          x: totalsX,
          y: totalsY,
          size: 10,
          font: helveticaBold,
          color: secondaryColor,
        });
        page.drawText(
          currencyFormat({
            value: Math.round(totalConCredito * orden.tasaCambio * 100) / 100,
            currency: "VES",
            locale: "es-VE",
          }),
          {
            x: totalsX + 80,
            y: totalsY,
            size: 10,
            font: helveticaFont,
            color: secondaryColor,
          }
        );
      }

      // Notes section if any
      if (orden.notas) {
        yPosition = height - 720;
        page.drawText("NOTAS:", {
          x: 54,
          y: yPosition,
          size: 10,
          font: helveticaBold,
          color: primaryColor,
        });

        // Split notes into lines if too long
        const maxWidth = totalsX - 54 - 10; // Espacio seguro para las notas
        const words = orden.notas.split(" ");
        let currentLine = "";
        const lines: string[] = [];

        words.forEach((word) => {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const testWidth = helveticaFont.widthOfTextAtSize(testLine, 10);

          if (testWidth > maxWidth) {
            if (currentLine) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              lines.push(word);
            }
          } else {
            currentLine = testLine;
          }
        });

        if (currentLine) {
          lines.push(currentLine);
        }

        let notasY = yPosition - 12; // Solo 10 puntos debajo del header
        for (const line of lines) {
          if (notasY < 30) {
            // Solo salta si de verdad no cabe
            page = pdfDoc.addPage([this.LETTER.width, this.LETTER.height]);
            await this.drawHeader(
              page,
              pdfDoc,
              helveticaFont,
              helveticaBold,
              primaryColor
            );
            notasY = height - 120; // Start after header
            // Add IVA message to new page
            this.drawIVAMessage(
              page,
              helveticaFont,
              primaryColor,
              orden.tipoCambio
            );
          }

          page.drawText(line, {
            x: 54,
            y: notasY,
            size: 10,
            font: helveticaFont,
            color: secondaryColor,
          });
          notasY -= 15;
        }
      }

      // Add IVA message to the main page
      this.drawIVAMessage(page, helveticaFont, primaryColor, orden.tipoCambio);

      // Save the PDF
      console.log("Saving order PDF...");
      const pdfBytes = await pdfDoc.save();
      console.log("Order PDF saved successfully");

      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error("Order PDF generation error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to generate order PDF");
    }
  }
}
