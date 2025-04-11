import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useOrdenesStore } from "@/store/ordenes.store";
import { Controller, useForm } from "react-hook-form";
import { IItemOrden, IOrden } from "shared/interfaces";
import PersonaSelector from "../personas/PersonaSelector";
import { useAuthStore } from "@/store/auth.store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductSelector from "../productos/ProductoSelector";
import { PlusIcon } from "lucide-react";
import {
  calcularTotalOrden,
  currencyFormat,
  isSuperAdmin,
} from "shared/helpers";
import { Accordion } from "@/components/ui/accordion";
import { v4 as uuidv4 } from "uuid";
import { TipoDescuento, TipoOrden } from "shared/enums";
import { Separator } from "@/components/ui/separator";
import { useSucursalesStore } from "@/store/sucursales.store";
import { useState, useEffect, useCallback } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ItemOrdenForm } from "./ItemOrdenForm";
import { FileUploader } from "@/components/FileUploader";
import { Upload, FileIcon, XIcon } from "lucide-react";
import { EstatusArchivo } from "shared/enums";
import { IArchivo } from "shared/interfaces";
import Joyride, { CallBackProps, Step } from "react-joyride";

const orderSteps: Step[] = [
  {
    target: "body",
    content:
      "Bienvenido al asistente de creación de órdenes. Te guiaré paso a paso.",
    placement: "center",
    disableBeacon: true,
  },
  {
    target: ".cliente-selector",
    content:
      "Primero, selecciona el cliente para la orden. Puedes buscar por nombre, empresa o NIF.",
    placement: "bottom",
  },
  {
    target: ".sucursal-selector",
    content: "Selecciona la sucursal donde se procesará la orden.",
    placement: "bottom",
  },
  {
    target: ".tipo-orden-selector",
    content: "Elige el tipo de orden: compra, crédito o reposición.",
    placement: "bottom",
  },
  {
    target: ".add-items-button",
    content: "Haz clic aquí para agregar productos a la orden.",
    placement: "bottom",
  },
  {
    target: ".notas-orden",
    content: "Puedes agregar notas o comentarios generales sobre la orden.",
    placement: "bottom",
  },
  {
    target: ".archivos-orden",
    content: "Adjunta documentos de soporte si es necesario.",
    placement: "bottom",
  },
  {
    target: ".guardar-orden",
    content: "¡Listo! Ahora puedes guardar la orden.",
    placement: "bottom",
  },
];

