import path from "path";
import fs from "fs/promises";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { IOrden } from "shared/interfaces";
import { TipoCambio } from "shared/enums";

export class GuiaDespachoPDFProvider {
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
