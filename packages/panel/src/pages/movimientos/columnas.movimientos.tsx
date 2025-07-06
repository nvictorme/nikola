import { ColumnDef } from "@tanstack/react-table";
import { IMovimiento } from "shared/interfaces";
import { EstatusMovimiento } from "shared/enums";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatearFecha } from "shared/helpers";

export const columnasMovimientos: ColumnDef<IMovimiento>[] = [
  {
    accessorKey: "serial",
    header: "Serial",
    cell: ({ row }) => {
      const serial = row.getValue("serial") as number;
      return <div className="font-medium">#{serial}</div>;
    },
  },
  {
    accessorKey: "origen",
    header: "Almacén Origen",
    cell: ({ row }) => {
      const origen = row.original.origen;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{origen.nombre}</span>
          <span className="text-sm text-muted-foreground">
            {origen.direccion?.ciudad || "Sin ciudad"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "destino",
    header: "Almacén Destino",
    cell: ({ row }) => {
      const destino = row.original.destino;
      return (
        <div className="flex flex-col">
          <span className="font-medium">{destino.nombre}</span>
          <span className="text-sm text-muted-foreground">
            {destino.direccion?.ciudad || "Sin ciudad"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "items",
    header: "Productos",
    cell: ({ row }) => {
      const items = row.original.items;
      const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0);
      const uniqueProducts = items.length;

      return (
        <div className="flex flex-col">
          <span className="font-medium">{uniqueProducts} productos</span>
          <span className="text-sm text-muted-foreground">
            {totalItems} unidades total
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "estatus",
    header: "Estatus",
    cell: ({ row }) => {
      const estatus = row.getValue("estatus") as EstatusMovimiento;

      const getStatusColor = (status: EstatusMovimiento) => {
        switch (status) {
          case EstatusMovimiento.pendiente:
            return "bg-yellow-100 text-yellow-800";
          case EstatusMovimiento.aprobado:
            return "bg-blue-100 text-blue-800";
          case EstatusMovimiento.transito:
            return "bg-orange-100 text-orange-800";
          case EstatusMovimiento.recibido:
            return "bg-green-100 text-green-800";
          case EstatusMovimiento.anulado:
            return "bg-red-100 text-red-800";
          default:
            return "bg-gray-100 text-gray-800";
        }
      };

      return <Badge className={getStatusColor(estatus)}>{estatus}</Badge>;
    },
  },
  {
    accessorKey: "usuario",
    header: "Creado por",
    cell: ({ row }) => {
      const usuario = row.original.usuario;
      return (
        <div className="flex flex-col">
          <span className="font-medium">
            {usuario.nombre} {usuario.apellido}
          </span>
          <span className="text-sm text-muted-foreground">{usuario.email}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "fechaCreado",
    header: "Fecha",
    cell: ({ row }) => {
      const fecha = row.getValue("fechaCreado") as string;
      return <span className="font-medium">{formatearFecha(fecha)}</span>;
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const movimiento = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menú</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                // Ver detalles del movimiento
                console.log("Ver movimiento:", movimiento.id);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver detalles
            </DropdownMenuItem>
            {movimiento.estatus === EstatusMovimiento.pendiente && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    // Aprobar movimiento
                    console.log("Aprobar movimiento:", movimiento.id);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Aprobar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // Eliminar movimiento
                    console.log("Eliminar movimiento:", movimiento.id);
                  }}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </>
            )}
            {movimiento.estatus === EstatusMovimiento.aprobado && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    // Poner en tránsito
                    console.log("Poner en tránsito:", movimiento.id);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Poner en tránsito
                </DropdownMenuItem>
              </>
            )}
            {movimiento.estatus === EstatusMovimiento.transito && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    // Marcar como recibido
                    console.log("Marcar como recibido:", movimiento.id);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Marcar como recibido
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
