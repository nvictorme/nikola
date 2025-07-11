import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { IMovimiento } from "shared/interfaces";
import { formatearFecha } from "shared/helpers";
import React from "react";

interface MovimientoPreviewProps {
  movimiento: IMovimiento;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MovimientoPreview = ({
  movimiento,
  open,
  onOpenChange,
}: MovimientoPreviewProps) => {
  if (!movimiento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[650px] max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">
          Movimiento #{movimiento.serial}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Fecha: {formatearFecha(movimiento.fechaCreado)}
        </DialogDescription>

        <div className="overflow-y-auto p-8">
          {/* Header Section */}
          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Movimiento #{movimiento.serial}
                </h2>
                <span className="text-base text-gray-500">
                  <span className="font-semibold">Estatus:</span>{" "}
                  {movimiento.estatus}
                </span>
              </div>
              <div className="text-right text-base">
                <p className="font-semibold">Fecha de Movimiento:</p>
                <p>{formatearFecha(movimiento.fechaCreado)}</p>
              </div>
            </div>
          </div>

          {/* Almacenes y Usuario en la misma fila */}
          <div className="grid grid-cols-3 gap-8 mb-8">
            <div className="text-left">
              <h3 className="font-semibold mb-3">Almacén Origen:</h3>
              <p className="text-sm">{movimiento.origen?.nombre}</p>
            </div>
            <div className="text-center">
              <h3 className="font-semibold mb-3">Almacén Destino:</h3>
              <p className="text-sm">{movimiento.destino?.nombre}</p>
            </div>
            <div className="text-right">
              <h3 className="font-semibold mb-3">Responsable:</h3>
              <p className="text-sm">
                {movimiento.usuario?.nombre} {movimiento.usuario?.apellido}
              </p>
            </div>
          </div>

          {/* Separador antes de productos */}
          <div className="border-t pt-0 mb-8">
            <div className="grid grid-cols-[1fr_6rem] items-center h-12 border-b font-semibold text-base">
              <div>Producto</div>
              <div className="text-center">Cantidad</div>
            </div>
            <div>
              {(movimiento.items || []).map((item, idx, arr) => (
                <React.Fragment key={item.id}>
                  <div className="grid grid-cols-[1fr_6rem] items-start py-4">
                    <div>
                      <p className="text-sm font-normal">
                        {item.producto?.nombre}
                      </p>
                      {item.producto?.sku && (
                        <p className="text-xs font-medium text-gray-600">
                          {item.producto.sku}
                        </p>
                      )}
                      {item.notas && (
                        <p className="text-sm text-blue-500 mt-1 whitespace-pre-line">
                          {item.notas}
                        </p>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="block font-normal">{item.cantidad}</span>
                    </div>
                  </div>
                  {idx < arr.length && (
                    <hr className="my-2 border-t border-gray-200" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Total de Unidades movidas */}
          <div className="text-center mb-4">
            <span className="font-semibold text-base">
              Unidades Movidas:&nbsp;
            </span>
            <span className="text-base">
              {(movimiento.items || []).reduce(
                (acc, item) => acc + (item.cantidad || 0),
                0
              )}
            </span>
          </div>

          {/* Notas */}
          {movimiento.notas && (
            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Notas:</h3>
              <p className="text-sm">{movimiento.notas}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
