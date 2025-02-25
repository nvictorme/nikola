import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileUploader } from "@/components/FileUploader";
import { UseFormReturn } from "react-hook-form";
import {
  IAlmacen,
  IArchivo,
  IItemOrden,
  IOrden,
  IStockProducto,
} from "shared/interfaces";
import { EstatusArchivo } from "shared/enums";
import { v4 as uuidv4 } from "uuid";
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
import { useEffect, useCallback, useState, forwardRef } from "react";
import { useAlmacenesStore } from "@/store/almacenes.store";
import { Upload, FileIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

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
  idOrden: string | null;
  sucursal?: IOrden["sucursal"];
}

export const ItemOrdenForm = forwardRef<
  HTMLDivElement,
  Omit<ItemOrdenFormProps, "almacenes" | "onLoadAlmacenes">
>(function ItemOrdenForm(
  { item, idx, onDelete, idOrden, sucursal, getValues, setValue, register },
  ref
) {
  const { listarAlmacenesPorSucursal } = useAlmacenesStore();
  const [almacenes, setAlmacenes] = useState<AlmacenWithStock[]>([]);
  const [isLoadingAlmacenes, setIsLoadingAlmacenes] = useState(false);
  const [errorAlmacenes, setErrorAlmacenes] = useState<string | null>(null);

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
      newItems[idx].cantidad = cantidad;
      newItems[idx].precio = precio;
      newItems[idx].total = cantidad * precio;
      setValue("items", newItems);
    },
    [getValues, setValue, idx]
  );

  const handleCantidadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cantidad = parseInt(e.target.value) || 0;
    updateItemTotal(cantidad, item.precio);
  };

  const handlePrecioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const precio = parseFloat(e.target.value) || 0;
    if (precio < item.producto.precio) {
      return toast.warning("El precio no puede ser menor que el precio lista", {
        position: "top-center",
      });
    }
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

  const handleDeleteFile = useCallback(
    (fileId: string) => {
      const newItems = [...getValues("items")];
      newItems[idx].archivos = newItems[idx].archivos.filter(
        (archivo) => archivo.id !== fileId
      );
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

  return (
    <AccordionItem
      ref={ref}
      key={`${item.id}-${idx}`}
      value={`${item.id}-${idx}`}
      className="item-accordion"
    >
      <AccordionTrigger className="grid grid-cols-6 gap-4 text-xs justify-stretch hover:no-underline">
        <div className="col-span-2">
          {item.producto.sku}{" "}
          {item.producto.sku === "ZZ" ? (
            <Input
              type="text"
              defaultValue={item.producto.nombre}
              className="w-full p-1 border border-gray-300 rounded-lg mt-1"
              onChange={(e) => {
                const newItems = [...getValues("items")];
                newItems[idx].producto.nombre = e.target.value;
                setValue("items", newItems);
              }}
            />
          ) : (
            item.producto.nombre
          )}
          <br />
          <small>
            Precio:{" "}
            {currencyFormat({
              value: item.precio,
            })}
          </small>
          <br />
          <small>
            Garantía:{" "}
            {item.garantia || item.producto.garantia || "Sin garantía"}
          </small>
        </div>
        <div>
          <Input
            type="number"
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
          <Input
            type="number"
            {...register(`items.${idx}.precio` as const, {
              required: "Precio requerido",
              valueAsNumber: true,
              min: { value: 0, message: "Debe ser mayor o igual a 0" },
            })}
            defaultValue={item.precio}
            className="w-full p-2 border border-gray-300 rounded-lg item-precio"
            onChange={handlePrecioChange}
          />
        </div>
        <div>
          {sucursal &&
            currencyFormat({
              value: item.total,
            })}
        </div>
        <div className="flex gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:bg-red-100 hover:text-red-600 item-delete"
              >
                Eliminar
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
      </AccordionTrigger>

      <AccordionContent className="w-full">
        <div className="grid grid-cols-7 gap-4 p-4">
          <div className="col-span-2">
            <Textarea
              value={item.notas || ""}
              onChange={handleNotasChange}
              placeholder={`Notas para ${item.producto.sku} ${item.producto.nombre}`}
              className="w-full p-2 border border-gray-300 rounded-lg item-notas"
            />
          </div>
          <div className="col-span-2">
            <div className="space-y-4">
              <div className="item-almacen">
                <Label htmlFor={`almacen-${idx}`}>Almacén</Label>
                <Select
                  value={item.almacen?.id || "none"}
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
                    <SelectItem value="none">Sin almacén asignado</SelectItem>
                    {almacenes?.map((almacen) => (
                      <SelectItem key={almacen.id} value={almacen.id}>
                        {almacen.nombre}:{" "}
                        {calcularStockDisponible(
                          almacen.stock as IStockProducto
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <>
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
              </>
            </div>
          </div>
          <div className="col-span-3">
            <Label>Archivos adjuntos</Label>
            <div className="space-y-4">
              <FileUploader
                folder={`ordenes/${idOrden}/items`}
                onSuccess={({ file, fileKey }) => {
                  const newItems = [...getValues("items")];
                  if (!Array.isArray(newItems[idx].archivos)) {
                    newItems[idx].archivos = [];
                  }
                  const newFile = {
                    id: uuidv4(),
                    nombre: file.name,
                    tipo: file.type,
                    estatus: EstatusArchivo.cargado,
                    url: fileKey,
                  } as IArchivo;

                  newItems[idx].archivos = [...newItems[idx].archivos, newFile];
                  setValue("items", newItems);
                }}
                onFailure={({ file }) => {
                  console.error(`Failed to upload ${file.name}`);
                  toast.error(`Error al cargar ${file.name}`);
                }}
              >
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/50 group cursor-pointer">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-colors duration-200">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        Arrastra y suelta archivos aquí
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        o{" "}
                        <span className="text-blue-600 dark:text-blue-400 font-medium hover:text-blue-700 dark:hover:text-blue-300">
                          selecciona desde tu dispositivo
                        </span>
                      </p>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Archivos permitidos: PDF, PNG, JPG, JPEG
                    </p>
                  </div>
                </div>
              </FileUploader>

              {item.archivos && item.archivos.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Archivos cargados ({item.archivos.length})
                  </p>
                  {item.archivos.map((archivo) => (
                    <div
                      key={archivo.id}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200 group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400">
                          <FileIcon className="h-4 w-4" />
                        </div>
                        <a
                          href={`${import.meta.env.VITE_S3_URL}/${
                            import.meta.env.VITE_S3_BUCKET
                          }/${archivo.url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                        >
                          {archivo.nombre}
                        </a>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                        onClick={() => handleDeleteFile(archivo.id)}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
});
