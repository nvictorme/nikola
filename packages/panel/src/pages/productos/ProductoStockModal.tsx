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
import { Checkbox } from "@/components/ui/checkbox";
import { useProductosStore } from "@/store/productos.store";
import { useAlmacenesStore } from "@/store/almacenes.store";
import { useState, useEffect } from "react";
import { IStockProducto } from "shared/interfaces";
import { Spinner } from "@/components/Spinner";
import { toast } from "sonner";

interface ProductoStockModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ProductoStockModal({
  open,
  onClose,
}: ProductoStockModalProps) {
  const { almacenes, listarAlmacenes } = useAlmacenesStore();
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

  // Load stock when almacén changes
  useEffect(() => {
    if (selectedAlmacen && producto) {
      getStock(producto.id, selectedAlmacen);
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

  // Reset almacén and stock when país changes
  useEffect(() => {
    setSelectedAlmacen("");
    setCurrentStock({
      actual: 0,
      reservado: 0,
      transito: 0,
      rma: 0,
    });
  }, [selectedPais]);

  // Update the effect that handles product data changes
  useEffect(() => {
    const defaultPrecio = {
      precioLista: 0,
      precioExw: 0,
      precioOferta: 0,
      enOferta: false,
      inicioOferta: null,
      finOferta: null,
    };

    const defaultStock = {
      disponible: 0,
      reservado: 0,
      transito: 0,
      rma: 0,
    };

    // Update stock
    const stock = producto.stock?.find(
      (s) => s.almacen?.id === selectedAlmacen
    );
    setCurrentStock(
      stock
        ? {
            actual: stock.actual,
            reservado: stock.reservado,
            transito: stock.transito,
            rma: stock.rma || 0,
          }
        : defaultStock
    );
  }, [selectedPais, producto, selectedAlmacen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setPais(null);
      setSelectedAlmacen("");
      setCurrentStock({
        actual: 0,
        reservado: 0,
        transito: 0,
        rma: 0,
      });
      useAlmacenesStore.setState({ almacenes: [] });
    }
  }, [open, setPais]);

  if (!producto) return null;

  const handlePreciosSubmit = async () => {
    if (!producto || !selectedPais) return;

    // Validate required fields when enOferta is true
    if (currentPrecio.enOferta && !currentPrecio.inicioOferta) {
      toast.warning(
        "La fecha de inicio es requerida cuando el producto está en oferta"
      );
      return;
    }

    await actualizarPrecios(producto.id, selectedPais, currentPrecio);
  };

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
          <DialogDescription>Gestionar Precios y Stock</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>País</Label>
            <Select
              value={selectedPais || ""}
              onValueChange={(value) => {
                setPais(value || null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar país" />
              </SelectTrigger>
              <SelectContent>
                {[{ id: "1", nombre: "Venezuela" }].map((pais) => (
                  <SelectItem key={pais.id} value={pais.id}>
                    {pais.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <Spinner />
          ) : (
            selectedPais && (
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Precios</h3>
                  <div className="space-y-2">
                    <Label>Precio Lista</Label>
                    <Input
                      type="number"
                      value={currentPrecio.precioLista?.toString() || "0"}
                      onChange={(e) =>
                        setCurrentPrecio({
                          ...currentPrecio,
                          precioLista: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio EXW</Label>
                    <Input
                      type="number"
                      value={currentPrecio.precioExw?.toString() || "0"}
                      onChange={(e) =>
                        setCurrentPrecio({
                          ...currentPrecio,
                          precioExw: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={currentPrecio.enOferta || false}
                      onCheckedChange={(checked) =>
                        setCurrentPrecio({
                          ...currentPrecio,
                          enOferta: checked as boolean,
                        })
                      }
                    />
                    <Label>En Oferta</Label>
                  </div>
                  {currentPrecio.enOferta && (
                    <div className="space-y-2">
                      <Label>Precio Oferta</Label>
                      <Input
                        type="number"
                        value={currentPrecio.precioOferta?.toString() || "0"}
                        onChange={(e) =>
                          setCurrentPrecio({
                            ...currentPrecio,
                            precioOferta: parseFloat(e.target.value) || 0,
                          })
                        }
                      />
                      <div className="space-y-2">
                        <Label
                          className={
                            currentPrecio.enOferta
                              ? "after:content-['*'] after:ml-0.5 after:text-red-500"
                              : ""
                          }
                        >
                          Inicio Oferta
                        </Label>
                        <Input
                          type="date"
                          value={
                            currentPrecio.inicioOferta
                              ? new Date(currentPrecio.inicioOferta)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setCurrentPrecio(
                              (prev: Partial<IPrecioProducto>) => ({
                                ...prev,
                                inicioOferta: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : null,
                              })
                            )
                          }
                          min={new Date().toISOString().split("T")[0]}
                          required={currentPrecio.enOferta}
                          className={
                            currentPrecio.enOferta &&
                            !currentPrecio.inicioOferta
                              ? "border-red-500"
                              : ""
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Fin Oferta</Label>
                        <Input
                          type="date"
                          value={
                            currentPrecio.finOferta
                              ? new Date(currentPrecio.finOferta)
                                  .toISOString()
                                  .split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            setCurrentPrecio(
                              (prev: Partial<IPrecioProducto>) => ({
                                ...prev,
                                finOferta: e.target.value
                                  ? new Date(e.target.value).toISOString()
                                  : null,
                              })
                            )
                          }
                          min={
                            currentPrecio.inicioOferta
                              ? new Date(currentPrecio.inicioOferta)
                                  .toISOString()
                                  .split("T")[0]
                              : new Date().toISOString().split("T")[0]
                          }
                        />
                      </div>
                    </div>
                  )}
                  <Button onClick={handlePreciosSubmit}>
                    Actualizar Precios
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Stock</h3>
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

                  {selectedAlmacen && (
                    <>
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
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
