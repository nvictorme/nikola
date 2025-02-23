import { ColumnDef } from "@tanstack/react-table";
import { IAlmacen } from "shared/interfaces";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

export type Almacen = Pick<IAlmacen, "id" | "pais" | "nombre" | "direccion">;

type ColumnActions = {
  handleEdit: (almacen: Almacen) => void;
};

export const columnasAlmacenes = ({
  handleEdit,
}: ColumnActions): ColumnDef<Almacen>[] => [
  {
    accessorKey: "pais",
    header: "País",
    cell: ({ row }) => {
      const almacen = row.original as IAlmacen;
      return <p>{almacen.pais?.nombre}</p>;
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
      const almacen = row.original as IAlmacen;
      return (
        <div>
          <p>{almacen.direccion?.calle}</p>
          <p>{almacen.direccion?.ciudad}</p>
          <p>{almacen.direccion?.codigoPostal}</p>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const almacen = row.original;
      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(almacen)}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
