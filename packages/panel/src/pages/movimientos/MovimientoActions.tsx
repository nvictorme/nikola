import { IMovimiento } from "shared/interfaces";
import { EstatusMovimiento } from "shared/enums";
import { Eye, PencilIcon, DeleteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isSuperAdmin } from "shared/helpers";
import { useAuthStore } from "@/store/auth.store";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { MovimientoPreview } from "./MovimientoPreview";

interface MovimientoActionsProps {
  movimiento: IMovimiento;
  onEdit: (movimiento: IMovimiento) => void;
  onDelete: (movimiento: IMovimiento) => void;
}

export const MovimientoActions = ({
  movimiento,
  onEdit,
  onDelete,
}: MovimientoActionsProps) => {
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);
  const [openEliminar, setOpenEliminar] = useState<boolean>(false);
  const [openPreview, setOpenPreview] = useState<boolean>(false);

  return (
    <>
      <div className="w-32 flex gap-2 justify-start">
        <Button
          variant="ghost"
          size="icon"
          title="Ver detalles"
          onClick={() => setOpenPreview(true)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Eye size={16} />
        </Button>
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
        {isAdmin && movimiento.estatus === EstatusMovimiento.pendiente ? (
          <AlertDialog open={openEliminar}>
            <Button
              variant="ghost"
              size="icon"
              title="Eliminar"
              onClick={() => setOpenEliminar(true)}
              className="text-red-500 hover:text-red-700"
            >
              <DeleteIcon size={16} />
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Seguro deseas eliminar el movimiento?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción es irreversible y eliminará el movimiento de forma
                  permanente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <Button
                  variant="destructive"
                  onClick={() => {
                    onDelete(movimiento);
                    setOpenEliminar(false);
                  }}
                >
                  Eliminar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOpenEliminar(false)}
                >
                  Cancelar
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </div>

      <MovimientoPreview
        movimiento={movimiento}
        open={openPreview}
        onOpenChange={setOpenPreview}
      />
    </>
  );
};
