import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusIcon } from "lucide-react";
import { useMovimientosStore } from "@/store/movimientos.store";
import { useAlmacenesStore } from "@/store/almacenes.store";
import { useProductosStore } from "@/store/productos.store";
import {
  IItemMovimiento,
  IAlmacen,
  IProducto,
  IMovimiento,
} from "shared/interfaces";
import { useToast } from "@/hooks/use-toast";
import ProductSelector from "../productos/ProductoSelector";
import { ItemMovimientoForm } from "./ItemMovimientoForm";
import { ApiClient } from "@/api/api.client";

interface CreateItemMovimiento {
  producto: IProducto;
  cantidad: number;
  notas: string;
}

interface MovimientoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  movimiento?: IMovimiento | null;
}

export function MovimientoForm({
  open,
  onOpenChange,
  onSuccess,
  movimiento,
}: MovimientoFormProps) {
  const { createMovimiento, updateMovimiento } = useMovimientosStore();
  const { almacenes, listarAlmacenes } = useAlmacenesStore();
  const { listarProductos } = useProductosStore();
  const { toast } = useToast();

  const [origen, setOrigen] = useState<IAlmacen | null>(null);
  const [destino, setDestino] = useState<IAlmacen | null>(null);
  const [items, setItems] = useState<IItemMovimiento[]>([]);
  const [notas, setNotas] = useState("");
  const [loading, setLoading] = useState(false);
  const [productosDialogOpen, setProductosDialogOpen] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  // Cargar datos necesarios
  useEffect(() => {
    if (open) {
      listarAlmacenes();
      listarProductos();
    }
  }, [open, listarAlmacenes, listarProductos]);

  // Initialize form with movimiento data when editing
  useEffect(() => {
    if (movimiento && open) {
      setOrigen(movimiento.origen);
      setDestino(movimiento.destino);
      setItems(movimiento.items || []);
      setNotas(movimiento.notas || "");
    } else if (!movimiento && open) {
      // Reset form for new movement
      setOrigen(null);
      setDestino(null);
      setItems([]);
      setNotas("");
    }
  }, [movimiento, open]);

  const handleAddItem = () => {
    // El modal se abre automáticamente a través del DialogTrigger
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

    // Filtrar productos con stock disponible 0
    const apiClient = new ApiClient();
    const itemsConStock = await Promise.all(
      items.map(async (item) => {
        const { data } = await apiClient.get(
          `/productos/${item.producto.id}/stock/${origen.id}`,
          {}
        );
        const stockDisponible = data?.stock?.actual ?? 0;
        return stockDisponible > 0 ? item : null;
      })
    );
    // Type guard para asegurar que no hay nulls
    const itemsFiltrados = itemsConStock.filter(
      (item): item is IItemMovimiento => !!item
    );

    if (itemsFiltrados.length === 0) {
      setMensajeError("No hay productos con stock disponible para mover.");
      setItems([]); // Limpiar la lista de productos
      setTimeout(() => setMensajeError(""), 3000);
      return;
    }

    // Validar que todos los items tengan producto y cantidad
    const invalidItems = itemsFiltrados.filter(
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
      const cleanItems: CreateItemMovimiento[] = itemsFiltrados.map((item) => ({
        producto: item.producto,
        cantidad: item.cantidad,
        notas: item.notas || "",
      }));

      const movimientoData = {
        origen,
        destino,
        items: cleanItems,
        notas,
      };

      if (movimiento) {
        // Update existing movement
        await updateMovimiento(movimiento.id, movimientoData);
        toast({
          title: "Éxito",
          description: "Movimiento actualizado correctamente",
        });
      } else {
        // Create new movement
        await createMovimiento(movimientoData);
        toast({
          title: "Éxito",
          description: "Movimiento creado correctamente",
        });
      }

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
        description: movimiento
          ? "No se pudo actualizar el movimiento"
          : "No se pudo crear el movimiento",
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
          <DialogTitle>
            {movimiento ? "Editar Movimiento" : "Nuevo Movimiento"}
          </DialogTitle>
          <DialogDescription>
            {movimiento
              ? "Edita el movimiento de productos entre almacenes"
              : "Crea un nuevo movimiento de productos entre almacenes"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mensaje de error informativo */}
          {mensajeError && (
            <div className="mb-4 text-sm text-red-600 bg-red-100 rounded p-2">
              {mensajeError}
            </div>
          )}
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
                  {almacenes
                    .filter((almacen) => almacen.id !== destino?.id)
                    .map((almacen) => (
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
                  {almacenes
                    .filter((almacen) => almacen.id !== origen?.id)
                    .map((almacen) => (
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
          <div>
            <div className="space-y-2">
              <div className="flex justify-center">
                <Dialog
                  open={productosDialogOpen}
                  onOpenChange={setProductosDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={handleAddItem}
                    >
                      <PlusIcon className="w-4 h-4" /> Añadir Items
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Seleccionar Productos</DialogTitle>
                      <DialogDescription>
                        <ProductSelector
                          onSelected={(selected) => {
                            // Convert selected products to movement items
                            const newItems = selected.map((p) => {
                              const item: IItemMovimiento = {
                                id: crypto.randomUUID(),
                                producto: p,
                                cantidad: 1,
                                notas: "",
                                activo: true,
                                fechaCreado: new Date().toISOString(),
                                fechaActualizado: new Date().toISOString(),
                                fechaEliminado: "",
                              };
                              return item;
                            });

                            setItems([...items, ...newItems]);
                            setProductosDialogOpen(false);
                          }}
                        />
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="mt-6">
              {items.map((item, index) => (
                <ItemMovimientoForm
                  key={item.id}
                  item={item}
                  index={index}
                  handleRemoveItem={handleRemoveItem}
                  handleUpdateItem={handleUpdateItem}
                  origen={origen}
                />
              ))}
            </div>
          </div>

          {/* Notas generales */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas Generales</Label>
            <Textarea
              id="notas"
              placeholder="Notas adicionales para el movimiento..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              className="resize-none h-10 min-h-0"
              rows={1}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !origen || !destino || items.length === 0}
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
