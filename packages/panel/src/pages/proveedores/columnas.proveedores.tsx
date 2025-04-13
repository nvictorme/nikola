/* eslint-disable react-hooks/rules-of-hooks */
import { IProveedor } from "shared/interfaces";
import { ColumnDef } from "@tanstack/react-table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCallback, useState } from "react";
import { useProveedoresStore } from "@/store/proveedores.store";
import { EditIcon, EyeIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export type Proveedor = Pick<
  IProveedor,
  "nombre" | "marca" | "direccion" | "telefono" | "email" | "notas"
>;

export const columnasProveedores: ColumnDef<Proveedor>[] = [
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "marca",
    header: "Marca",
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
      const proveedor = row.original as IProveedor;
      const { showSheet, setProveedor } = useProveedoresStore();
      const [open, setOpen] = useState(false);

      const onEdit = useCallback(() => {
        setProveedor(proveedor);
        showSheet();
      }, [proveedor, setProveedor, showSheet]);

      const onPreview = useCallback(() => {
        setOpen(true);
      }, []);
      return (
        <div className="flex items-center justify-end gap-4">
          <button
            className="text-emerald-500 hover:text-emerald-600 transition-colors"
            onClick={onPreview}
          >
            <EyeIcon size={18} />
          </button>
          <button
            className="text-blue-500 hover:text-blue-600 transition-colors"
            onClick={onEdit}
          >
            <EditIcon size={18} />
          </button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Información del Proveedor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <div className="text-sm">{proveedor.nombre}</div>
                </div>
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <div className="text-sm">{proveedor.marca}</div>
                </div>
                <div className="space-y-2">
                  <Label>Dirección</Label>
                  <div className="text-sm">{proveedor.direccion}</div>
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <div className="text-sm">{proveedor.telefono}</div>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <div className="text-sm">{proveedor.email}</div>
                </div>
                {proveedor.notas && (
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <div className="text-sm">{proveedor.notas}</div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];
