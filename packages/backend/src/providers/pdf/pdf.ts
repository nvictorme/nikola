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
import { IMovimiento } from "shared/interfaces";

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

  private drawMovimientoTableHeaders(
    page: any,
    helveticaBold: any,
    primaryColor: any,
    yPosition: number,
    itemLabel: string,
    columnWidths: number[]
  ) {
    // Header dinámico: 'Item' o 'Items' según corresponda
    const tableHeaders = [itemLabel, "Descripción", "Cantidad"];
    let currentX = 40;
    const descripcionOffset = 20; // Espacio extra a la derecha para Descripción

    tableHeaders.forEach((header, index) => {
      let headerX = currentX;

      // 'Item(s)' header (centrado en su columna)
      if (index === 0) {
        const headerWidth = helveticaBold.widthOfTextAtSize(header, 10);
        headerX = 40 + columnWidths[0] / 2 - headerWidth / 2;
      }

      // 'Descripción' header (justificado a la izquierda y desplazado a la derecha)
      if (index === 1) {
        headerX = 40 + columnWidths[0] + descripcionOffset;
      }

      // 'Cantidad' header (centrado en su columna, sin offset)
      if (index === 2) {
        const headerWidth = helveticaBold.widthOfTextAtSize(header, 10);
        const cantidadColumnStart = 40 + columnWidths[0] + columnWidths[1];
        const cantidadColumnCenter = cantidadColumnStart + columnWidths[2] / 2;
        headerX = cantidadColumnCenter - headerWidth / 2;
      }

      page.drawText(header, {
        x: headerX,
        y: yPosition,
        size: 10,
        font: helveticaBold,
        color: primaryColor,
      });

      currentX += columnWidths[index];
    });

    // Draw separator line (más cerca del header)
    page.drawLine({
      start: { x: 40, y: yPosition - 10 },
      end: { x: page.getSize().width - 40, y: yPosition - 8 },
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

  private drawPageTotals(
    page: any,
    helveticaFont: any,
    helveticaBold: any,
    primaryColor: any,
    secondaryColor: any,
    pageItems: any[],
    tipoCambio: TipoCambio,
    tasaCambio: number,
    width: number,
    leftMargin: number
  ) {
    const ivaActual = 0.16; // 16% IVA

    // Calcular totales de la página
    const subtotal = pageItems.reduce((sum, item) => {
      const unitPrice =
        tipoCambio === TipoCambio.bcv
          ? Math.round(item.precio * tasaCambio * 100) / 100
          : item.precio;
      return sum + item.cantidad * unitPrice;
    }, 0);
    const ivaAmount = Math.round(subtotal * ivaActual * 100) / 100;
    const totalToPay = subtotal + ivaAmount;

    // Sección de totales abajo a la derecha
    const totalsX = width - 181;
    let totalsY = 60;

    // Sub-total
    page.drawText("Sub-total:", {
      x: totalsX,
      y: totalsY,
      size: 10,
      font: helveticaBold,
      color: primaryColor,
    });
    const subtotalText = subtotal.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const subtotalWidth = helveticaFont.widthOfTextAtSize(subtotalText, 10);
    page.drawText(subtotalText, {
      x: totalsX + 140 - subtotalWidth,
      y: totalsY,
      size: 10,
      font: helveticaFont,
      color: primaryColor,
    });
    totalsY -= 20;

    // IVA (16%)
    page.drawText("IVA (16%):", {
      x: totalsX,
      y: totalsY,
      size: 10,
      font: helveticaBold,
      color: primaryColor,
    });
    const ivaText = ivaAmount.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const ivaWidth = helveticaFont.widthOfTextAtSize(ivaText, 10);
    page.drawText(ivaText, {
      x: totalsX + 140 - ivaWidth,
      y: totalsY,
      size: 10,
      font: helveticaFont,
      color: primaryColor,
    });
    totalsY -= 20;

    // Total a Pagar
    page.drawText("Total a Pagar:", {
      x: totalsX,
      y: totalsY,
      size: 10,
      font: helveticaBold,
      color: primaryColor,
    });
    const totalText = totalToPay.toLocaleString("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const totalWidth = helveticaFont.widthOfTextAtSize(totalText, 10);
    page.drawText(totalText, {
      x: totalsX + 140 - totalWidth,
      y: totalsY,
      size: 10,
      font: helveticaFont,
      color: primaryColor,
    });

    // Mensaje de retención (izquierda, a la altura del Sub-total)
    const retentionY = 40;
    page.drawText(
      "En caso de ser Agente de Retención, la Retención debe ser por el 100% del IVA",
      {
        x: leftMargin,
        y: retentionY,
        size: 9,
        font: helveticaFont,
        color: secondaryColor,
      }
    );

    // Mensaje de tasa de cambio y fecha
    const exchangeRateY = retentionY - 20;
    const currentDate = formatearFecha(new Date().toISOString());

    if (tipoCambio === TipoCambio.bcv) {
      page.drawText(
        `Tasa BCV utilizada: ${tasaCambio} - Fecha: ${currentDate}`,
        {
          x: leftMargin,
          y: exchangeRateY,
          size: 9,
          font: helveticaFont,
          color: secondaryColor,
        }
      );
    } else {
      page.drawText(`Tasa USD utilizada: 1.00 - Fecha: ${currentDate}`, {
        x: leftMargin,
        y: exchangeRateY,
        size: 9,
        font: helveticaFont,
        color: secondaryColor,
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
      const fechaEmision = formatearFecha(certificado.fechaCreado);
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
      const orderDate = formatearFecha(orden.fechaCreado);
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

      yPosition -= 35;

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
        const cantidadColumnStart = 40 + columnWidths[0] + columnWidths[1]; // Start of Cantidad column
        const cantidadColumnCenter = cantidadColumnStart + columnWidths[2] / 2;
        page.drawText(quantityText, {
          x: cantidadColumnCenter - quantityWidth / 2, // Center the text
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
      const subtotalText = currencyFormat({ value: orden.subtotal });
      const subtotalWidth = helveticaFont.widthOfTextAtSize(subtotalText, 10);
      page.drawText(subtotalText, {
        x: totalsX + 150 - subtotalWidth, // Right-aligned within the totals section (moved right)
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

        const discountAmountText = `-${currencyFormat({
          value: discountAmount,
        })}`;
        const discountAmountWidth = helveticaFont.widthOfTextAtSize(
          discountAmountText,
          10
        );
        page.drawText(discountAmountText, {
          x: totalsX + 150 - discountAmountWidth, // Right-aligned within the totals section (moved right)
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
        end: { x: totalsX + 150, y: totalsY + 3 },
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

      // Total Items (to the left of TOTAL USD)
      const totalItems = orden.items.reduce(
        (sum, item) => sum + item.cantidad,
        0
      );
      const totalPiezasText = "TOTAL Piezas:";
      const totalPiezasWidth = helveticaBold.widthOfTextAtSize(
        totalPiezasText,
        10
      );
      page.drawText(totalPiezasText, {
        x: totalsX - 100, // To the left of TOTAL USD
        y: totalsY,
        size: 10,
        font: helveticaBold,
        color: primaryColor,
      });
      const totalItemsText = totalItems.toString();
      const totalItemsWidth = helveticaFont.widthOfTextAtSize(
        totalItemsText,
        10
      );
      page.drawText(totalItemsText, {
        x: totalsX - 100 + (totalPiezasWidth - totalItemsWidth) / 2, // Centered under "TOTAL Piezas:"
        y: totalsY - lineHeight,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });
      const totalUSDText = currencyFormat({ value: totalConCredito });
      const totalUSDWidth = helveticaFont.widthOfTextAtSize(totalUSDText, 10);
      page.drawText(totalUSDText, {
        x: totalsX + 150 - totalUSDWidth, // Right-aligned within the totals section (moved right)
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
        const totalVESText = currencyFormat({
          value: Math.round(totalConCredito * orden.tasaCambio * 100) / 100,
          currency: "VES",
          locale: "es-VE",
        });
        const totalVESWidth = helveticaFont.widthOfTextAtSize(totalVESText, 10);
        page.drawText(totalVESText, {
          x: totalsX + 150 - totalVESWidth, // Right-aligned within the totals section (moved right)
          y: totalsY,
          size: 10,
          font: helveticaFont,
          color: secondaryColor,
        });
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

  public async generateProformaPDF(orden: IOrden): Promise<Buffer> {
    try {
      console.log("Starting proforma PDF generation for order:", orden.serial);

      // Create a new PDF document with half letter height
      const pdfDoc = await PDFDocument.create();
      const pageWidth = 612; // Full letter width
      const pageHeight = 792 / 2; // Half of letter height
      let page = pdfDoc.addPage([pageWidth, pageHeight]);
      const { width, height } = page.getSize();

      // Load fonts
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      // Colors
      const primaryColor = rgb(0.2, 0.2, 0.2);
      const secondaryColor = rgb(0.4, 0.4, 0.4);

      // Constants
      const ivaActual = 0.16; // 16% IVA
      const leftMargin = 40;
      const maxItemsPerPage = 11;

      // --- HEADER ---
      await this.drawHeader(
        page,
        pdfDoc,
        helveticaFont,
        helveticaBold,
        primaryColor
      );
      // --- END HEADER ---

      // Iniciar la tabla justo debajo del header
      let yPosition = height - 120;

      // Tabla de productos
      const columnWidths = [50, 350, 100, 120]; // Cantidad, Descripción, Precio Unitario, Total
      const columnTitles = [
        "Cantidad",
        "Descripción",
        "Precio Unitario",
        "Total",
      ];

      // Dibujar encabezados de la tabla
      let currentX = leftMargin;
      for (let i = 0; i < columnTitles.length; i++) {
        if (columnTitles[i] === "Precio Unitario") {
          // Centrar "Precio" y "Unitario" en la columna
          const precioText = "Precio";
          const unitarioText = "Unitario";
          const precioWidth = helveticaBold.widthOfTextAtSize(precioText, 9);
          const unitarioWidth = helveticaBold.widthOfTextAtSize(
            unitarioText,
            9
          );
          const precioX = currentX + columnWidths[i] / 2 - precioWidth / 2;
          const unitarioX = currentX + columnWidths[i] / 2 - unitarioWidth / 2;
          page.drawText(precioText, {
            x: precioX,
            y: yPosition + 5,
            size: 9,
            font: helveticaBold,
            color: primaryColor,
          });
          page.drawText(unitarioText, {
            x: unitarioX,
            y: yPosition - 6,
            size: 9,
            font: helveticaBold,
            color: primaryColor,
          });
        } else if (columnTitles[i] === "Descripción") {
          // Centrar "Descripción"
          const descripcionWidth = helveticaBold.widthOfTextAtSize(
            columnTitles[i],
            9
          );
          const descripcionX =
            currentX + columnWidths[i] / 2 - descripcionWidth / 2;
          page.drawText(columnTitles[i], {
            x: descripcionX,
            y: yPosition,
            size: 9,
            font: helveticaBold,
            color: primaryColor,
          });
        } else {
          page.drawText(columnTitles[i], {
            x: currentX,
            y: yPosition,
            size: 9,
            font: helveticaBold,
            color: primaryColor,
          });
        }
        currentX += columnWidths[i];
      }
      yPosition -= 24;

      // Items
      let pageItemCount = 0;
      let currentPageItems: typeof orden.items = [];
      let pageNumber = 0;

      for (let index = 0; index < orden.items.length; index++) {
        const item = orden.items[index];

        // Nueva página si se excede el máximo
        if (pageItemCount >= maxItemsPerPage) {
          // Dibujar totales de la página actual antes de crear nueva página
          this.drawPageTotals(
            page,
            helveticaFont,
            helveticaBold,
            primaryColor,
            secondaryColor,
            currentPageItems,
            orden.tipoCambio,
            orden.tasaCambio,
            width,
            leftMargin
          );

          page = pdfDoc.addPage([pageWidth, pageHeight]);
          await this.drawHeader(
            page,
            pdfDoc,
            helveticaFont,
            helveticaBold,
            primaryColor
          );
          yPosition = height - 120;
          pageItemCount = 0;
          currentPageItems = [];
          pageNumber++;

          // Redibujar encabezados
          currentX = leftMargin;
          for (let i = 0; i < columnTitles.length; i++) {
            if (columnTitles[i] === "Precio Unitario") {
              const precioText = "Precio";
              const unitarioText = "Unitario";
              const precioWidth = helveticaBold.widthOfTextAtSize(
                precioText,
                9
              );
              const unitarioWidth = helveticaBold.widthOfTextAtSize(
                unitarioText,
                9
              );
              const precioX = currentX + columnWidths[i] / 2 - precioWidth / 2;
              const unitarioX =
                currentX + columnWidths[i] / 2 - unitarioWidth / 2;
              page.drawText(precioText, {
                x: precioX,
                y: yPosition + 5,
                size: 9,
                font: helveticaBold,
                color: primaryColor,
              });
              page.drawText(unitarioText, {
                x: unitarioX,
                y: yPosition - 6,
                size: 9,
                font: helveticaBold,
                color: primaryColor,
              });
            } else if (columnTitles[i] === "Descripción") {
              // Centrar "Descripción"
              const descripcionWidth = helveticaBold.widthOfTextAtSize(
                columnTitles[i],
                9
              );
              const descripcionX =
                currentX + columnWidths[i] / 2 - descripcionWidth / 2;
              page.drawText(columnTitles[i], {
                x: descripcionX,
                y: yPosition,
                size: 9,
                font: helveticaBold,
                color: primaryColor,
              });
            } else {
              page.drawText(columnTitles[i], {
                x: currentX,
                y: yPosition,
                size: 9,
                font: helveticaBold,
                color: primaryColor,
              });
            }
            currentX += columnWidths[i];
          }
          yPosition -= 24;
        }

        // Agregar el item a la página actual
        currentPageItems.push(item);
        currentX = leftMargin;
        // Cantidad
        const cantidadText = item.cantidad.toString();
        const cantidadWidth = helveticaFont.widthOfTextAtSize(cantidadText, 9);
        const headerText = "Cantidad";
        const headerWidth = helveticaBold.widthOfTextAtSize(headerText, 9);
        const headerCenter = currentX + headerWidth / 2;
        page.drawText(cantidadText, {
          x: headerCenter - cantidadWidth / 2,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[0];
        // Descripción
        page.drawText(item.producto.nombre, {
          x: currentX,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[1];
        // Precio Unitario (precio * tasa de cambio BCV)
        const unitPrice =
          orden.tipoCambio === TipoCambio.bcv
            ? Math.round(item.precio * orden.tasaCambio * 100) / 100
            : item.precio;
        const unitPriceText = unitPrice.toLocaleString("es-VE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        const unitPriceWidth = helveticaFont.widthOfTextAtSize(
          unitPriceText,
          9
        );
        page.drawText(unitPriceText, {
          x: currentX + columnWidths[2] - unitPriceWidth - 34,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[2];
        // Total (cantidad * precio unitario)
        const totalPrice = item.cantidad * unitPrice;
        const totalText = totalPrice.toLocaleString("es-VE", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        const totalWidth = helveticaFont.widthOfTextAtSize(totalText, 9);
        page.drawText(totalText, {
          x: currentX + columnWidths[3] - totalWidth - 90,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[3];
        yPosition -= 17;
        pageItemCount++;
      }

      // Dibujar totales de la página final
      this.drawPageTotals(
        page,
        helveticaFont,
        helveticaBold,
        primaryColor,
        secondaryColor,
        currentPageItems,
        orden.tipoCambio,
        orden.tasaCambio,
        width,
        leftMargin
      );

      // Guardar PDF
      console.log("Saving proforma PDF...");
      const pdfBytes = await pdfDoc.save();
      console.log("Proforma PDF saved successfully");

      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error("Proforma PDF generation error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to generate proforma PDF");
    }
  }

  public async generateMovimientoPDF(movimiento: IMovimiento): Promise<Buffer> {
    try {
      console.log(
        "Starting movimiento PDF generation for movimiento:",
        movimiento.serial
      );

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

      // Movimiento title
      page.drawText("Movimiento:", {
        x: 40,
        y: yPosition,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });
      page.drawText(` #${movimiento.serial}`, {
        x: 40,
        y: yPosition - 20, // Below "Movimiento:"
        size: 12,
        font: helveticaFont,
        color: secondaryColor,
      });

      yPosition -= 30;

      // Movimiento date - right aligned
      const movimientoDate = formatearFecha(movimiento.fechaCreado);

      const fechaLabel = "Fecha:";
      const fechaLabelWidth = helveticaBold.widthOfTextAtSize(fechaLabel, 10);
      const fechaValueWidth = helveticaFont.widthOfTextAtSize(
        ` ${movimientoDate}`,
        10
      );
      const fechaTotalWidth = fechaLabelWidth + fechaValueWidth;

      page.drawText(fechaLabel, {
        x: width - 40 - fechaTotalWidth, // Right aligned with 40px margin
        y: yPosition + 30, // Same Y as movimiento title
        size: 10,
        font: helveticaBold,
        color: primaryColor,
      });
      page.drawText(` ${movimientoDate}`, {
        x: width - 40 - fechaValueWidth, // Right aligned
        y: yPosition + 30, // Same Y as movimiento title
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
      });

      // Estatus - centrado horizontalmente y alineado verticalmente con Fecha
      const estatusLabel = "Estatus:";
      const estatusLabelWidth = helveticaBold.widthOfTextAtSize(
        estatusLabel,
        10
      );
      const estatusValueWidth = helveticaFont.widthOfTextAtSize(
        ` ${movimiento.estatus}`,
        10
      );
      const estatusTotalWidth = estatusLabelWidth + estatusValueWidth;
      const estatusX = (width - estatusTotalWidth) / 2;
      const estatusY = yPosition + 30;
      page.drawText(estatusLabel, {
        x: estatusX,
        y: estatusY,
        size: 10,
        font: helveticaBold,
        color: primaryColor,
      });
      page.drawText(` ${movimiento.estatus}`, {
        x: estatusX + estatusLabelWidth,
        y: estatusY,
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
      });

      // Agregar separación extra antes de almacenes y responsable
      yPosition -= 20;

      // Almacenes Information - Aligned
      const origenSectionX = 40;
      const sectionStartY = yPosition;

      // Origen section (izquierda)
      page.drawText("Almacén Origen:", {
        x: origenSectionX,
        y: sectionStartY,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });

      let origenY = sectionStartY - 17;

      page.drawText(movimiento.origen?.nombre || "", {
        x: origenSectionX,
        y: origenY,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      // Destino section - centered horizontally
      const destinoLabel = "Almacén Destino:";
      const destinoLabelWidth = helveticaBold.widthOfTextAtSize(
        destinoLabel,
        12
      );
      const destinoSectionX = width / 2 - destinoLabelWidth / 2;

      page.drawText(destinoLabel, {
        x: destinoSectionX,
        y: sectionStartY,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });

      let destinoY = sectionStartY - 17;

      const destinoName = movimiento.destino?.nombre || "";
      const destinoNameWidth = helveticaFont.widthOfTextAtSize(destinoName, 10);
      page.drawText(destinoName, {
        x: width / 2 - destinoNameWidth / 2,
        y: destinoY,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      // Responsable section - right aligned, same height as almacenes
      const responsableLabel = "Responsable:";
      const responsableLabelWidth = helveticaBold.widthOfTextAtSize(
        responsableLabel,
        12
      );
      const responsableSectionX = width - 40 - responsableLabelWidth; // 40px margin from right

      page.drawText(responsableLabel, {
        x: responsableSectionX,
        y: sectionStartY,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });

      const responsableName = `${movimiento.usuario?.nombre || ""} ${
        movimiento.usuario?.apellido || ""
      }`;
      const responsableNameWidth = helveticaFont.widthOfTextAtSize(
        responsableName,
        10
      );
      page.drawText(responsableName, {
        x: width - 40 - responsableNameWidth, // Right aligned
        y: sectionStartY - 17,
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      // Reset Y position for items table
      yPosition = sectionStartY - 50;

      // Table headers - Solo Item, Descripción y Cantidad para movimientos
      const itemLabel = movimiento.items.length > 1 ? "Items" : "Item";
      const columnWidths = [35, 440, 60]; // Item, Descripción, Cantidad

      // Draw table headers
      this.drawMovimientoTableHeaders(
        page,
        helveticaBold,
        primaryColor,
        yPosition,
        itemLabel,
        columnWidths
      );

      yPosition -= 25;

      // Items
      let pageItemCount = 0;
      let currentPageItems: typeof movimiento.items = [];
      let pageNumber = 0;
      const maxItemsPerPage = 15; // Adjust based on your needs

      for (let index = 0; index < movimiento.items.length; index++) {
        const item = movimiento.items[index];

        // Nueva página si se excede el máximo
        if (pageItemCount >= maxItemsPerPage) {
          page = pdfDoc.addPage([this.LETTER.width, this.LETTER.height]);
          await this.drawHeader(
            page,
            pdfDoc,
            helveticaFont,
            helveticaBold,
            primaryColor
          );
          yPosition = height - 120;
          pageItemCount = 0;
          currentPageItems = [];
          pageNumber++;

          // Redibujar encabezados
          this.drawMovimientoTableHeaders(
            page,
            helveticaBold,
            primaryColor,
            yPosition,
            itemLabel,
            columnWidths
          );
          yPosition -= 25;
        }

        // Agregar el item a la página actual
        currentPageItems.push(item);
        let currentX = 40;

        // Item number
        const itemNumber = (index + 1).toString();
        const itemNumberWidth = helveticaFont.widthOfTextAtSize(itemNumber, 9);
        page.drawText(itemNumber, {
          x: currentX + columnWidths[0] / 2 - itemNumberWidth / 2,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[0];

        // Product description
        const descripcionX = currentX + 20;
        page.drawText(item.producto?.nombre || "", {
          x: descripcionX,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[1];

        // Quantity
        const cantidadText = item.cantidad.toString();
        const cantidadWidth = helveticaFont.widthOfTextAtSize(cantidadText, 9);
        page.drawText(cantidadText, {
          x: currentX + columnWidths[2] / 2 - cantidadWidth / 2,
          y: yPosition,
          size: 9,
          font: helveticaFont,
          color: primaryColor,
        });

        yPosition -= 15;

        // SKU below product name (alineado con la descripción)
        page.drawText(`SKU: ${item.producto?.sku || ""}`, {
          x: descripcionX,
          y: yPosition,
          size: 8,
          font: helveticaFont,
          color: secondaryColor,
        });

        yPosition -= 12;

        yPosition -= 5;
        pageItemCount++;
      }

      // Total de unidades movidas (al final de la página, centrado)
      const totalUnidades = movimiento.items.reduce(
        (acc, item) => acc + (item.cantidad || 0),
        0
      );
      const totalLabel = "Total de Unidades Movidas:";
      const totalValue = `  ${totalUnidades}`;
      const totalLabelWidth = helveticaBold.widthOfTextAtSize(totalLabel, 10);
      const totalValueWidth = helveticaFont.widthOfTextAtSize(totalValue, 10);
      const totalTextWidth = totalLabelWidth + totalValueWidth;
      const totalY = 40; // 40px desde el borde inferior
      const totalX = (width - totalTextWidth) / 2;
      page.drawText(totalLabel, {
        x: totalX,
        y: totalY,
        size: 10,
        font: helveticaBold,
        color: primaryColor,
      });
      page.drawText(totalValue, {
        x: totalX + totalLabelWidth,
        y: totalY,
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
      });

      // Notes section
      if (movimiento.notas) {
        yPosition -= 40;
        page.drawText("Notas:", {
          x: 40,
          y: yPosition,
          size: 10,
          font: helveticaBold,
          color: primaryColor,
        });
        yPosition -= 15;

        // Simple text wrapping for notes
        const notes = movimiento.notas;
        const maxWidth = width - 80; // 40px margin on each side
        const words = notes.split(" ");
        let currentLine = "";
        let lineY = yPosition;

        for (const word of words) {
          const testLine = currentLine + (currentLine ? " " : "") + word;
          const testWidth = helveticaFont.widthOfTextAtSize(testLine, 9);

          if (testWidth > maxWidth && currentLine) {
            page.drawText(currentLine, {
              x: 40,
              y: lineY,
              size: 9,
              font: helveticaFont,
              color: primaryColor,
            });
            lineY -= 12;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          page.drawText(currentLine, {
            x: 40,
            y: lineY,
            size: 9,
            font: helveticaFont,
            color: primaryColor,
          });
        }
      }

      // Guardar PDF
      console.log("Saving movimiento PDF...");
      const pdfBytes = await pdfDoc.save();
      console.log("Movimiento PDF saved successfully");

      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error("Movimiento PDF generation error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to generate movimiento PDF");
    }
  }

  public async generateGuiaDespachoPDF(orden: IOrden): Promise<Buffer> {
    try {
      console.log(
        "Starting guia de despacho PDF generation for order:",
        orden.serial
      );

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

      // Title and Date section
      const orderDate = new Date(orden.fechaCreado).toLocaleDateString(
        "es-ES",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );

      // Separación extra antes del título principal
      yPosition -= 10;

      // Center the title "Guía de Despacho"
      const titleText = "Guía de Despacho";
      const titleWidth = helveticaBold.widthOfTextAtSize(titleText, 16);
      page.drawText(titleText, {
        x: 40, // Justificado a la izquierda
        y: yPosition,
        size: 16,
        font: helveticaBold,
        color: primaryColor,
      });

      // Date aligned with title
      page.drawText("Fecha:", {
        x: width - 150,
        y: yPosition,
        size: 10,
        font: helveticaBold,
        color: primaryColor,
      });
      page.drawText(` ${orderDate}`, {
        x: width - 150 + 35,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: secondaryColor,
      });

      yPosition -= 40;

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

      // Table headers - Item(s), Descripción, Cantidad
      const itemLabel = orden.items.length > 1 ? "Items" : "Item";
      const columnWidths = [80, width - 80 - 100 - 40 - 40, 100]; // Item, Descripción, Cantidad
      const columnTitles = [itemLabel, "Descripción", "Cantidad"];

      // Draw table headers
      let currentX = 17;
      for (let i = 0; i < columnTitles.length; i++) {
        if (i === 0) {
          // Item/Items header centrado
          const headerWidth = helveticaBold.widthOfTextAtSize(
            columnTitles[0],
            10
          );
          page.drawText(columnTitles[0], {
            x: currentX + columnWidths[0] / 2 - headerWidth / 2,
            y: yPosition,
            size: 10,
            font: helveticaBold,
            color: primaryColor,
          });
        } else if (columnTitles[i] === "Cantidad") {
          // Justifica el header a la derecha de la columna, respetando el margen derecho (40px) y desplazado 5px a la izquierda
          const cantidadWidth = helveticaBold.widthOfTextAtSize(
            columnTitles[i],
            10
          );
          // El borde derecho de la columna de cantidad es width - 40
          page.drawText(columnTitles[i], {
            x: width - 40 - cantidadWidth - 5, // 5px a la izquierda del margen
            y: yPosition,
            size: 10,
            font: helveticaBold,
            color: primaryColor,
          });
        } else {
          // Desplaza Descripción 15px a la izquierda
          page.drawText(columnTitles[i], {
            x: currentX - 15,
            y: yPosition,
            size: 10,
            font: helveticaBold,
            color: primaryColor,
          });
        }
        currentX += columnWidths[i];
      }

      // Draw separator line
      page.drawLine({
        start: { x: 40, y: yPosition - 10 },
        end: { x: page.getSize().width - 40, y: yPosition - 10 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      yPosition -= 25;

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
          // Reset Y position for new page
          yPosition = height - 120;

          // Redraw table headers
          currentX = 17;
          for (let i = 0; i < columnTitles.length; i++) {
            if (i === 0) {
              // Item/Items header centrado
              const headerWidth = helveticaBold.widthOfTextAtSize(
                columnTitles[0],
                10
              );
              page.drawText(columnTitles[0], {
                x: currentX + columnWidths[0] / 2 - headerWidth / 2,
                y: yPosition,
                size: 10,
                font: helveticaBold,
                color: primaryColor,
              });
            } else if (columnTitles[i] === "Cantidad") {
              // Justifica el header a la derecha de la columna, respetando el margen derecho (40px) y desplazado 5px a la izquierda
              const cantidadWidth = helveticaBold.widthOfTextAtSize(
                columnTitles[i],
                10
              );
              // El borde derecho de la columna de cantidad es width - 40
              page.drawText(columnTitles[i], {
                x: width - 40 - cantidadWidth - 5, // 5px a la izquierda del margen
                y: yPosition,
                size: 10,
                font: helveticaBold,
                color: primaryColor,
              });
            } else {
              // Desplaza Descripción 15px a la izquierda
              page.drawText(columnTitles[i], {
                x: currentX - 15,
                y: yPosition,
                size: 10,
                font: helveticaBold,
                color: primaryColor,
              });
            }
            currentX += columnWidths[i];
          }

          // Draw separator line
          page.drawLine({
            start: { x: 40, y: yPosition - 10 },
            end: { x: page.getSize().width - 40, y: yPosition - 10 },
            thickness: 1,
            color: rgb(0.8, 0.8, 0.8),
          });

          yPosition -= 25;
        }

        currentX = 17;

        // Descripción (nombre)
        let descY = yPosition;
        // Item number (centrado igual que header)
        const itemNumber = (index + 1).toString();
        const itemNumberWidth = helveticaFont.widthOfTextAtSize(itemNumber, 10);
        page.drawText(itemNumber, {
          x: 17 + columnWidths[0] / 2 - itemNumberWidth / 2, // centrado normal
          y: descY,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX = 17 + columnWidths[0];
        // Desplaza Descripción 15px a la izquierda
        const descripcionX = currentX - 15;
        page.drawText(item.producto.nombre, {
          x: descripcionX,
          y: descY,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });
        yPosition -= 15;

        // SKU debajo del nombre, alineado con descripción
        page.drawText(`SKU: ${item.producto.sku}`, {
          x: descripcionX,
          y: yPosition,
          size: 8,
          font: helveticaFont,
          color: secondaryColor,
        });
        yPosition -= 12;

        // Notas si existen, alineadas con descripción
        if (item.notas) {
          page.drawText(`Notas: ${item.notas}`, {
            x: descripcionX,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: secondaryColor,
          });
          yPosition -= 12;
        }

        // Cantidad (centrada en la columna de cantidad, ajuste fino a la derecha)
        const cantidadText = item.cantidad.toString();
        const cantidadTextWidth = helveticaFont.widthOfTextAtSize(
          cantidadText,
          10
        );
        // Ajuste: centramos respecto al borde derecho (width - 40 - 5) menos 1/6 del ancho de la columna
        const cantidadColRight = width - 40 - 8;
        const cantidadColCenter = cantidadColRight - columnWidths[2] / 6;
        page.drawText(cantidadText, {
          x: cantidadColCenter - cantidadTextWidth / 2,
          y: descY,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });

        yPosition -= 5;
      }

      // Al final de la página, mostrar el Total de Piezas igual que en Orden PDF
      const totalPiezas = orden.items.reduce(
        (sum, item) => sum + item.cantidad,
        0
      );
      const totalPiezasLabel = "TOTAL Piezas:";
      const totalPiezasLabelWidth = helveticaBold.widthOfTextAtSize(
        totalPiezasLabel,
        10
      );
      const totalPiezasX = (width - totalPiezasLabelWidth) / 2;
      page.drawText(totalPiezasLabel, {
        x: totalPiezasX,
        y: 30, // antes 40
        size: 10,
        font: helveticaBold,
        color: primaryColor,
      });
      const totalPiezasText = totalPiezas.toString();
      const totalPiezasTextWidth = helveticaFont.widthOfTextAtSize(
        totalPiezasText,
        10
      );
      page.drawText(totalPiezasText, {
        x: totalPiezasX + (totalPiezasLabelWidth - totalPiezasTextWidth) / 2,
        y: 17, // antes 27
        size: 10,
        font: helveticaFont,
        color: primaryColor,
      });

      // Save the PDF
      console.log("Saving guia de despacho PDF...");
      const pdfBytes = await pdfDoc.save();
      console.log("Guia de despacho PDF saved successfully");

      return Buffer.from(pdfBytes);
    } catch (error) {
      console.error("Guia de despacho PDF generation error:", error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to generate guia de despacho PDF");
    }
  }
}
