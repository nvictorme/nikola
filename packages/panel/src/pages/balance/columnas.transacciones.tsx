/* eslint-disable react-hooks/rules-of-hooks */
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/store/auth.store";
import { useTransaccionesStore } from "@/store/transacciones.store";
import { ColumnDef } from "@tanstack/react-table";
import { EyeIcon, ThumbsDownIcon, ThumbsUpIcon } from "lucide-react";
import { EstatusPago, TipoTransaccion } from "shared/enums";
import { currencyFormat, isSuperAdmin } from "shared/helpers";
import { IArchivo, ITransaccion } from "shared/interfaces";

export type Transaccion = Pick<
  ITransaccion,
  | "id"
  | "usuario"
  | "fechaCreado"
  | "referencia"
  | "descripcion"
  | "monto"
  | "balance"
  | "tipo"
  | "estatusPago"
  | "metodoPago"
  | "archivos"
  | "qbInvoiceId"
  | "qbInvoiceDocNumber"
>;

export const columnasTransacciones: ColumnDef<Transaccion>[] = [
  {
    accessorKey: "fechaCreado",
    header: "Fecha",
    accessorFn: (row) => new Date(row.fechaCreado).toLocaleDateString(),
  },
  {
    accessorKey: "referencia",
    header: "Referencia",
    accessorFn: (row) =>
      `T-${row.referencia < 10 ? "00" : row.referencia < 100 ? "0" : ""}${
        row.referencia
      }`,
  },
  {
    accessorKey: "descripcion",
    header: "Descripción",
    cell: ({ row }) => {
      const transaccion = row.original as Transaccion;
      const { user } = useAuthStore();
      const isAdmin = isSuperAdmin(user);
      if (isAdmin && transaccion.qbInvoiceDocNumber) {
        return (
          <div className="text-xs">
            {transaccion.qbInvoiceDocNumber && isAdmin && (
              <Button
                variant="link"
                className="text-xs p-0 h-auto"
                onClick={() => {
                  window.open(
                    `${import.meta.env.VITE_QBO_URL}/invoice?txnId=${
                      transaccion.qbInvoiceId
                    }`,
                    "_blank"
                  );
                }}
              >
                {transaccion.descripcion}
              </Button>
            )}
          </div>
        );
      } else {
        return <div className="text-xs">{transaccion.descripcion}</div>;
      }
    },
  },
  {
    accessorKey: "tipo",
    header: "Tipo",
  },
  {
    accessorKey: "estatusPago",
    header: "Estatus",
    cell: ({ row }) => {
      const { user } = useAuthStore();
      const isAdmin = isSuperAdmin(user);
      const { actualizarEstatus } = useTransaccionesStore();
      const estatus = row.original.estatusPago as EstatusPago;
      const tipo = row.original.tipo as TipoTransaccion;

      if (!estatus) return null;
      return (
        <div className="justify-center align-middle items-center">
          <span>{estatus}</span>
          {isAdmin &&
          estatus === EstatusPago.pendiente &&
          (tipo === TipoTransaccion.pago ||
            tipo === TipoTransaccion.reembolso) ? (
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  actualizarEstatus({
                    usuarioId: row.original.usuario.id,
                    transaccionId: row.original.id,
                    estatusPago: EstatusPago.confirmado,
                  });
                }}
              >
                <ThumbsUpIcon className="text-green-500" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  actualizarEstatus({
                    usuarioId: row.original.usuario.id,
                    transaccionId: row.original.id,
                    estatusPago: EstatusPago.rechazado,
                  });
                }}
              >
                <ThumbsDownIcon className="text-red-500" />
              </Button>
            </div>
          ) : null}
        </div>
      );
    },
  },
  {
    accessorKey: "metodoPago",
    header: "Método",
  },
  {
    accessorKey: "archivos",
    header: "Comprobantes",
    cell: ({ row }) => {
      const archivos = row.original.archivos as IArchivo[];
      if (!archivos.length) return null;
      return (
        <Popover>
          <PopoverTrigger>
            <Button variant="ghost" size="icon" asChild>
              <EyeIcon className="text-blue-500 w-5 h-5" />
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
    accessorKey: "monto",
    header: "Monto",
    accessorFn: (row) => currencyFormat({ value: row.monto }),
  },
  {
    accessorKey: "balance",
    header: "Balance",
    cell: ({ row }) => {
      const tipo = row.original.tipo;
      const estatus = row.original.estatusPago;
      const balance = row.original.balance;
      if (
        (tipo === TipoTransaccion.pago || tipo === TipoTransaccion.reembolso) &&
        estatus !== EstatusPago.confirmado &&
        estatus !== EstatusPago.rechazado
      ) {
        return <span>-</span>;
      }
      return (
        <span>
          {currencyFormat({
            value: balance,
          })}
        </span>
      );
    },
  },
];
