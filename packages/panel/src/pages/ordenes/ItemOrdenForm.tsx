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
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import {
  IAlmacen,
  IItemOrden,
  IOrden,
  IStockProducto,
} from "shared/interfaces";
import { calcularStockDisponible, currencyFormat } from "shared/helpers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useEffect, useCallback, useState, useRef, forwardRef } from "react";
import { useAlmacenesStore } from "@/store/almacenes.store";
import { Trash2Icon, RefreshCwIcon } from "lucide-react";

export interface AlmacenWithStock extends IAlmacen {
  stock: {
    actual: number;
    reservado: number;
    transito: number;
    rma: number;
  };
}

interface ItemOrdenFormProps {
  item: IItemOrden;
  idx: number;
  getValues: UseFormReturn<IOrden>["getValues"];
  setValue: UseFormReturn<IOrden>["setValue"];
  register: UseFormReturn<IOrden>["register"];
  onDelete: () => void;
  establecerPrecio: (item: IItemOrden) => void;
  idOrden: string | null;
  sucursal?: IOrden["sucursal"];
}

export const ItemOrdenForm = forwardRef<
  HTMLDivElement,
  Omit<ItemOrdenFormProps, "almacenes" | "onLoadAlmacenes">
>(function ItemOrdenForm(
  {
    item,
    idx,
    onDelete,
    sucursal,
    getValues,
    setValue,
    register,
    establecerPrecio,
  },
  ref
) {
  const { listarAlmacenesPorSucursal } = useAlmacenesStore();
  const [almacenes, setAlmacenes] = useState<AlmacenWithStock[]>([]);
  const [isLoadingAlmacenes, setIsLoadingAlmacenes] = useState(false);
  const [errorAlmacenes, setErrorAlmacenes] = useState<string | null>(null);
  const [manual, setManual] = useState(false);

  const cargarAlmacenes = useCallback(async () => {
    if (almacenes.length === 0) {
      setIsLoadingAlmacenes(true);
      setErrorAlmacenes(null);
      try {
        const almacenesData = await listarAlmacenesPorSucursal(
          sucursal?.id || "",
          item.producto.id
        );
        setAlmacenes(almacenesData as AlmacenWithStock[]);
      } catch (error) {
        setErrorAlmacenes(
          error instanceof Error ? error.message : "Error loading almacenes"
        );
      } finally {
        setIsLoadingAlmacenes(false);
      }
    }
  }, [
    almacenes.length,
    listarAlmacenesPorSucursal,
    sucursal?.id,
    item.producto.id,
  ]);

  useEffect(() => {
    cargarAlmacenes();
  }, [cargarAlmacenes]);

  const updateItemTotal = useCallback(
    (cantidad: number, precio: number) => {
      const newItems = [...getValues("items")];
      newItems[idx] = {
        ...newItems[idx],
        cantidad,
        precio,
        total: cantidad * precio,
      };
      setValue("items", newItems);
    },
    [getValues, setValue, idx]
  );

  const handleCantidadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cantidad = parseInt(e.target.value) || 0;
    updateItemTotal(cantidad, item.precio);
  };

  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManual(true); // Marcar como manual al cambiar el precio
    const precio = parseFloat(e.target.value) || 0;

    updateItemTotal(item.cantidad, precio);
  };

  const handleNotasChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newItems = [...getValues("items")];
      newItems[idx].notas = e.target.value;
      setValue("items", newItems);
    },
    [getValues, setValue, idx]
  );

  const handleAlmacenChange = useCallback(
    (value: string) => {
      const newItems = [...getValues("items")];
      if (value === "none") {
        newItems[idx].almacen = null;
      } else {
        const almacen = almacenes.find((a) => a.id === value);
        newItems[idx].almacen = almacen || null;
      }
      setValue("items", newItems);
    },
    [getValues, setValue, idx, almacenes]
  );

  // Flag para evitar múltiples asignaciones automáticas (ahora con useRef)
  const asignacionInicialRealizada = useRef(false);

  // Asignar automáticamente el almacén "Principal" si no se ha seleccionado uno
  // y solo si no se ha hecho una asignación inicial.
  useEffect(() => {
    if (
      !asignacionInicialRealizada.current &&
      almacenes.length > 0 &&
      (!item.almacen || !item.almacen.id)
    ) {
      const principal = almacenes.find(
        (almacen) => almacen.nombre === "Principal"
      );
      if (principal) {
        handleAlmacenChange(principal.id);
        asignacionInicialRealizada.current = true;
      }
    }
    // Solo depende de almacenes
    // Desactiva la advertencia de dependencias exhaustivas de React Hooks para este useEffect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [almacenes]);

  return (
    <div
      ref={ref}
      key={`${item.id}-${idx}`}
      className="grid grid-cols-10 gap-4 p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
    >
      {/* Product Info */}
      <div className="col-span-3 space-y-2">
        <div className="text-sm font-medium">
          {item.producto.sku} {item.producto.nombre}
        </div>
        {/* Notes */}
        <div className="col-span-2">
          <Label>Notas</Label>
          <Textarea
            value={item.notas || ""}
            onChange={handleNotasChange}
            placeholder={`Notas para ${item.producto.sku} ${item.producto.nombre}`}
            className="w-full p-2 border border-gray-300 rounded-lg item-notas"
          />
        </div>
      </div>

      {/* Warehouse and Warranty */}
      <div className="col-span-3 space-y-2">
        <div>
          <Label>Almacén</Label>
          <Select
            // Por defecto se selecciona, de manera automatica, el Almacen "Principal".
            value={
              item.almacen?.id ||
              almacenes.find((almacen) => almacen.nombre === "Principal")?.id
            }
            onValueChange={handleAlmacenChange}
            disabled={isLoadingAlmacenes}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  isLoadingAlmacenes
                    ? "Cargando almacenes..."
                    : errorAlmacenes
                    ? "Error al cargar almacenes"
                    : item.almacen?.nombre || "Seleccionar almacén"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {almacenes?.map((almacen) => (
                <SelectItem key={almacen.id} value={almacen.id}>
                  {almacen.nombre}:{" "}
                  {calcularStockDisponible(almacen.stock as IStockProducto)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Garantía</Label>
          <Input
            type="text"
            value={item.garantia || item.producto.garantia || ""}
            onChange={(e) => {
              const newItems = [...getValues("items")];
              newItems[idx].garantia = e.target.value;
              setValue("items", newItems);
            }}
            placeholder="Asignar garantía"
          />
        </div>
      </div>

      {/* Quantity and Price */}
      <div className="col-span-2 space-y-2">
        <div>
          <Label>Cantidad</Label>
          <Input
            type="number"
            step="1"
            {...register(`items.${idx}.cantidad` as const, {
              required: "Cantidad requerida",
              valueAsNumber: true,
              min: { value: 1, message: "Debe ser mayor a 0" },
            })}
            defaultValue={item.cantidad}
            className="w-full p-2 border border-gray-300 rounded-lg item-cantidad"
            onChange={handleCantidadChange}
          />
        </div>
        <div>
          <Label>Precio</Label>
          <div className="flex gap-2 items-center">
            <Input
              type="number"
              step="0.01"
              {...register(`items.${idx}.precio` as const, {
                required: "Precio requerido",
                valueAsNumber: true,
                min: { value: 0, message: "Debe ser mayor o igual a 0" },
              })}
              value={item.precio || 0}
              className="w-full p-2 border border-gray-300 rounded-lg item-precio"
              onChange={handlePrecioChange}
            />
            {/* Botón para restablecer el precio automático si el usuario lo editó manualmente.
                Usa el mismo estilo visual que el botón 'Orden' de OrdenesPage, pero solo con el icono.
                Se le aumenta el ancho mínimo para mejor presencia visual. */}
            {manual && (
              <Button
                type="button"
                size="default"
                variant="default"
                className="gap-2 p-2 min-w-[48px]"
                title="Restablecer precio automático"
                onClick={() => {
                  if (!item.producto.id) return;
                  establecerPrecio(item);
                  setManual(false); // Reset manual flag
                }}
              >
                <RefreshCwIcon className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Total */}
      <div className="col-span-1 flex items-center justify-center">
        {sucursal && (
          <div className="font-medium">
            {currencyFormat({
              value: item.total,
            })}
          </div>
        )}
      </div>

      {/* Delete Button */}
      <div className="col-span-1 flex items-center justify-end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:bg-red-100 hover:text-red-600 item-delete"
            >
              <Trash2Icon className="w-4 h-4 mr-2" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-500 text-white hover:bg-red-600"
                onClick={onDelete}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
});
