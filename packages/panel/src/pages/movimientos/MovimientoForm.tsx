import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Package } from "lucide-react";
import { useMovimientosStore } from "@/store/movimientos.store";
import { useAlmacenesStore } from "@/store/almacenes.store";
import { useProductosStore } from "@/store/productos.store";
import { IItemMovimiento, IAlmacen, IProducto } from "shared/interfaces";
import { useToast } from "@/hooks/use-toast";

interface CreateItemMovimiento {
  producto: IProducto;
  cantidad: number;
  notas: string;
}

interface MovimientoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MovimientoForm({
  open,
  onOpenChange,
  onSuccess,
}: MovimientoFormProps) {
  const { createMovimiento } = useMovimientosStore();
  const { almacenes, listarAlmacenes } = useAlmacenesStore();
  const { productos, listarProductos } = useProductosStore();
  const { toast } = useToast();

  const [origen, setOrigen] = useState<IAlmacen | null>(null);
  const [destino, setDestino] = useState<IAlmacen | null>(null);
  const [items, setItems] = useState<IItemMovimiento[]>([]);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar datos necesarios
  useEffect(() => {
    if (open) {
      listarAlmacenes();
      listarProductos();
    }
  }, [open, listarAlmacenes, listarProductos]);

  const handleAddItem = () => {
    const newItem: IItemMovimiento = {
      id: crypto.randomUUID(),
      producto: { id: "" } as IProducto,
      cantidad: 1,
      notas: "",
      activo: true,
      fechaCreado: new Date().toISOString(),
      fechaActualizado: new Date().toISOString(),
      fechaEliminado: "",
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof IItemMovimiento,
    value: unknown
  ) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setItems(updatedItems);
  };

  const handleSubmit = async () => {
    if (!origen || !destino) {
      toast({
        title: "Error",
        description: "Debes seleccionar almacén origen y destino",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un producto",
        variant: "destructive",
      });
      return;
    }

    // Validar que todos los items tengan producto y cantidad
    const invalidItems = items.filter(
      (item) => !item.producto.id || item.cantidad <= 0
    );
    if (invalidItems.length > 0) {
      toast({
        title: "Error",
        description: "Todos los productos deben tener cantidad válida",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Clean items to remove date fields that should be handled by the backend
      const cleanItems: CreateItemMovimiento[] = items.map((item) => ({
        producto: item.producto,
        cantidad: item.cantidad,
        notas: item.notas || "",
      }));

      await createMovimiento({
        origen,
        destino,
        items: cleanItems,
        notas,
      });

      toast({
        title: "Éxito",
        description: "Movimiento creado correctamente",
      });

      // Reset form
      setOrigen(null);
      setDestino(null);
      setItems([]);
      setNotas("");
      onSuccess();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el movimiento",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Movimiento</DialogTitle>
          <DialogDescription>
            Crea un nuevo movimiento de productos entre almacenes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Almacenes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origen">Almacén Origen *</Label>
              <Select
                value={origen?.id || ""}
                onValueChange={(value) => {
                  const selected = almacenes.find((a) => a.id === value);
                  setOrigen(selected || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar almacén origen" />
                </SelectTrigger>
                <SelectContent>
                  {almacenes.map((almacen) => (
                    <SelectItem key={almacen.id} value={almacen.id}>
                      {almacen.nombre} -{" "}
                      {almacen.direccion?.ciudad || "Sin ciudad"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="destino">Almacén Destino *</Label>
              <Select
                value={destino?.id || ""}
                onValueChange={(value) => {
                  const selected = almacenes.find((a) => a.id === value);
                  setDestino(selected || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar almacén destino" />
                </SelectTrigger>
                <SelectContent>
                  {almacenes.map((almacen) => (
                    <SelectItem key={almacen.id} value={almacen.id}>
                      {almacen.nombre} -{" "}
                      {almacen.direccion?.ciudad || "Sin ciudad"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Productos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Productos *</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </div>

            {items.map((item, index) => (
              <Card key={item.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      Producto {index + 1}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Producto *</Label>
                      <Select
                        value={item.producto.id || "placeholder"}
                        onValueChange={(value) => {
                          if (value === "placeholder") return;
                          const selected = productos.find(
                            (p) => p.id === value
                          );
                          handleUpdateItem(
                            index,
                            "producto",
                            selected || ({ id: "" } as IProducto)
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar producto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="placeholder" disabled>
                            Seleccionar producto
                          </SelectItem>
                          {productos.map((producto) => (
                            <SelectItem key={producto.id} value={producto.id}>
                              <div className="flex items-center space-x-2">
                                <Package className="h-4 w-4" />
                                <span>{producto.nombre}</span>
                                <Badge variant="secondary">
                                  {producto.sku}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cantidad *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) =>
                          handleUpdateItem(
                            index,
                            "cantidad",
                            parseInt(e.target.value) || 1
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Textarea
                      placeholder="Notas adicionales para este producto..."
                      value={item.notas}
                      onChange={(e) =>
                        handleUpdateItem(index, "notas", e.target.value)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Notas generales */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas Generales</Label>
            <Textarea
              id="notas"
              placeholder="Notas adicionales para el movimiento..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creando..." : "Crear Movimiento"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
