import { EstatusOrden, TipoOrden } from "shared/enums";
import { IOrden } from "shared/interfaces";
import { ApiClient } from "@/api/api.client";
import { toast as toastFn } from "@/hooks/use-toast";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

// Helper to get allowed statuses by order type
export function getAllowedStatuses(orden: IOrden): EstatusOrden[] {
  if (orden.tipo === TipoOrden.cotizacion) {
    return [EstatusOrden.aprobado, EstatusOrden.rechazado];
  }
  if (orden.tipo === TipoOrden.reposicion) {
    return [
      EstatusOrden.aprobado,
      EstatusOrden.confirmado,
      EstatusOrden.enviado,
      EstatusOrden.recibido,
      EstatusOrden.cancelado,
    ];
  }
  if (orden.tipo === TipoOrden.venta || orden.tipo === TipoOrden.credito) {
    return [
      EstatusOrden.aprobado,
      EstatusOrden.rechazado,
      EstatusOrden.confirmado,
      EstatusOrden.entregado,
      EstatusOrden.cancelado,
    ];
  }
  return Object.values(EstatusOrden) as EstatusOrden[];
}

interface StatusDisabledParams {
  est: EstatusOrden;
  orden: IOrden;
  estatusOrden: Record<EstatusOrden, number>;
  estatusActualNivel: number;
}

// Helper to determine if a status should be disabled
export function isStatusDisabled({
  est,
  orden,
  estatusOrden,
  estatusActualNivel,
}: StatusDisabledParams): boolean {
  // Deshabilitar entregado si es orden de reposición
  if (est === EstatusOrden.entregado && orden.tipo === TipoOrden.reposicion)
    return true;
  // Deshabilitar estados especiales después de cierto nivel
  if (estatusOrden[est] === 0 && estatusActualNivel > 2) return true;
  // Deshabilitar estados anteriores
  if (estatusOrden[est] !== 0 && estatusOrden[est] < estatusActualNivel)
    return true;
  // --- Reglas especiales para venta y crédito ---
  if (orden.tipo === TipoOrden.venta || orden.tipo === TipoOrden.credito) {
    // Si el estatus actual es aprobado, deshabilitar entregado
    if (
      orden.estatus === EstatusOrden.aprobado &&
      est === EstatusOrden.entregado
    )
      return true;
    // Si el estatus actual es rechazado, deshabilitar confirmado, entregado y cancelado
    if (
      orden.estatus === EstatusOrden.rechazado &&
      (est === EstatusOrden.confirmado ||
        est === EstatusOrden.entregado ||
        est === EstatusOrden.cancelado)
    )
      return true;
    // Si el estatus actual es cancelado, deshabilitar rechazado, confirmado y entregado
    if (
      orden.estatus === EstatusOrden.cancelado &&
      (est === EstatusOrden.rechazado ||
        est === EstatusOrden.confirmado ||
        est === EstatusOrden.entregado)
    )
      return true;
  }
  // --- Reglas especiales para reposición ---
  if (orden.tipo === TipoOrden.reposicion) {
    // Si el estatus actual es aprobado, deshabilitar enviado y recibido
    if (
      orden.estatus === EstatusOrden.aprobado &&
      (est === EstatusOrden.enviado || est === EstatusOrden.recibido)
    )
      return true;
    // Si el estatus actual es cancelado, deshabilitar confirmado, enviado y recibido
    if (
      orden.estatus === EstatusOrden.cancelado &&
      (est === EstatusOrden.confirmado ||
        est === EstatusOrden.enviado ||
        est === EstatusOrden.recibido)
    )
      return true;
  }
  // --- Fin reglas especiales ---
  return false;
}

// Validation function - Single responsibility: validate input data
export const validateOrderForPDF = (
  orden: IOrden
): { isValid: boolean; error?: string } => {
  if (!orden.id) {
    return {
      isValid: false,
      error: "No se pudo generar el PDF: ID de orden no válido",
    };
  }
  return { isValid: true };
};

// API function - Single responsibility: fetch PDF from API
export const fetchOrderPDF = async (orderId: string): Promise<Blob> => {
  const apiClient = new ApiClient();
  const response = await apiClient.getBinary(`/ordenes/${orderId}/pdf`, {});
  return new Blob([response.data], { type: "application/pdf" });
};

// API function - Single responsibility: fetch Proforma PDF from API
export const fetchProformaPDF = async (orderId: string): Promise<Blob> => {
  const apiClient = new ApiClient();
  const response = await apiClient.getBinary(
    `/ordenes/${orderId}/proforma`,
    {}
  );
  return new Blob([response.data], { type: "application/pdf" });
};

