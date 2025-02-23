import { PeriodosGarantia } from "shared/enums";
import path from "path";
import { ItemOrden } from "../../orm/entity/itemOrden";
import { AppDataSource } from "../../orm/data-source";
import { PDFDocument } from "pdf-lib";
import * as qrcode from "qrcode";
import fs from "fs/promises";
import { Certificado } from "../../orm/entity/certificado";

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

  private getTemplatePath(garantia: PeriodosGarantia): string {
    const templateMap = {
      [PeriodosGarantia.un_año]: "cert_1_ano.pdf",
      [PeriodosGarantia.dos_años]: "cert_2_anos.pdf",
      [PeriodosGarantia.seis_meses]: "cert_6_meses.pdf",
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

      // Get the ItemOrden from database
      const certificadoRepository = AppDataSource.getRepository(Certificado);
      const certificado = await certificadoRepository.findOne({
        where: { item: { id: itemId } },
        relations: [
          "item",
          "item.producto",
          "orden",
          "orden.cliente",
          "orden.vendedor",
        ],
      });

      if (!certificado) {
        throw new Error("Item not found");
      }

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
}
