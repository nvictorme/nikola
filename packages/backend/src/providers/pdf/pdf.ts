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
import { TipoDescuento, TipoOrden } from "shared/enums";

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
      left: 72, // 1 inch from left
      right: 612 - 72, // 1 inch from right
    },
  };

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
      const accentColor = rgb(0.1, 0.4, 0.7);

      let yPosition = height - 72; // Start 1 inch from top

      // Header
      page.drawText("NIKOLA", {
        x: 72,
        y: yPosition,
        size: 24,
        font: helveticaBold,
        color: accentColor,
      });

      yPosition -= 40;

      // Order title
      page.drawText(`${orden.tipo} #${orden.serial}`, {
        x: 72,
        y: yPosition,
        size: 18,
        font: helveticaBold,
        color: primaryColor,
      });

      yPosition -= 30;

      // Order date
      const orderDate = new Date(orden.fechaCreado).toLocaleDateString(
        "es-ES",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      );
      page.drawText(`Fecha: ${orderDate}`, {
        x: 72,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: secondaryColor,
      });

      // Order type and validity (if applicable)
      if (
        orden.tipo === TipoOrden.credito ||
        orden.tipo === TipoOrden.cotizacion
      ) {
        if (orden.validez) {
          page.drawText(
            `Validez: ${orden.validez} día${orden.validez > 1 ? "s" : ""}`,
            {
              x: 250,
              y: yPosition,
              size: 12,
              font: helveticaFont,
              color: secondaryColor,
            }
          );
        }
      }

      yPosition -= 50;

      // Client and Seller Information
      const clientSectionX = 72;
      const sellerSectionX = 350;

      // Client section
      page.drawText("CLIENTE", {
        x: clientSectionX,
        y: yPosition,
        size: 14,
        font: helveticaBold,
        color: primaryColor,
      });

      yPosition -= 20;

      const clientName = orden.cliente?.empresa
        ? orden.cliente.empresa
        : `${orden.cliente?.nombre} ${orden.cliente?.apellido}`;

      page.drawText(clientName, {
        x: clientSectionX,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: primaryColor,
      });

      yPosition -= 15;

      if (orden.cliente?.empresa) {
        page.drawText(`${orden.cliente?.nombre} ${orden.cliente?.apellido}`, {
          x: clientSectionX,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: secondaryColor,
        });
        yPosition -= 15;
      }

      if (orden.cliente?.telefono) {
        page.drawText(`Tel: ${orden.cliente.telefono}`, {
          x: clientSectionX,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: secondaryColor,
        });
        yPosition -= 15;
      }

      // Reset Y position for seller section
      yPosition = height - 162;

      // Seller section
      page.drawText("VENDEDOR", {
        x: sellerSectionX,
        y: yPosition,
        size: 14,
        font: helveticaBold,
        color: primaryColor,
      });

      yPosition -= 20;

      const sellerName = orden.vendedor.empresa
        ? orden.vendedor.empresa
        : `${orden.vendedor.nombre} ${orden.vendedor.apellido}`;

      page.drawText(sellerName, {
        x: sellerSectionX,
        y: yPosition,
        size: 12,
        font: helveticaFont,
        color: primaryColor,
      });

      yPosition -= 15;

      if (orden.vendedor.empresa) {
        page.drawText(`${orden.vendedor.nombre} ${orden.vendedor.apellido}`, {
          x: sellerSectionX,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: secondaryColor,
        });
        yPosition -= 15;
      }

      if (orden.vendedor.telefono) {
        page.drawText(`Tel: ${orden.vendedor.telefono}`, {
          x: sellerSectionX,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: secondaryColor,
        });
      }

      // Reset Y position for items table
      yPosition = height - 280;

      // Items table header
      page.drawText("PRODUCTOS", {
        x: 72,
        y: yPosition,
        size: 14,
        font: helveticaBold,
        color: primaryColor,
      });

      yPosition -= 25;

      // Table headers
      const tableHeaders = [
        "Producto",
        "SKU",
        "Cantidad",
        "Precio Unit.",
        "Total",
      ];
      const columnWidths = [200, 80, 60, 80, 80];
      let currentX = 72;

      tableHeaders.forEach((header, index) => {
        page.drawText(header, {
          x: currentX,
          y: yPosition,
          size: 10,
          font: helveticaBold,
          color: primaryColor,
        });
        currentX += columnWidths[index];
      });

      yPosition -= 20;

      // Draw separator line
      page.drawLine({
        start: { x: 72, y: yPosition },
        end: { x: width - 72, y: yPosition },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });

      yPosition -= 15;

      // Items
      orden.items.forEach((item) => {
        // Check if we need a new page
        if (yPosition < 150) {
          page = pdfDoc.addPage([this.LETTER.width, this.LETTER.height]);
          yPosition = height - 72;
        }

        currentX = 72;

        // Product name
        page.drawText(item.producto.nombre, {
          x: currentX,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[0];

        // SKU
        page.drawText(item.producto.sku, {
          x: currentX,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: secondaryColor,
        });
        currentX += columnWidths[1];

        // Quantity
        page.drawText(item.cantidad.toString(), {
          x: currentX,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[2];

        // Unit price
        page.drawText(currencyFormat({ value: item.precio }), {
          x: currentX,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });
        currentX += columnWidths[3];

        // Total
        page.drawText(currencyFormat({ value: item.precio * item.cantidad }), {
          x: currentX,
          y: yPosition,
          size: 10,
          font: helveticaFont,
          color: primaryColor,
        });

        yPosition -= 15;

        // Item notes if any
        if (item.notas) {
          page.drawText(`Notas: ${item.notas}`, {
            x: 72,
            y: yPosition,
            size: 8,
            font: helveticaFont,
            color: secondaryColor,
          });
          yPosition -= 12;
        }

        yPosition -= 5;
      });

      // Reset Y position for totals
      yPosition = height - 500;

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

      // Subtotal
      page.drawText("Subtotal:", {
        x: totalsX,
        y: totalsY,
        size: 12,
        font: helveticaFont,
        color: primaryColor,
      });
      page.drawText(currencyFormat({ value: orden.subtotal }), {
        x: totalsX + 80,
        y: totalsY,
        size: 12,
        font: helveticaFont,
        color: primaryColor,
      });

      totalsY -= 20;

      // Discount if applicable
      if (orden.descuento > 0) {
        const discountText =
          orden.tipoDescuento === TipoDescuento.porcentual
            ? `Descuento (${orden.descuento}%):`
            : "Descuento:";

        page.drawText(discountText, {
          x: totalsX,
          y: totalsY,
          size: 12,
          font: helveticaFont,
          color: rgb(0.8, 0.2, 0.2),
        });

        const discountAmount =
          orden.tipoDescuento === TipoDescuento.porcentual
            ? (orden.subtotal * orden.descuento) / 100
            : orden.descuento;

        page.drawText(`-${currencyFormat({ value: discountAmount })}`, {
          x: totalsX + 80,
          y: totalsY,
          size: 12,
          font: helveticaFont,
          color: rgb(0.8, 0.2, 0.2),
        });

        totalsY -= 20;
      }

      // Credit if applicable
      if (orden.credito > 0) {
        page.drawText("Crédito aplicado:", {
          x: totalsX,
          y: totalsY,
          size: 12,
          font: helveticaFont,
          color: rgb(0.8, 0.2, 0.2),
        });
        page.drawText(`-${currencyFormat({ value: orden.credito })}`, {
          x: totalsX + 80,
          y: totalsY,
          size: 12,
          font: helveticaFont,
          color: rgb(0.8, 0.2, 0.2),
        });
        totalsY -= 20;
      }

      // Total separator line
      page.drawLine({
        start: { x: totalsX, y: totalsY - 5 },
        end: { x: totalsX + 120, y: totalsY - 5 },
        thickness: 1,
        color: primaryColor,
      });

      totalsY -= 15;

      // Final total
      page.drawText("TOTAL:", {
        x: totalsX,
        y: totalsY,
        size: 14,
        font: helveticaBold,
        color: primaryColor,
      });
      page.drawText(currencyFormat({ value: totalConCredito }), {
        x: totalsX + 80,
        y: totalsY,
        size: 14,
        font: helveticaBold,
        color: primaryColor,
      });

      // BCV rate if applicable
      if (orden.tipoCambio === "BCV") {
        totalsY -= 20;
        page.drawText("Total en VES:", {
          x: totalsX,
          y: totalsY,
          size: 10,
          font: helveticaFont,
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
        yPosition = height - 650;
        page.drawText("NOTAS:", {
          x: 72,
          y: yPosition,
          size: 12,
          font: helveticaBold,
          color: primaryColor,
        });

        yPosition -= 20;

        // Split notes into lines if too long
        const maxWidth = width - 144; // 72px margins on each side
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

        lines.forEach((line) => {
          if (yPosition < 100) {
            page = pdfDoc.addPage([this.LETTER.width, this.LETTER.height]);
            yPosition = height - 72;
          }

          page.drawText(line, {
            x: 72,
            y: yPosition,
            size: 10,
            font: helveticaFont,
            color: secondaryColor,
          });
          yPosition -= 15;
        });
      }

      // Status at the bottom
      const statusY = 120;
      page.drawText("Estado:", {
        x: 72,
        y: statusY,
        size: 12,
        font: helveticaBold,
        color: primaryColor,
      });
      page.drawText(orden.estatus, {
        x: 120,
        y: statusY,
        size: 12,
        font: helveticaFont,
        color: secondaryColor,
      });

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
