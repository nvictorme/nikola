import { IMovimiento } from "shared/interfaces";
import { ApiClient } from "@/api/api.client";
import { toast as toastFn } from "@/hooks/use-toast";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Validation function - Single responsibility: validate input data
export const validateMovimientoForPDF = (
  movimiento: IMovimiento
): { isValid: boolean; error?: string } => {
  if (!movimiento.id) {
    return {
      isValid: false,
      error: "No se pudo generar el PDF: ID de movimiento no válido",
    };
  }
  return { isValid: true };
};

// API function - Single responsibility: fetch PDF from API
export const fetchMovimientoPDF = async (
  movimientoId: string
): Promise<Blob> => {
  const apiClient = new ApiClient();
  const response = await apiClient.getBinary(
    `/movimientos/${movimientoId}/pdf`,
    {}
  );
  return new Blob([response.data], { type: "application/pdf" });
};

// Download function - Single responsibility: handle file download
export const downloadPDF = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// UI notification function - Single responsibility: handle user notifications
export const notifyPDFGeneration = (
  toast: typeof toastFn,
  isSuccess: boolean,
  movimientoSerial?: string,
  errorMessage?: string,
  pdfType: string = "PDF"
): void => {
  if (isSuccess) {
    toast({
      title: `${pdfType} Generado`,
      description: `El ${pdfType} del movimiento #${movimientoSerial} se ha descargado exitosamente`,
    });
  } else {
    toast({
      title: "Error",
      description:
        errorMessage || `No se pudo generar el ${pdfType}. Inténtalo de nuevo.`,
      variant: "destructive",
    });
  }
};

// Main orchestrator function - Single responsibility: coordinate the PDF generation process
export const handleGenerateMovimientoPDF = async (movimiento: IMovimiento) => {
  // Validate input
  const validation = validateMovimientoForPDF(movimiento);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  try {
    // Fetch PDF from API
    const pdfBlob = await fetchMovimientoPDF(movimiento.id!.toString());

    // Download the file
    downloadPDF(pdfBlob, `movimiento-${movimiento.serial}.pdf`);

    // Return success info for the hook to handle
    return { success: true, movimientoSerial: movimiento.serial.toString() };
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Custom hook that handles PDF generation with toast notifications and loading state
export const useGenerateMovimientoPDF = () => {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async (movimiento: IMovimiento) => {
    try {
      setIsGeneratingPDF(true);
      const result = await handleGenerateMovimientoPDF(movimiento);
      notifyPDFGeneration(toast, true, result.movimientoSerial);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo generar el PDF. Inténtalo de nuevo.";
      notifyPDFGeneration(toast, false, undefined, errorMessage);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return { generatePDF, isGeneratingPDF };
};
