/* eslint-disable react-hooks/rules-of-hooks */
import { IUsuario } from "shared/interfaces";
import { ColumnDef } from "@tanstack/react-table";
import { Popover } from "@radix-ui/react-popover";
import { PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useUsuariosStore } from "@/store/usuarios.store";
import { useCallback } from "react";
import { EditIcon, EyeIcon } from "lucide-react";
import { currencyFormat } from "shared/helpers";
import { Switch } from "@/components/ui/switch";

export type Usuario = Pick<
  IUsuario,
  | "nif"
  | "balance"
  | "empresa"
  | "email"
  | "nombre"
  | "apellido"
  | "pais"
  | "activo"
  | "notas"
  | "rol"
  | "exw"
>;

export const columnasUsuarios: ColumnDef<Usuario>[] = [
  {
    accessorKey: "nif",
    header: "NIF",
  },
  {
    accessorKey: "empresa",
    header: "Empresa",
  },
  {
    accessorKey: "balance",
    header: "Balance",
    accessorFn: (row) =>
      currencyFormat({
        value: row.balance,
        locale: "en-US",
        currency: "USD",
      }),
  },
  {
    accessorKey: "email",
    header: "Email",
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
    accessorKey: "pais",
    header: "País",
    accessorFn: (row) => row.pais?.nombre || "Sin país",
  },
  {
    accessorKey: "activo",
    header: "Activo",
    cell: ({ row }) => {
      const usuario = row.original as IUsuario;
      const { actualizarUsuario } = useUsuariosStore();
      return (
        <Switch
          checked={usuario.activo}
          onCheckedChange={(value) =>
            actualizarUsuario({ ...usuario, activo: value })
          }
        />
      );
    },
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
            <button className="text-blue-500">
              <EyeIcon size={16} />
            </button>
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
      const usuario = row.original as IUsuario;
      const { showSheet, setUsuario } = useUsuariosStore();
      const onEdit = useCallback(() => {
        setUsuario(usuario);
        showSheet();
      }, [usuario, setUsuario, showSheet]);
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