export default function OrdenForm({
  orden,
  onCloseForm,
}: {
  orden: IOrden | null;
  onCloseForm: () => void;
}) {
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);

  const { sucursales } = useSucursalesStore();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);
  const [productosDialogOpen, setProductosDialogOpen] = useState(false);
  const [idOrden] = useState<string | null>(orden?.id || uuidv4());

  const {
    register,
    handleSubmit,
    watch,
    control,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<IOrden>({
    defaultValues: orden?.id
      ? { ...orden }
      : {
          id: idOrden || undefined,
          ...(user && { vendedor: user }),
          tipo: TipoOrden.venta,
          credito: 0,
          descuento: 0,
          impuesto: 0,
          tipoDescuento: TipoDescuento.porcentual,
          subtotal: 0,
          total: 0,
          validez: 1 as number,
          archivos: [] as IArchivo[],
        },
  });

  const tipo = watch("tipo");
  const validez = watch("validez");
  const sucursal = watch("sucursal");
  const cliente = watch("cliente");
  const items = watch("items");

  const credito = watch("credito");
  const descuento = watch("descuento");
  const tipoDescuento = watch("tipoDescuento");
  const impuesto = watch("impuesto");

  const subtotal =
    items?.reduce(
      (acc, item) =>
        acc +
        (typeof item.total === "number"
          ? item.total
          : parseFloat(item.total as string)),
      0
    ) || 0;

  const total = calcularTotalOrden({
    subtotal,
    credito,
    descuento,
    tipoDescuento: tipoDescuento as TipoDescuento,
    impuesto,
  });

  const { crearOrden, actualizarOrden } = useOrdenesStore();

  const { toast } = useToast();

  const [runTour, setRunTour] = useState(
    !orden && !localStorage.getItem("orderTourDone")
  );

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (["skipped", "finished"].includes(status)) {
      setRunTour(false);
      localStorage.setItem("orderTourDone", "true");
    }
  };

  const onSubmit = handleSubmit(async (data: IOrden) => {
    setIsSubmitting(true);
    try {
      if (orden) {
        await actualizarOrden({ ...orden, ...data, subtotal, total });
      } else {
        await crearOrden({ ...data, subtotal, total });
      }
      onCloseForm();
      localStorage.removeItem("orden_draft");
    } catch (error) {
      toast({
        title: "Error al guardar la orden",
        description:
          error instanceof Error ? error.message : "Error desconocido",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      const formData = watch();
      if (!orden && formData.items?.length > 0) {
        localStorage.setItem("orden_draft", JSON.stringify(formData));
      }
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [orden, watch]);

  const isFormValid = useCallback(() => {
    const hasRequiredFields =
      (tipo === TipoOrden.reposicion ? true : !!cliente) && sucursal;
    const hasItems = items && items.length > 0;
    const hasValidItems = items?.every(
      (item) => item.cantidad > 0 && item.precio > 0 && item.producto
    );
    const hasValidTotal = total > 0;

    return hasRequiredFields && hasItems && hasValidItems && hasValidTotal;
  }, [cliente, sucursal, items, total, tipo]);

  return (
    <Card className="bg-background max-w m-auto">
      <Joyride
        steps={orderSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "#0091ff",
            zIndex: 1000,
          },
        }}
        locale={{
          back: "Atrás",
          close: "Cerrar",
          last: "Finalizar",
          next: "Siguiente",
          skip: "Saltar",
        }}
      />
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle>
            {orden ? `Orden #${orden.serial}` : "Nueva Orden"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 max-w mx-4">
          <Controller
            {...register("cliente", {
              required:
                tipo !== TipoOrden.reposicion ? "Seleccione un cliente" : false,
            })}
            control={control}
            render={({ field }) => (
              <div className="grid grid-cols-3 gap-4 items-end">
                <div className="flex flex-col items-start gap-1">
                  <Dialog
                    open={clienteDialogOpen}
                    onOpenChange={setClienteDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button
                        variant="secondary"
                        type="button"
                        disabled={!!orden || tipo === TipoOrden.reposicion}
                        className="cliente-selector"
                      >
                        {tipo === TipoOrden.reposicion
                          ? "No requiere cliente"
                          : "Seleccionar Cliente"}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Seleccione el cliente</DialogTitle>
                        <DialogDescription>
                          <PersonaSelector
                            onSelect={(persona) => {
                              field.onChange(persona);
                              setClienteDialogOpen(false);
                            }}
                          />
                        </DialogDescription>
                      </DialogHeader>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="flex flex-col col-span-2 items-start gap-1">
                  <Label htmlFor="nombre">Cliente</Label>
                  <Input
                    id="cliente"
                    type="text"
                    value={
                      tipo === TipoOrden.reposicion
                        ? "Reposición de inventario"
                        : field.value
                        ? `${field.value.nif} - ${
                            field.value.empresa
                              ? field.value.empresa
                              : `${field.value.nombre} ${field.value.apellido}`
                          }`
                        : ""
                    }
                    readOnly
                  />
                  {errors.cliente && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.cliente.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          />

          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="sucursal">Sucursal</Label>
              <Controller
                control={control}
                {...register("sucursal", {
                  required: "Seleccione una sucursal",
                })}
                render={({ field }) => (
                  <>
                    {errors.sucursal && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.sucursal.message}
                      </p>
                    )}
                    <Select
                      defaultValue={field.value?.id}
                      disabled={!!orden}
                      onValueChange={(value) => {
                        field.onChange(
                          (isAdmin ? sucursales : user?.sucursales)?.find(
                            (s) => s.id === value
                          )
                        );
                      }}
                    >
                      <SelectTrigger className="sucursal-selector">
                        <SelectValue placeholder="Sucursal" />
                      </SelectTrigger>
                      <SelectContent>
                        {!orden &&
                          (isAdmin ? sucursales : user?.sucursales)?.map(
                            (s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.nombre}
                              </SelectItem>
                            )
                          )}
                        {orden && (
                          <SelectItem value={orden.sucursal.id}>
                            {orden.sucursal.nombre}
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </>
                )}
              />
            </div>

            <div className="flex flex-col items-start gap-1">
              <Label>Tipo de orden</Label>
              <Controller
                name="tipo"
                control={control}
                defaultValue={TipoOrden.venta}
                render={({ field }) => (
                  <Select
                    defaultValue={field.value}
                    onValueChange={(value) => {
                      field.onChange(value as TipoOrden);
                      // Update related fields based on type
                      if (
                        value === TipoOrden.cotizacion ||
                        value === TipoOrden.credito
                      ) {
                        setValue("validez", 1 as number);
                      }
                      // Clear cliente when tipo is reposicion
                      if (value === TipoOrden.reposicion) {
                        setValue("cliente", null);
                      }
                    }}
                    disabled={!!orden}
                  >
                    <SelectTrigger className="tipo-orden-selector">
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TipoOrden.cotizacion}>
                        {TipoOrden.cotizacion}
                      </SelectItem>
                      <SelectItem value={TipoOrden.venta}>
                        {TipoOrden.venta}
                      </SelectItem>
                      <SelectItem value={TipoOrden.credito}>
                        {TipoOrden.credito}
                      </SelectItem>
                      <SelectItem value={TipoOrden.reposicion}>
                        {TipoOrden.reposicion}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col items-start gap-1">
              <Label htmlFor="validez">Validez (en días)</Label>
              <Input
                type="number"
                {...register("validez", {
                  required: "Validez requerida",
                  valueAsNumber: true,
                  min: { value: 1, message: "Debe ser mayor a 0" },
                })}
                placeholder="Validez (en días)"
                defaultValue={validez}
                disabled={
                  tipo !== TipoOrden.cotizacion && tipo !== TipoOrden.credito
                }
              />
              {errors.validez && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.validez.message}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col w-full space-y-4">
            <Controller
              name="items"
              control={control}
              render={({ field }) => (
                <>
                  <div className="my-4">
                    <Dialog
                      open={productosDialogOpen}
                      onOpenChange={setProductosDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button
                          variant="secondary"
                          type="button"
                          disabled={
                            !sucursal ||
                            (!cliente && tipo !== TipoOrden.reposicion)
                          }
                          className="add-items-button"
                        >
                          <PlusIcon className="w-4 h-4" /> Añadir Items
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Seleccionar Productos</DialogTitle>
                          <DialogDescription>
                            <ProductSelector
                              onSelected={(selected) => {
                                // Convert selected products to order items
                                const newItems = selected.map((p) => {
                                  const item: Partial<IItemOrden> = {
                                    id: uuidv4(),
                                    producto: p,
                                    cantidad: 1,
                                  };

                                  // si el producto esta en oferta, y la fecha actual
                                  // esta entre la fecha de inicio y fin de la oferta, usar el precio de oferta
                                  // si la fecha de fin de oferta es null, se considera que la oferta es permanente
                                  if (
                                    p.enOferta &&
                                    p.precioOferta &&
                                    p.inicioOferta &&
                                    (!p.finOferta
                                      ? new Date() >= new Date(p.inicioOferta)
                                      : new Date() >=
                                          new Date(p.inicioOferta) &&
                                        new Date() <= new Date(p.finOferta))
                                  ) {
                                    item.precio = p.precioOferta;
                                  } else {
                                    // si no hay precio de oferta, usar el precio normal
                                    item.precio = p.precio || 0;
                                  }

                                  item.total =
                                    (item.cantidad || 1) * item.precio;
                                  return item;
                                });

                                field.onChange([
                                  ...(field.value || []),
                                  ...newItems,
                                ]);

                                // close the dialog
                                setProductosDialogOpen(false);
                              }}
                            />
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {field.value?.length === 0 && (
                    <div className="flex items-center gap-2 text-yellow-500 mb-4">
                      <AlertTriangleIcon className="w-4 h-4" />
                      <span>Debe agregar al menos un producto a la orden</span>
                    </div>
                  )}

                  {total === 0 && field.value?.length > 0 && (
                    <div className="flex items-center gap-2 text-yellow-500">
                      <AlertTriangleIcon className="w-4 h-4" />
                      <span>El total de la orden no puede ser 0</span>
                    </div>
                  )}

                  {selectedItems.length > 0 && (
                    <div className="flex gap-2 my-2">
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const newItems = field.value?.filter(
                            (item) => !selectedItems.includes(item.id)
                          );
                          field.onChange(newItems);
                          setSelectedItems([]);
                        }}
                      >
                        Eliminar Seleccionados
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const itemsToDuplicate = field.value?.filter((item) =>
                            selectedItems.includes(item.id)
                          );
                          const duplicatedItems = itemsToDuplicate.map(
                            (item) => ({
                              ...item,
                              id: uuidv4(),
                              archivos: [],
                            })
                          );
                          field.onChange([...field.value, ...duplicatedItems]);
                          setSelectedItems([]);
                        }}
                      >
                        Duplicar Seleccionados
                      </Button>
                    </div>
                  )}

                  <div>
                    {field.value?.length > 0 && (
                      <div className="grid grid-cols-7 gap-4">
                        <div className="font-semibold col-span-2">Producto</div>
                        <div className="font-semibold">Serial</div>
                        <div className="font-semibold">Cantidad</div>
                        <div className="font-semibold">Precio</div>
                        <div className="font-semibold">Subtotal</div>
                        <div className="font-semibold">Acciones</div>
                      </div>
                    )}
                    <Accordion type="single" collapsible>
                      {field.value?.map((item, idx) => (
                        <ItemOrdenForm
                          key={`${item.producto.id}-${idx}`}
                          item={item}
                          idx={idx}
                          getValues={getValues}
                          setValue={setValue}
                          register={register}
                          onDelete={() => {
                            const newItems = field.value?.filter(
                              (i) => i.id !== item.id
                            );
                            field.onChange(newItems);
                          }}
                          idOrden={idOrden || null}
                          sucursal={sucursal}
                        />
                      ))}
                    </Accordion>
                  </div>
                </>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="notas">Notas generales de la orden</Label>
                <Textarea
                  id="notas"
                  rows={4}
                  {...register("notas")}
                  className="w-full resize-none notas-orden"
                  placeholder="Ingrese notas o comentarios generales sobre la orden..."
                />
                {errors.notas && (
                  <p className="text-red-500 text-sm">{errors.notas.message}</p>
                )}
              </div>

              {sucursal && (
                <div className="flex items-center gap-2 mt-auto pt-4 border-t">
                  <Label htmlFor="total" className="text-muted-foreground">
                    Total de la orden:
                  </Label>
                  <span className="font-bold text-xl ml-auto">
                    {currencyFormat({
                      value: total || 0,
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex flex-col gap-2 archivos-orden">
                <Label>Archivos de soporte</Label>
                <FileUploader
                  folder={`ordenes/${idOrden}`}
                  onSuccess={({ file, fileKey }) => {
                    const currentArchivos = getValues("archivos") || [];
                    const newFile: Partial<IArchivo> = {
                      id: uuidv4(),
                      nombre: file.name,
                      tipo: file.type,
                      estatus: EstatusArchivo.cargado,
                      url: fileKey,
                    };
                    const newFiles: IArchivo[] = [
                      ...currentArchivos,
                      newFile as IArchivo,
                    ];
                    setValue("archivos", newFiles);
                  }}
                  onFailure={({ file }) => {
                    console.error(`Failed to upload ${file.name}`);
                    toast({
                      title: "Error al cargar archivo",
                      description: `No se pudo cargar ${file.name}`,
                      variant: "destructive",
                    });
                  }}
                >
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/50 group cursor-pointer">
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-2 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-colors duration-200">
                        <Upload className="h-5 w-5" />
                      </div>
                      <div>
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
                        PDF, PNG, JPG, JPEG
                      </p>
                    </div>
                  </div>
                </FileUploader>
              </div>

              {watch("archivos")?.length > 0 && (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    Archivos cargados ({watch("archivos")?.length})
                  </p>
                  {watch("archivos")?.map((archivo) => (
                    <div
                      key={archivo.id}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors duration-200 group"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="p-1.5 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 flex-shrink-0">
                          <FileIcon className="h-4 w-4" />
                        </div>
                        <a
                          href={
                            archivo.url?.startsWith("http")
                              ? archivo.url
                              : `${import.meta.env.VITE_S3_URL}/${
                                  import.meta.env.VITE_S3_BUCKET
                                }/${archivo.url}`
                          }
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
                        className="opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 flex-shrink-0"
                        onClick={() => {
                          const currentArchivos: IArchivo[] =
                            getValues("archivos") || [];
                          setValue(
                            "archivos",
                            currentArchivos.filter(
                              (a) => a.id !== archivo.id
                            ) as IArchivo[]
                          );
                        }}
                      >
                        <XIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t bg-gray-50/50 dark:bg-gray-950/50 px-8 py-6">
          <div className="flex justify-center gap-4 w-full max-w-md mx-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onCloseForm}
              className="w-full max-w-[200px]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid() || isSubmitting}
              className="w-full max-w-[200px] guardar-orden"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-pulse">Guardando</span>
                  <span className="animate-[bounce_1.5s_infinite] ml-1">
                    ...
                  </span>
                </>
              ) : (
                "Guardar"
              )}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