// API function - Single responsibility: fetch Guia de Despacho PDF from API
export const fetchGuiaDespachoPDF = async (orderId: string): Promise<Blob> => {
  const apiClient = new ApiClient();
  const response = await apiClient.getBinary(
    `/ordenes/${orderId}/guia-despacho`,
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
  orderSerial?: string,
  errorMessage?: string,
  pdfType: string = "PDF"
): void => {
  if (isSuccess) {
    toast({
      title: `${pdfType} Generado`,
      description: `El ${pdfType} de la orden #${orderSerial} se ha descargado exitosamente`,
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
export const handleGeneratePDF = async (orden: IOrden) => {
  // Validate input
  const validation = validateOrderForPDF(orden);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  try {
    // Fetch PDF from API
    const pdfBlob = await fetchOrderPDF(orden.id!.toString());

    // Download the file
    downloadPDF(pdfBlob, `orden-${orden.serial}.pdf`);

    // Return success info for the hook to handle
    return { success: true, orderSerial: orden.serial.toString() };
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};

// Main orchestrator function - Single responsibility: coordinate the Proforma PDF generation process
export const handleGenerateProformaPDF = async (orden: IOrden) => {
  // Validate input
  const validation = validateOrderForPDF(orden);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  try {
    // Fetch PDF from API
    const pdfBlob = await fetchProformaPDF(orden.id!.toString());

    // Download the file
    downloadPDF(pdfBlob, `factura-proforma-${orden.serial}.pdf`);

    // Return success info for the hook to handle
    return { success: true, orderSerial: orden.serial.toString() };
  } catch (error) {
    console.error("Error generating Proforma PDF:", error);
    throw error;
  }
};

// Main orchestrator function - Single responsibility: coordinate the Guia de Despacho PDF generation process
export const handleGenerateGuiaDespachoPDF = async (orden: IOrden) => {
  // Validate input
  const validation = validateOrderForPDF(orden);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  try {
    // Fetch PDF from API
    const pdfBlob = await fetchGuiaDespachoPDF(orden.id!.toString());

    // Download the file
    downloadPDF(pdfBlob, `guia-despacho-${orden.serial}.pdf`);

    // Return success info for the hook to handle
    return { success: true, orderSerial: orden.serial.toString() };
  } catch (error) {
    console.error("Error generating Guia de Despacho PDF:", error);
    throw error;
  }
};

// Custom hook that handles PDF generation with toast notifications and loading state
export const useGeneratePDF = () => {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const generatePDF = async (orden: IOrden) => {
    try {
      setIsGeneratingPDF(true);
      const result = await handleGeneratePDF(orden);
      notifyPDFGeneration(toast, true, result.orderSerial);
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

// Custom hook that handles Proforma PDF generation with toast notifications and loading state
export const useGenerateProformaPDF = () => {
  const { toast } = useToast();
  const [isGeneratingProformaPDF, setIsGeneratingProformaPDF] = useState(false);

  const generateProformaPDF = async (orden: IOrden) => {
    try {
      setIsGeneratingProformaPDF(true);
      const result = await handleGenerateProformaPDF(orden);
      notifyPDFGeneration(toast, true, result.orderSerial, "Factura Proforma");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo generar la Factura Proforma. Inténtalo de nuevo.";
      notifyPDFGeneration(toast, false, undefined, errorMessage);
    } finally {
      setIsGeneratingProformaPDF(false);
    }
  };

  return { generateProformaPDF, isGeneratingProformaPDF };
};

// Custom hook that handles Guia de Despacho PDF generation with toast notifications and loading state
export const useGenerateGuiaDespachoPDF = () => {
  const { toast } = useToast();
  const [isGeneratingGuiaDespachoPDF, setIsGeneratingGuiaDespachoPDF] =
    useState(false);

  const generateGuiaDespachoPDF = async (orden: IOrden) => {
    try {
      setIsGeneratingGuiaDespachoPDF(true);
      const result = await handleGenerateGuiaDespachoPDF(orden);
      notifyPDFGeneration(toast, true, result.orderSerial, "Guía de Despacho");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "No se pudo generar la Guía de Despacho. Inténtalo de nuevo.";
      notifyPDFGeneration(toast, false, undefined, errorMessage);
    } finally {
      setIsGeneratingGuiaDespachoPDF(false);
    }
  };

  return { generateGuiaDespachoPDF, isGeneratingGuiaDespachoPDF };
};
