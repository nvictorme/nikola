import { EstatusOrden, TipoOrden } from "shared/enums";
import { IOrden } from "shared/interfaces";
import { ApiClient } from "@/api/api.client";
import { toast as toastFn } from "@/hooks/use-toast";

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

export const handleGeneratePDF = async (
  orden: IOrden,
  toast: typeof toastFn,
  setIsGeneratingPDF: (value: boolean) => void
) => {
  if (!orden.id) {
    toast({
      title: "Error",
      description: "No se pudo generar el PDF: ID de orden no válido",
      variant: "destructive",
    });
    return;
  }

  setIsGeneratingPDF(true);
  try {
    const apiClient = new ApiClient();
    const response = await apiClient.getBinary(`/ordenes/${orden.id}/pdf`, {});

    // Create blob from response
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement("a");
    link.href = url;
    link.download = `orden-${orden.serial}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast({
      title: "PDF Generado",
      description: `El PDF de la orden #${orden.serial} se ha descargado exitosamente`,
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    toast({
      title: "Error",
      description: "No se pudo generar el PDF. Inténtalo de nuevo.",
      variant: "destructive",
    });
  } finally {
    setIsGeneratingPDF(false);
  }
};
