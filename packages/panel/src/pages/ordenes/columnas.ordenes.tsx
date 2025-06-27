/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useMemo } from "react";
import { IArchivo, IOrden } from "shared/interfaces";
import { ColumnDef } from "@tanstack/react-table";
import {
  CheckCircleIcon,
  DeleteIcon,
  EyeIcon,
  FileIcon,
  HandshakeIcon,
  PencilIcon,
  TruckIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrdenesStore } from "@/store/ordenes.store";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuthStore } from "@/store/auth.store";
import {
  getEstatusColor,
  isSuperAdmin,
  getTrackingUrl,
  canCreateOrders,
  currencyFormat,
  formatearFecha,
} from "shared/helpers";
import { EstatusOrden, TipoOrden } from "shared/enums";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrdenPreview } from "./OrdenPreview";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { EnvioForm } from "./EnvioForm";
import { Timeline, TimelineItem } from "@/components/ui/timeline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getAllowedStatuses, isStatusDisabled } from "./ordenes.helpers";

export type Orden = Pick<
  IOrden,
  | "serial"
  | "fechaCreado"
  | "estatus"
  | "tipo"
  | "sucursal"
  | "cliente"
  | "proveedor"
  | "archivos"
  | "envios"
  | "tipoCambio"
  | "tasaCambio"
  | "total"
>;

// Agregar este objeto que define el orden de los estados (añadir cerca del inicio del archivo)
const estatusOrden: Record<EstatusOrden, number> = {
  [EstatusOrden.pendiente]: 1,
  [EstatusOrden.aprobado]: 2,
  [EstatusOrden.rechazado]: 0,
  [EstatusOrden.confirmado]: 3,
  [EstatusOrden.procesando]: 4,
  [EstatusOrden.enviado]: 5,
  [EstatusOrden.recibido]: 6,
  [EstatusOrden.entregado]: 7,
  [EstatusOrden.cancelado]: 0,
  [EstatusOrden.cerrado]: 8,
};

