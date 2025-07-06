import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IOrden } from "shared/interfaces";
import {
  currencyFormat,
  calcularTotalOrden,
  formatearFecha,
} from "shared/helpers";
import { TipoDescuento, TipoOrden, TipoCambio } from "shared/enums";
import { FileText, Download, Receipt } from "lucide-react";
import { useGeneratePDF, useGenerateProformaPDF } from "./ordenes.helpers";

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
  const { generatePDF, isGeneratingPDF } = useGeneratePDF();
  const { generateProformaPDF, isGeneratingProformaPDF } =
    useGenerateProformaPDF();

  if (!orden) return null;

  const totalConCredito = calcularTotalOrden({
    subtotal: orden.subtotal,
    descuento: orden.descuento,
    tipoDescuento: orden.tipoDescuento!,
    impuesto: orden.impuesto,
    credito: orden.credito,
  });

  const handleGeneratePDFWithOrden = async () => {
    await generatePDF(orden);
  };

  const handleGenerateProformaPDFWithOrden = async () => {
    await generateProformaPDF(orden);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[850px] max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Orden #{orden.serial}</DialogTitle>
        <DialogDescription className="sr-only">
          {/* Modificado: Formato de fecha cambiado a día, mes, año (es-ES) */}
          Fecha: {formatearFecha(orden.fechaCreado)}
        </DialogDescription>

        {/* PDF Generation Buttons */}
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="relative flex items-center">
            <Button
              onClick={handleGeneratePDFWithOrden}
              disabled={isGeneratingPDF}
              className="w-full sm:w-auto"
            >
              {isGeneratingPDF ? (
                <>
                  <FileText className="mr-2 h-4 w-4 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Orden PDF
                </>
              )}
            </Button>
            {orden.tipoCambio === TipoCambio.bcv && (
              <div className="absolute left-1/2 transform -translate-x-1/2">
                <Button
                  onClick={handleGenerateProformaPDFWithOrden}
                  disabled={isGeneratingProformaPDF}
                  className="w-full sm:w-auto"
                >
                  {isGeneratingProformaPDF ? (
                    <>
                      <Receipt className="mr-2 h-4 w-4 animate-spin" />
                      Generando Proforma...
                    </>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-4 w-4" />
                      Factura Proforma
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable container */}
        <div className="overflow-y-auto p-8">
          {/* Header Section */}
          <div className="border-b pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  Orden #{orden.serial}
                </h2>
                {/* Mostrando el tipo de orden en negritas */}
                <span className="text-sm text-gray-500">
                  <span className="font-semibold">Tipo:</span> {orden.tipo}
                </span>
                {/* Mostrando el tiempo de validez en negritas solo para crédito y cotización */}
                {(orden.tipo === TipoOrden.credito ||
                  orden.tipo === TipoOrden.cotizacion) &&
                  orden.validez && (
                    <span className="text-sm text-gray-500 block">
                      <span className="font-semibold">Tiempo de Validez:</span>{" "}
                      {orden.validez} día
                      {orden.validez > 1 ? "s" : ""}
                    </span>
                  )}
              </div>
              <div className="text-right">
                <p className="font-semibold">Fecha de Orden:</p>
                {/* Modificado: Formato de fecha cambiado a día, mes, año (es-ES) */}
                <p>
                  {new Date(orden.fechaCreado).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
                {orden.tipoCambio === TipoCambio.bcv && (
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
                  {/* Se ocultó el correo del cliente por requerimiento */}
                  {/* <p className="text-sm">{orden.cliente?.email}</p> */}
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
                {/* Se ocultó el correo del vendedor por requerimiento */}
                {/* <p className="text-sm">{orden.vendedor.email}</p> */}
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

                        {/* Ocultando la garantía, pero dejando el código comentado para referencia futura */}
                        {/* {item.garantia && (
                          <p className="text-xs italic text-gray-500 mt-1">
                            {item.garantia}
                          </p>
                        )} */}
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
              {orden.credito > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Crédito aplicado:</span>
                  <span>-{currencyFormat({ value: orden.credito })}</span>
                </div>
              )}
              {/* Ocultando la fila de impuesto en la sección de totales, pero dejando el código comentado para referencia futura */}
              {/* <div className="flex justify-between">
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
              </div> */}
              <div className="flex justify-between pt-3">
                <span className="font-bold">Total:</span>
                <span className="font-bold">
                  {currencyFormat({ value: totalConCredito })}
                </span>
              </div>
              {orden.tipoCambio === TipoCambio.bcv && (
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
