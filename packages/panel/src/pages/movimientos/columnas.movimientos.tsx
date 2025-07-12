import { ColumnDef } from "@tanstack/react-table";
import { IMovimiento } from "shared/interfaces";
import { EstatusMovimiento } from "shared/enums";
import { Eye, PencilIcon, DeleteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatearFecha } from "shared/helpers";
import { StatusCell } from "./StatusCell";
import { MovimientoPreview } from "./MovimientoPreview";

export const columnasMovimientos = ({
  onEdit,
  onPreview,
  onDelete,
}: {
  onEdit: (movimiento: IMovimiento) => void;
  onPreview: (movimiento: IMovimiento) => void;
  onDelete: (movimiento: IMovimiento) => void;
}): ColumnDef<IMovimiento>[] => [
  {
    accessorKey: "serial",
    header: () => <div className="text-center w-full">#Serial</div>,
    cell: ({ row }) => {
      const serial = row.getValue("serial") as number;
      return <div className="font-medium text-center">{serial}</div>;
    },
  },
  {
    accessorKey: "fechaCreado",
    header: () => <div className="text-center w-full">Fecha</div>,
    cell: ({ row }) => {
      const fecha = row.getValue("fechaCreado") as string;
      return (
        <div className="text-center whitespace-nowrap">
          {formatearFecha(fecha)}
        </div>
      );
    },
  },
  {
    accessorKey: "estatus",
    header: () => <div className="text-center w-full">Estatus</div>,
    cell: ({ row }) => {
      const movimiento = row.original;
      return (
        <div className="text-center">
          <StatusCell movimiento={movimiento} />
        </div>
      );
    },
  },
  {
    accessorKey: "origen",
    header: () => <div className="text-center w-full">Almacén Origen</div>,
    cell: ({ row }) => {
      const origen = row.original.origen;
      return <div className="text-center">{origen.nombre}</div>;
    },
  },
  {
    accessorKey: "destino",
    header: () => <div className="text-center w-full">Almacén Destino</div>,
    cell: ({ row }) => {
      const destino = row.original.destino;
      return <div className="text-center">{destino.nombre}</div>;
    },
  },
  {
    accessorKey: "items",
    header: () => <div className="text-center w-full">Productos</div>,
    cell: ({ row }) => {
      const items = row.original.items;
      const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
      const uniqueProducts = items.length;
      return (
        <div className="text-center">
          <span className="font-medium">{uniqueProducts} Productos</span>
          <span className="text-sm text-muted-foreground block">
            {totalItems} Unidades
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "usuario",
    header: () => <div className="text-center w-full">Responsable</div>,
    cell: ({ row }) => {
      const usuario = row.original.usuario;
      return (
        <div className="text-center">
          {usuario.nombre} {usuario.apellido}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center w-32">Acciones</div>,
    cell: ({ row }) => {
      const movimiento = row.original;
      return (
        <div className="w-32 flex gap-2 justify-start">
          <Button
            variant="ghost"
            size="icon"
            title="Ver detalles"
            onClick={() => onPreview(movimiento)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Eye size={16} />
          </Button>
          <MovimientoPreview
            movimiento={movimiento}
            open={false} // Removed useState and setOpen
            onOpenChange={() => {}} // Removed onOpenChange
          />
          {movimiento.estatus === EstatusMovimiento.pendiente && (
            <Button
              variant="link"
              size="icon"
              title="Editar"
              onClick={() => onEdit(movimiento)}
              className="text-blue-500"
            >
              <PencilIcon size={16} />
            </Button>
          )}
          {movimiento.estatus === EstatusMovimiento.pendiente && (
            <Button
              variant="ghost"
              size="icon"
              title="Eliminar"
              onClick={() => onDelete(movimiento)}
              className="text-red-500 hover:text-red-700"
            >
              <DeleteIcon size={16} />
            </Button>
          )}
        </div>
      );
    },
  },
];