export const columnasOrdenes: ColumnDef<Orden>[] = [
  {
    accessorKey: "serial",
    header: "#Orden",
    cell: ({ row }) => {
      const orden = row.original as IOrden;
      const { listarHistorial, historial } = useOrdenesStore();
      const [open, setOpen] = useState(false);

      return (
        <Popover
          open={open}
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (isOpen) {
              listarHistorial(orden.id);
            }
          }}
        >
          <PopoverTrigger asChild>
            <Button variant="link" className="p-0 h-auto font-medium">
              {orden.serial}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium">
                Historial de la orden #{orden.serial}
              </h4>
              <ScrollArea className="h-[300px] pr-4">
                <Timeline>
                  {historial.map((h) => (
                    <TimelineItem key={h.id}>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {h.estatus}
                          {h.envio && (
                            <>
                              <span className="text-xs text-muted-foreground">
                                {" "}
                                - {h.envio.transportista}:{" "}
                                <a
                                  href={getTrackingUrl(h.envio)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-blue-500 hover:text-blue-700"
                                >
                                  {h.envio.tracking}
                                </a>
                              </span>
                              {h.envio.notas && (
                                <div className="text-xs text-muted-foreground mt-0.5 pl-2 italic">
                                  {h.envio.notas}
                                </div>
                              )}
                            </>
                          )}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(h.fechaCreado).toLocaleString("es-US", {
                            timeZone: "America/New_York",
                          })}
                        </span>
                        <span className="text-xs">
                          {h.usuario.nombre} {h.usuario.apellido}
                        </span>
                        {h.notas && (
                          <span className="text-xs text-muted-foreground">
                            {h.notas}
                          </span>
                        )}
                      </div>
                    </TimelineItem>
                  ))}
                </Timeline>
              </ScrollArea>
            </div>
          </PopoverContent>
        </Popover>
      );
    },
  },
  {
    accessorKey: "fechaCreado",
    header: "Fecha",
    accessorFn: (row) => new Date(row.fechaCreado).toLocaleDateString(),
  },
  {
    id: "estatus",
    // Centrar el encabezado de la columna Estatus
    header: () => <div className="text-center w-full">Estatus</div>,
    cell: ({ row }) => {
      const orden = row.original as IOrden;
      const { user } = useAuthStore();
      const canCreate = canCreateOrders(user);
      const { actualizarEstatusOrden, loading } = useOrdenesStore();

      // Obtener el nivel del estatus actual
      const estatusActualNivel = estatusOrden[orden.estatus];

      return canCreate ? (
        <Select
          value={orden.estatus || EstatusOrden.pendiente}
          onValueChange={(value) => {
            actualizarEstatusOrden(
              (row.original as IOrden).id,
              value as EstatusOrden
            );
          }}
          disabled={loading}
        >
          <SelectTrigger className={`${getEstatusColor(orden.estatus)}`}>
            <SelectValue>{orden.estatus || EstatusOrden.pendiente}</SelectValue>
          </SelectTrigger>
          {/*
            Si el tipo de orden es cotización, solo permitir seleccionar los estatus 'Aprobado' y 'Rechazado'.
            Si el tipo de orden es reposición, solo permitir seleccionar los estatus 'Aprobado', 'Confirmado', 'Enviado', 'Recibido' y 'Cancelado'.
            Si el tipo de orden es Venta o Crédito, solo permitir seleccionar los estatus 'Aprobado', 'Rechazado', 'Confirmado', 'Entregado' y 'Cancelado'.
            Para otros tipos de orden, mostrar todos los estatus posibles.
          */}
          <SelectContent>
            {getAllowedStatuses(orden).map((est) => (
              <SelectItem
                key={est}
                value={est}
                disabled={isStatusDisabled({
                  est,
                  orden,
                  estatusOrden,
                  estatusActualNivel,
                })}
              >
                {est}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <span className={`font-semibold ${getEstatusColor(orden.estatus)}`}>
          {orden.estatus || EstatusOrden.pendiente}
        </span>
      );
    },
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
    accessorFn: (row) => row.tipo,
  },
  {
    accessorKey: "cliente",
    header: "Cliente",
    accessorFn: (row) => {
      const cliente = row.cliente;
      if (!cliente) return null;
      let clienteStr = "";
      if (cliente?.empresa) {
        clienteStr += ` ${cliente.empresa}`;
      } else {
        clienteStr += ` ${cliente?.nombre} ${cliente?.apellido}`;
      }
      return clienteStr;
    },
  },
  {
    accessorKey: "proveedor",
    header: "Proveedor",
    accessorFn: (row) => row.proveedor?.marca,
  },
  {
    accessorKey: "total",
    header: "Total (USD)",
    accessorFn: (row) => currencyFormat({ value: row.total || 0 }),
  },
  {
    accessorKey: "archivos",
    header: "Archivos",
    cell: ({ row }) => {
      const archivos = row.original.archivos as IArchivo[];
      if (!archivos.length) return null;
      return (
        <Popover>
          <PopoverTrigger>
            <Button variant="ghost" size="icon" asChild>
              <FileIcon className="text-blue-500 w-5 h-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <ScrollArea className="max-h-72 rounded-md border">
              <div className="p-4">
                {archivos.map((archivo, idx) => (
                  <div key={archivo.id}>
                    <a
                      href={archivo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-500 text-sm"
                    >
                      {idx + 1}. {archivo.nombre}
                    </a>
                    <Separator className="my-1" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      );
    },
  },
  {
    id: "acciones",
    header: "Acciones",
    cell: ({ row }) => {
      const orden = row.original as IOrden;
      const { user } = useAuthStore();
      const isAdmin = isSuperAdmin(user);
      const [openConvertir, setOpenConvertir] = useState<boolean>(false);
      const [openEliminar, setOpenEliminar] = useState<boolean>(false);
      const [openPreview, setOpenPreview] = useState<boolean>(false);
      const {
        setOrden,
        setShowForm,
        eliminarOrden,
        convertirEnOrden,
        actualizarEstatusOrden,
      } = useOrdenesStore();
      const [openEnvio, setOpenEnvio] = useState<boolean>(false);

      const canEdit = useMemo(() => {
        return [
          EstatusOrden.pendiente,
          EstatusOrden.rechazado,
          EstatusOrden.aprobado,
        ].includes(orden.estatus);
      }, [orden.estatus]);

      const canAddTracking = useMemo(() => {
        return [EstatusOrden.procesando, EstatusOrden.enviado].includes(
          orden.estatus
        );
      }, [orden.estatus]);

      return (
        <>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenPreview(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <EyeIcon size={16} />
            </Button>

            {canEdit ? (
              <Button
                variant="link"
                className="text-blue-500"
                onClick={() => {
                  setOrden(orden as IOrden);
                  setShowForm(true);
                }}
              >
                <PencilIcon size={16} />
              </Button>
            ) : null}

            {isAdmin && canAddTracking ? (
              <AlertDialog open={openEnvio}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-500"
                    onClick={() => setOpenEnvio(true)}
                  >
                    <TruckIcon size={16} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <TruckIcon size={16} />
                      Agregar envío
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Ingresa los datos del envío para la orden #{orden.serial}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <EnvioForm
                    orden={orden as IOrden}
                    onOpenChange={setOpenEnvio}
                  />
                </AlertDialogContent>
              </AlertDialog>
            ) : null}

            {(orden.tipo === TipoOrden.venta ||
              orden.tipo === TipoOrden.credito) &&
            estatusOrden[orden.estatus] > 4 &&
            estatusOrden[orden.estatus] < 7 ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-green-500 hover:text-green-700"
                      onClick={() => {
                        actualizarEstatusOrden(
                          orden.id,
                          EstatusOrden.entregado
                        );
                      }}
                    >
                      <HandshakeIcon size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Entregar</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : null}

            {isAdmin ? (
              <AlertDialog open={openEliminar}>
                <Button variant="ghost" onClick={() => setOpenEliminar(true)}>
                  <DeleteIcon size={16} className="text-red-500" />
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Seguro deseas eliminar la orden?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción es irreversible y eliminará la orden de forma
                      permanente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        eliminarOrden((orden as IOrden).id);
                        setOpenEliminar(false);
                      }}
                    >
                      Eliminar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setOpenEliminar(false)}
                    >
                      Cancelar
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
            {/* 
            Solo mostrar la opción de convertir en orden si la cotización NO está rechazada
            Esto previene que cotizaciones rechazadas puedan ser convertidas desde el frontend
            */}
            {orden.tipo === TipoOrden.cotizacion &&
            orden.estatus !== EstatusOrden.rechazado ? (
              <AlertDialog open={openConvertir}>
                <Button
                  variant="secondary"
                  className="text-xs gap-1 hover:text-green-500 whitespace-pre-line text-center min-w-[110px] pr-2"
                  onClick={() => setOpenConvertir(true)}
                >
                  {/* Icono de verificación alineado a la izquierda del texto */}
                  <CheckCircleIcon
                    size={16}
                    className="text-green-500 mr-0.5 -ml-2"
                  />{" "}
                  {/* Texto en dos líneas para evitar scroll horizontal innecesario */}
                  {`Convertir en\nOrden`}
                </Button>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Seguro deseas convertir la cotización #{orden.serial} en
                      una orden?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción es irreversible y permanente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setOpenConvertir(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="secondary"
                      className="text-xs gap-2 hover:text-green-500"
                      onClick={() => {
                        convertirEnOrden(orden);
                        setOpenConvertir(false);
                      }}
                    >
                      <CheckCircleIcon size={16} className="text-green-500" />{" "}
                      Convertir en orden
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
          </div>

          <OrdenPreview
            orden={orden as IOrden}
            open={openPreview}
            onOpenChange={setOpenPreview}
          />
        </>
      );
    },
  },
];
