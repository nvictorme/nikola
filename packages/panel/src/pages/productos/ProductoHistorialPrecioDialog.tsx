import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useProductosStore } from "@/store/productos.store";
import { LineChart } from "@/components/ui/charts";
import { currencyFormat } from "shared/helpers";
import { useEffect } from "react";

interface ProductoHistorialPrecioDialogProps {
  open: boolean;
  onClose: () => void;
  productoId: string;
}

export function ProductoHistorialPrecioDialog({
  open,
  onClose,
  productoId,
}: ProductoHistorialPrecioDialogProps) {
  const { historialPrecio, fetchHistorialPrecio } = useProductosStore();

  useEffect(() => {
    if (open) {
      fetchHistorialPrecio(productoId);
    }
  }, [open, productoId, fetchHistorialPrecio]);

  const formattedData = historialPrecio.map((item) => ({
    ...item,
    fecha: `${String(new Date(item.fechaCreado).getDate()).padStart(
      2,
      "0"
    )}-${String(new Date(item.fechaCreado).getMonth() + 1).padStart(
      2,
      "0"
    )}-${new Date(item.fechaCreado).getFullYear()}`,
  }));

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Historial de Precios</DialogTitle>
        </DialogHeader>
        <div className="h-[400px]">
          {historialPrecio.length === 0 ? (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No hay data
            </div>
          ) : (
            <LineChart
              data={formattedData}
              categories={["precio", "costo"]}
              index="fecha"
              colors={["#2563eb", "#dc2626"]}
              valueFormatter={(value: number) => currencyFormat({ value })}
              className="h-full"
              showLegend={true}
              showGridLines={true}
              showAnimation={true}
              curveType="monotone"
              customTooltip={(props) => {
                const date = new Date(props.payload.fechaCreado);
                const formattedDate = `${String(date.getDate()).padStart(
                  2,
                  "0"
                )}-${String(date.getMonth() + 1).padStart(
                  2,
                  "0"
                )}-${date.getFullYear()}`;

                return (
                  <div className="rounded-lg border bg-card p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="font-medium">Fecha:</div>
                      <div>{formattedDate}</div>
                      <div className="font-medium">Precio:</div>
                      <div>
                        {currencyFormat({ value: props.payload.precio })}
                      </div>
                      <div className="font-medium">Costo:</div>
                      <div>
                        {currencyFormat({ value: props.payload.costo })}
                      </div>
                    </div>
                  </div>
                );
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
