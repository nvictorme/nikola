import { ColumnDef } from "@tanstack/react-table";
import { IPais } from "shared/interfaces";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

export type Pais = Pick<
  IPais,
  "id" | "nombre" | "name" | "iso2" | "iso3" | "phoneCode"
>;

type ColumnActions = {
  handleEdit: (pais: Pais) => void;
};

export const columnasPaises = ({
  handleEdit,
}: ColumnActions): ColumnDef<Pais>[] => [
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "name",
    header: "Nombre en inglés",
  },
  {
    accessorKey: "iso2",
    header: "Código ISO 2",
  },
  {
    accessorKey: "iso3",
    header: "Código ISO 3",
  },
  {
    accessorKey: "phoneCode",
    header: "Código de teléfono",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const pais = row.original;
      return (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => handleEdit(pais)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
