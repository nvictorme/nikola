/* eslint-disable react-hooks/rules-of-hooks */
import { IPersona } from "shared/interfaces";
import { ColumnDef } from "@tanstack/react-table";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCallback } from "react";
import { usePersonasStore } from "@/store/personas.store";
import { EditIcon, EyeIcon } from "lucide-react";

export type Persona = Pick<
  IPersona,
  "nif" | "empresa" | "nombre" | "apellido" | "notas"
>;

export const columnasPersonas: ColumnDef<Persona>[] = [
  {
    accessorKey: "nif",
    header: "NIF",
  },
  {
    accessorKey: "empresa",
    header: "Empresa",
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "apellido",
    header: "Apellido",
  },
  {
    accessorKey: "notas",
    header: "Notas",
    cell: ({ row }) => {
      const notas = row.original.notas;
      if (!notas) return null;
      return (
        <Popover>
          <PopoverTrigger>
            <EyeIcon size={16} className="text-blue-500" />
          </PopoverTrigger>
          <PopoverContent>
            <div className="p-4">{notas}</div>
          </PopoverContent>
        </Popover>
      );
    },
  },
  {
    id: "acciones",
    header: "",
    cell: ({ row }) => {
      const persona = row.original as IPersona;
      const { showSheet, setPersona } = usePersonasStore();
      const onEdit = useCallback(() => {
        setPersona(persona);
        showSheet();
      }, [persona, setPersona, showSheet]);
      return (
        <div className="flex gap-2">
          <button className="text-blue-500" onClick={onEdit}>
            <EditIcon size={16} />
          </button>
        </div>
      );
    },
  },
];
