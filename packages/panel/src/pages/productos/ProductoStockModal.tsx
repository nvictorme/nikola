import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProductosStore } from "@/store/productos.store";
import { useAlmacenesStore } from "@/store/almacenes.store";
import { useState, useEffect } from "react";
import { IStockProducto } from "shared/interfaces";
import { Spinner } from "@/components/Spinner";

interface ProductoStockModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProductoStockModal({
  open,
  onClose,
}: ProductoStockModalProps) {
  const { almacenes, listarAlmacenes } = useAlmacenesStore();

  useEffect(() => {
    listarAlmacenes();
  }, [listarAlmacenes]);

  const { producto, loading, actualizarStock, getStock, stock } =
    useProductosStore();

  // Initialize with empty values
  const [selectedAlmacen, setSelectedAlmacen] = useState<string>("");

  const [currentStock, setCurrentStock] = useState<Partial<IStockProducto>>(
    () => {
      const defaultStock = {
        disponible: 0,
        reservado: 0,
        transito: 0,
        rma: 0,
      };

      if (!producto?.stock?.length) {
        return defaultStock;
      }

      // Find stock matching the selected country
      const stock = producto.stock.find(
        (s) => s.almacen?.id === selectedAlmacen
      );
      if (!stock) {
        return defaultStock;
      }

      return {
        actual: stock.actual,
        reservado: stock.reservado,
        transito: stock.transito,
        rma: stock.rma || 0,
      };
    }
  );

  // Estado local para mostrar un spinner mientras se carga el stock del almacén seleccionado
  const [loadingStock, setLoadingStock] = useState(false);

  // Cuando cambia el almacén seleccionado, se solicita el stock y se muestra un spinner hasta que termina
  useEffect(() => {
    if (selectedAlmacen && producto) {
      setLoadingStock(true);
      getStock(producto.id, selectedAlmacen).finally(() =>
        setLoadingStock(false)
      );
    }
  }, [selectedAlmacen, producto, getStock]);

  // Update currentStock when stock data changes
  useEffect(() => {
    if (stock) {
      setCurrentStock({
        actual: stock.actual,
        reservado: stock.reservado,
        transito: stock.transito,
        rma: stock.rma || 0,
      });
    } else {
      setCurrentStock({
        actual: 0,
        reservado: 0,
        transito: 0,
        rma: 0,
      });
    }
  }, [stock]);

  // Cargar almacenes cada vez que se abre el modal
  useEffect(() => {
    if (open) {
      listarAlmacenes();
    }
  }, [open, listarAlmacenes]);

  // Reset state cuando se cierra el modal, pero sin borrar almacenes globales
  useEffect(() => {
    if (!open) {
      setSelectedAlmacen("");
      setCurrentStock({
        actual: 0,
        reservado: 0,
        transito: 0,
        rma: 0,
      });
      // No borrar almacenes aquí
    }
  }, [open]);

  if (!producto) return null;

  const handleStockSubmit = async () => {
    if (!producto || !selectedAlmacen) return;
    await actualizarStock(producto.id, selectedAlmacen, currentStock);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {producto.sku} - {producto.nombre}
          </DialogTitle>
          <DialogDescription>Gestionar Stock</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <Spinner />
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Almacén</Label>
                <Select
                  value={selectedAlmacen}
                  onValueChange={setSelectedAlmacen}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar almacén" />
                  </SelectTrigger>
                  <SelectContent>
                    {almacenes.map((almacen) => (
                      <SelectItem key={almacen.id} value={almacen.id}>
                        {almacen.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedAlmacen &&
                // Si loadingStock es true, se muestra un spinner en vez de los inputs de stock
                (loadingStock ? (
                  <div className="flex justify-center items-center py-8">
                    <Spinner />
                  </div>
                ) : (
                  // Si loadingStock es false, se muestran los inputs para modificar el stock
                  <>
                    {/* Input para stock actual */}
                    <div className="space-y-2">
                      <Label>Actual</Label>
                      <Input
                        type="number"
                        value={currentStock.actual?.toString() || "0"}
                        onChange={(e) =>
                          setCurrentStock({
                            ...currentStock,
                            actual: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    {/* Input para stock reservado */}
                    <div className="space-y-2">
                      <Label>Reservado</Label>
                      <Input
                        type="number"
                        value={currentStock.reservado?.toString() || "0"}
                        onChange={(e) =>
                          setCurrentStock({
                            ...currentStock,
                            reservado: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    {/* Input para stock en tránsito */}
                    <div className="space-y-2">
                      <Label>En Tránsito</Label>
                      <Input
                        type="number"
                        value={currentStock.transito?.toString() || "0"}
                        onChange={(e) =>
                          setCurrentStock({
                            ...currentStock,
                            transito: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    {/* Input para stock RMA */}
                    <div className="space-y-2">
                      <Label>RMA</Label>
                      <Input
                        type="number"
                        value={currentStock.rma?.toString() || "0"}
                        onChange={(e) =>
                          setCurrentStock({
                            ...currentStock,
                            rma: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <Button onClick={handleStockSubmit}>
                      Actualizar Stock
                    </Button>
                  </>
                ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
