import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { IOrden } from "shared/interfaces";
import { currencyFormat, calcularTotalOrden } from "shared/helpers";
import { TipoDescuento, TipoOrden } from "shared/enums";

interface OrdenPreviewProps {
  orden: IOrden;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OrdenPreview = ({
  orden,
  open,
  onOpenChange,
}: OrdenPreviewProps) => {
  if (!orden) return null;

  const totalConCredito = calcularTotalOrden({
    subtotal: orden.subtotal,
    descuento: orden.descuento,
    tipoDescuento: orden.tipoDescuento!,
    impuesto: orden.impuesto,
    credito: orden.credito,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[850px] max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Orden #{orden.serial}</DialogTitle>
        <DialogDescription className="sr-only">
          Fecha: {new Date(orden.fechaCreado).toLocaleDateString()}
        </DialogDescription>

        {/* Scrollable container */}
        <div className="overflow-y-auto p-8">
          {/* Header Section */}
          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Orden #{orden.serial}
                </h2>
                <span className="text-sm text-gray-500">
                  Tipo: {orden.tipo}
                </span>
              </div>
              <div className="text-right">
                <p className="font-semibold">Fecha de Orden:</p>
                <p>{new Date(orden.fechaCreado).toLocaleDateString()}</p>
                {orden.tipoCambio === "BCV" && (
                  <p className="text-sm text-gray-500 mt-1">
                    Tasa BCV: {orden.tasaCambio}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Company and Client Info Section */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            {orden.tipo !== TipoOrden.reposicion ? (
              <div className="text-left">
                <h3 className="font-semibold text-gray-700 mb-3">Cliente:</h3>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {orden.cliente?.empresa
                      ? orden.cliente?.empresa
                      : `${orden.cliente?.nombre} ${orden.cliente?.apellido}`}
                  </p>
                  {orden.cliente?.empresa ? (
                    <p className="text-sm">
                      {orden.cliente?.nombre} {orden.cliente?.apellido}
                    </p>
                  ) : null}
                  <p className="text-sm">{orden.cliente?.email}</p>
                  <p className="text-sm">{orden.cliente?.telefono}</p>
                </div>
              </div>
            ) : (
              <div className="text-left">
                <h3 className="font-semibold text-gray-700 mb-3">Proveedor:</h3>
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {orden.proveedor?.nombre}
                  </p>
                  <p className="text-sm">{orden.proveedor?.marca}</p>
                  <p className="text-sm">{orden.proveedor?.direccion}</p>
                  <p className="text-sm">{orden.proveedor?.telefono}</p>
                  <p className="text-sm">{orden.proveedor?.email}</p>
                  {orden.proveedor?.notas && (
                    <p className="text-sm text-gray-500">
                      {orden.proveedor.notas}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="text-right">
              <h3 className="font-semibold text-gray-700 mb-3">Vendedor:</h3>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {orden.vendedor.empresa
                    ? orden.vendedor.empresa
                    : `${orden.vendedor.nombre} ${orden.vendedor.apellido}`}
                </p>
                {orden.vendedor.empresa ? (
                  <p className="text-sm">
                    {orden.vendedor.nombre} {orden.vendedor.apellido}
                  </p>
                ) : null}
                <p className="text-sm">{orden.vendedor.email}</p>
                <p className="text-sm">{orden.vendedor.telefono}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-y border-gray-200">
                  <th className="py-3 text-left">Item</th>
                  <th className="py-3 text-right">Cantidad</th>
                  <th className="py-3 text-right">Precio Unit.</th>
                  <th className="py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orden.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4">
                      <div>
                        <p className="text-sm">{item.producto.nombre}</p>
                        <p className="text-xs font-medium text-gray-600">
                          {item.producto.sku}
                        </p>

                        {item.notas && (
                          <p className="text-sm text-blue-500 mt-1 whitespace-pre-line">
                            {item.notas}
                          </p>
                        )}

                        {item.garantia && (
                          <p className="text-xs italic text-gray-500 mt-1">
                            {item.garantia}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-right align-top">
                      {item.cantidad}
                    </td>
                    <td className="py-4 text-right align-top">
                      {currencyFormat({ value: item.precio })}
                    </td>
                    <td className="py-4 text-right align-top">
                      {currencyFormat({
                        value: item.precio * item.cantidad,
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="border-t pt-4">
            <div className="w-72 ml-auto space-y-3">
              {/* DO NOT REMOVE THIS COMMENTED CODE */}
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">
                  {currencyFormat({ value: orden.subtotal })}
                </span>
              </div>
              {orden.descuento > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>
                    Descuento
                    {orden.tipoDescuento === TipoDescuento.porcentual
                      ? ` (${orden.descuento}%)`
                      : ""}
                    :
                  </span>
                  <span>
                    -
                    {currencyFormat({
                      value:
                        orden.tipoDescuento === TipoDescuento.porcentual
                          ? (orden.subtotal * orden.descuento) / 100
                          : orden.descuento,
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Impuesto ({orden.impuesto}%):</span>
                <span className="font-medium">
                  {currencyFormat({
                    value:
                      ((orden.subtotal -
                        (orden.tipoDescuento === TipoDescuento.porcentual
                          ? (orden.subtotal * orden.descuento) / 100
                          : orden.descuento)) *
                        orden.impuesto) /
                      100,
                  })}
                </span>
              </div>
              {orden.credito > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Crédito aplicado:</span>
                  <span>-{currencyFormat({ value: orden.credito })}</span>
                </div>
              )}
              <div className="flex justify-between pt-3">
                <span className="font-bold">Total:</span>
                <span className="font-bold">
                  {currencyFormat({ value: totalConCredito })}
                </span>
              </div>
              {orden.tipoCambio === "BCV" && (
                <div className="flex justify-between pt-1">
                  <span className="text-sm text-gray-500">Total en VES:</span>
                  <span className="text-sm text-gray-500">
                    {currencyFormat({
                      value:
                        Math.round(totalConCredito * orden.tasaCambio * 100) /
                        100,
                      currency: "VES",
                      locale: "es-VE",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes Section */}
          {orden.notas && (
            <div className="mt-8 border-t pt-6">
              <h3 className="font-semibold text-gray-700 mb-2">Notas:</h3>
              <p className="text-gray-600 whitespace-pre-line">{orden.notas}</p>
            </div>
          )}

          {/* Status Section */}
          <div className="mt-8 text-center">
            <div className="inline-block px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
              <span className="font-medium">Estado: </span>
              <span className="dark:text-gray-300">{orden.estatus}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
