import { Router, Request, Response } from "express";
import { PDFProvider } from "../../providers/pdf/pdf";

const CertificadosRouter = Router();

CertificadosRouter.get("/:itemId", async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;
    console.log("Received request for certificate with itemId:", itemId);

    const pdfProvider = new PDFProvider();

    const pdfBuffer = await pdfProvider.generatePDF({ itemId });
    console.log("PDF generated successfully");

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename=certificado-garantia-${itemId}.pdf`
    );
    res.status(200).send(pdfBuffer);
  } catch (error: unknown) {
    console.error("Error generating PDF:", error);
    if (error instanceof Error) {
      const errorMessage = error.message;
      console.error("Error message:", errorMessage);
      console.error("Error stack:", error.stack);

      if (errorMessage === "Item not found") {
        res.status(404).json({ error: "Item not found" });
      } else if (
        errorMessage ===
        "No certificate template available for this warranty period"
      ) {
        res.status(400).json({ error: "Invalid warranty period" });
      } else if (errorMessage.includes("Template file not found")) {
        res.status(500).json({
          error: "Template file not found",
          details: errorMessage,
        });
      } else {
        res.status(500).json({
          error: "Failed to generate PDF",
          details: errorMessage,
        });
      }
    } else {
      res.status(500).json({ error: "An unknown error occurred" });
    }
  }
});

export { CertificadosRouter };
