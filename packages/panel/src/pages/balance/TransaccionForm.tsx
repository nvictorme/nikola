import { FileUploader } from "@/components/FileUploader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/auth.store";
import { useTransaccionesStore } from "@/store/transacciones.store";
import { useCallback, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
import {
  EstatusArchivo,
  EstatusPago,
  MetodoPago,
  TipoTransaccion,
} from "shared/enums";
import { isSuperAdmin } from "shared/helpers";
import { IArchivo, ITransaccion, IPersona } from "shared/interfaces";
import { Upload, FileIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import Joyride, { CallBackProps } from "react-joyride";
import { transaccionFormTourSteps } from "./transaccion-form.tour";

export default function TransaccionForm({
  persona,
}: {
  persona: IPersona | null;
}) {
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);

  const { crearTransaccion } = useTransaccionesStore();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ITransaccion>({
    defaultValues: {
      ...(!isAdmin && { tipo: TipoTransaccion.pago }),
      ...(!isAdmin && { estatusPago: EstatusPago.pendiente }),
      ...(!isAdmin && { metodoPago: MetodoPago.transferencia }),
      archivos: [],
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  // 'tipo' se usa para condicionar la validación y renderizado de campos
  const tipo = watch("tipo");

  const [runFormTour, setRunFormTour] = useState(false);
  const [accordionValue, setAccordionValue] = useState<string>("");

  const checkElementsReady = useCallback(() => {
    const targets = [
      ".monto-input",
      ".tipo-select",
      ".descripcion-input",
      ".archivos-uploader",
    ];
    return targets.every((selector) => document.querySelector(selector));
  }, []);

  const handleAccordionChange = (value: string) => {
    setAccordionValue(value);
    if (value === "new-transaction") {
      const hasSeenFormTour = localStorage.getItem(
        "transaction-form-tour-completed"
      );
      if (!hasSeenFormTour) {
        // Check periodically until elements are mounted
        const checkInterval = setInterval(() => {
          if (checkElementsReady()) {
            setRunFormTour(true);
            clearInterval(checkInterval);
          }
        }, 100);

        // Clear interval after 5 seconds to prevent infinite checking
        setTimeout(() => clearInterval(checkInterval), 5000);
      }
    }
  };

  const handleFormTourCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === "finished" || status === "skipped") {
      setRunFormTour(false);
      localStorage.setItem("transaction-form-tour-completed", "true");
    }
  };

  const onSubmit = useCallback(
    (data: ITransaccion) => {
      crearTransaccion({ ...data, persona: persona! });
      reset();
    },
    [persona, crearTransaccion, reset]
  );

  if (!persona) return null;

  return (
    <Accordion
      type="single"
      collapsible
      className="mb-4"
      value={accordionValue}
      onValueChange={handleAccordionChange}
    >
      <AccordionItem value="new-transaction">
        <Joyride
          steps={transaccionFormTourSteps}
          run={runFormTour}
          continuous
          showProgress
          showSkipButton
          callback={handleFormTourCallback}
          styles={{
            options: {
              primaryColor: "#3b82f6",
              zIndex: 9999,
            },
          }}
        />
        <AccordionTrigger className="rounded-lg px-4 nueva-transaccion-trigger">
          <h2 className="text-lg font-semibold">Nueva Transacción</h2>
        </AccordionTrigger>
        <AccordionContent className="p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8 max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6"
          >
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="monto" className="text-sm font-medium">
                    Monto
                  </Label>
                  <Input
                    id="monto"
                    type="number"
                    step="0.01"
                    className="mt-1.5 monto-input"
                    {...register("monto", {
                      required: "El monto es requerido",
                      valueAsNumber: true,
                    })}
                  />
                  {errors.monto && (
                    <span className="text-sm text-red-500 mt-1 block">
                      {errors.monto.message}
                    </span>
                  )}
                </div>

                <div className="tipo-select">
                  <Label htmlFor="tipo" className="text-sm font-medium">
                    Tipo de Transacción
                  </Label>
                  <Controller
                    name="tipo"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        required
                        disabled={
                          !isAdmin &&
                          ![
                            TipoTransaccion.pago,
                            TipoTransaccion.reembolso,
                          ].includes(field.value as TipoTransaccion)
                        }
                        onValueChange={(value) => {
                          field.onChange(value as TipoTransaccion);
                        }}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(TipoTransaccion)
                            .filter(
                              (tipo) =>
                                isAdmin ||
                                [
                                  TipoTransaccion.pago,
                                  TipoTransaccion.reembolso,
                                ].includes(tipo)
                            )
                            .map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipo}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
              </div>

              {tipo === TipoTransaccion.pago && (
                <div className="space-y-4 border-l-2 border-blue-200 dark:border-blue-800 pl-6 py-2 bg-blue-50/30 dark:bg-blue-950/30 rounded-r-lg">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">
                    Detalles de Pago
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label
                        htmlFor="estatusPago"
                        className="text-sm font-medium"
                      >
                        Estatus
                      </Label>
                      <Controller
                        name="estatusPago"
                        control={control}
                        // Validación: Solo es requerido si el tipo es 'pago'
                        rules={{
                          required:
                            tipo === TipoTransaccion.pago
                              ? "El estatus es requerido"
                              : false,
                        }}
                        render={({ field }) => (
                          <Select
                            // Deshabilita el selector si no es admin o el tipo no es 'pago'
                            disabled={!isAdmin || tipo !== TipoTransaccion.pago}
                            required={!isAdmin}
                            onValueChange={(value) => {
                              field.onChange(value);
                            }}
                            // Asegura que el valor sea string o vacío
                            value={field.value || ""}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar estatus" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(EstatusPago).map((estatus) => (
                                <SelectItem key={estatus} value={estatus}>
                                  {estatus}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {/* Muestra el mensaje de error solo si no se selecciona estatus */}
                      {errors.estatusPago && (
                        <span className="text-sm text-red-500 mt-1 block">
                          {errors.estatusPago.message}
                        </span>
                      )}
                    </div>
                    <div>
                      <Label
                        htmlFor="metodoPago"
                        className="text-sm font-medium"
                      >
                        Método
                      </Label>
                      <Controller
                        name="metodoPago"
                        control={control}
                        render={({ field }) => (
                          <Select
                            required={!isAdmin}
                            disabled={tipo !== TipoTransaccion.pago}
                            onValueChange={(value) => {
                              field.onChange(value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar método" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.values(MetodoPago).map((metodo) => (
                                <SelectItem key={metodo} value={metodo}>
                                  {metodo}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="descripcion" className="text-sm font-medium">
                  Descripción
                </Label>
                <Textarea
                  id="descripcion"
                  className="mt-1.5 min-h-[100px] resize-y descripcion-input"
                  {...register("descripcion", {
                    required: "La descripción es requerida",
                    maxLength: 500,
                  })}
                />
                {errors.descripcion && (
                  <span className="text-sm text-red-500 mt-1 block">
                    {errors.descripcion.message}
                  </span>
                )}
              </div>
            </div>

            <Controller
              name="archivos"
              control={control}
              render={({ field }) => (
                <div className="space-y-4">
                  <Label className="text-sm font-medium">
                    Archivos Adjuntos
                  </Label>
                  <div className="archivos-uploader">
                    <FileUploader
                      folder={`transacciones/${
                        persona?.id ?? user?.id ?? "some_id"
                      }`}
                      onSuccess={({ file, fileKey }) => {
                        const newArchivos = Array.isArray(field.value)
                          ? [...getValues("archivos")]
                          : [];
                        newArchivos.push({
                          id: uuidv4(),
                          nombre: file.name,
                          tipo: file.type,
                          estatus: EstatusArchivo.cargado,
                          url: fileKey,
                        } as IArchivo);
                        setValue("archivos", newArchivos);
                      }}
                      onFailure={({ file }) => {
                        console.error(`Failed to upload ${file.name}`);
                        toast.error(`Error al cargar ${file.name}`);
                      }}
                    >
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center transition-all duration-200 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/50 group cursor-pointer">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-800 transition-colors duration-200">
                            <Upload className="h-8 w-8" />
                          </div>
                          <div className="space-y-2">
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

                    {field.value.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                          Archivos cargados ({field.value.length})
                        </p>
                        {field.value.map((archivo) => (
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
                              onClick={() => {
                                field.onChange(
                                  field.value.filter(
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
              )}
            />

            <Button
              type="submit"
              className="w-full py-6 text-lg font-medium text-white dark:text-gray-50"
            >
              Agregar Transacción
            </Button>
          </form>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
