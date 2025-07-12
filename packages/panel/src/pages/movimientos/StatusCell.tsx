import React from "react";
import { IMovimiento, IUsuario } from "shared/interfaces";
import { EstatusMovimiento } from "shared/enums";
import { Badge } from "@/components/ui/badge";
import { getEstatusMovimientoColor, isSuperAdmin } from "shared/helpers";
import { useMovimientosStore } from "@/store/movimientos.store";
import { useAuthStore } from "@/store/auth.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Status order mapping for movements
const estatusMovimientoOrden: Record<EstatusMovimiento, number> = {
  [EstatusMovimiento.pendiente]: 1,
  [EstatusMovimiento.aprobado]: 2,
  [EstatusMovimiento.transito]: 3,
  [EstatusMovimiento.recibido]: 4,
  [EstatusMovimiento.anulado]: 0,
};

// Helper function to check if user can update movement status
const canUpdateMovimientoStatus = (user: IUsuario | null): boolean => {
  if (!user) return false;
  return isSuperAdmin(user);
};

// Helper function to get allowed statuses for movements
const getAllowedMovimientoStatuses = (): EstatusMovimiento[] => {
  return [
    EstatusMovimiento.pendiente,
    EstatusMovimiento.aprobado,
    EstatusMovimiento.transito,
    EstatusMovimiento.recibido,
    EstatusMovimiento.anulado,
  ];
};

// Helper function to check if a status is disabled
const isMovimientoStatusDisabled = ({
  est,
  estatusOrden,
  estatusActualNivel,
}: {
  est: EstatusMovimiento;
  estatusOrden: Record<EstatusMovimiento, number>;
  estatusActualNivel: number;
}): boolean => {
  const estatusNivel = estatusOrden[est];

  // Anulado siempre está disponible
  if (est === EstatusMovimiento.anulado) {
    return false;
  }

  // Si el estatus actual es Anulado, permitir volver a Pendiente
  if (estatusActualNivel === 0 && est === EstatusMovimiento.pendiente) {
    return false;
  }

  // No permitir retroceder a estados anteriores (excepto desde Anulado)
  if (estatusNivel < estatusActualNivel && estatusActualNivel !== 0) {
    return true;
  }

  // No permitir saltar más de un nivel
  if (estatusNivel > estatusActualNivel + 1) {
    return true;
  }

  return false;
};

interface StatusCellProps {
  movimiento: IMovimiento;
}

export const StatusCell: React.FC<StatusCellProps> = ({ movimiento }) => {
  const { user } = useAuthStore();
  const canUpdate = canUpdateMovimientoStatus(user);
  const { updateMovimientoStatus, loading } = useMovimientosStore();

  // Get current status level
  const estatusActualNivel = estatusMovimientoOrden[movimiento.estatus];

  return canUpdate ? (
    <Select
      value={movimiento.estatus || EstatusMovimiento.pendiente}
      onValueChange={(value) => {
        updateMovimientoStatus(movimiento.id, value as EstatusMovimiento);
      }}
      disabled={loading}
    >
      <SelectTrigger
        className={`${getEstatusMovimientoColor(movimiento.estatus)}`}
      >
        <SelectValue>
          {movimiento.estatus || EstatusMovimiento.pendiente}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {getAllowedMovimientoStatuses().map((est) => (
          <SelectItem
            key={est}
            value={est}
            disabled={isMovimientoStatusDisabled({
              est,
              estatusOrden: estatusMovimientoOrden,
              estatusActualNivel,
            })}
          >
            {est}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Badge className={getEstatusMovimientoColor(movimiento.estatus)}>
      {movimiento.estatus || EstatusMovimiento.pendiente}
    </Badge>
  );
};
