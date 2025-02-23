import { ColumnDef } from "@tanstack/react-table";
import { ISucursal } from "shared/interfaces";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

export type Sucursal = Pick<ISucursal, "id" | "pais" | "nombre" | "direccion">;

type ColumnActions = {
  handleEdit: (sucursal: ISucursal) => void;
};

export const columnasSucursales = ({
  handleEdit,
}: ColumnActions): ColumnDef<ISucursal>[] => [
  {
    accessorKey: "pais",
    header: "País",
    cell: ({ row }) => {
      const sucursal = row.original as ISucursal;
      return <p>{sucursal.pais?.nombre}</p>;
    },
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    id: "direccion",
    header: "Dirección",
    cell: ({ row }) => {
      const sucursal = row.original as ISucursal;
      return (
        <div>
          <p>{sucursal.direccion?.calle}</p>
          <p>{sucursal.direccion?.ciudad}</p>
          <p>{sucursal.direccion?.codigoPostal}</p>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sucursal = row.original;
      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(sucursal)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
