import { ColumnDef } from "@tanstack/react-table";
import { IMovimiento } from "shared/interfaces";
import { formatearFecha } from "shared/helpers";
import { StatusCell } from "./StatusCell";
import { MovimientoActions } from "./MovimientoActions";

export const columnasMovimientos = ({
  onEdit,
  onDelete,
}: {
  onEdit: (movimiento: IMovimiento) => void;
  onDelete: (movimiento: IMovimiento) => void;
}): ColumnDef<IMovimiento>[] => [
  {
    accessorKey: "serial",
    header: () => <div className="text-center w-10">#Serial</div>,
    cell: ({ row }) => {
      const serial = row.getValue("serial") as number;
      return (
        <div className="font-medium text-center whitespace-nowrap w-10">
          {serial}
        </div>
      );
    },
    size: 60,
  },
  {
    accessorKey: "fechaCreado",
    header: () => <div className="text-center w-12 ml-3">Fecha</div>,
    cell: ({ row }) => {
      const fecha = row.getValue("fechaCreado") as string;
      return (
        <div className="text-center whitespace-nowrap w-8">
          {formatearFecha(fecha)}
        </div>
      );
    },
    size: 110,
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
        <MovimientoActions
          movimiento={movimiento}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );
    },
  },
];
