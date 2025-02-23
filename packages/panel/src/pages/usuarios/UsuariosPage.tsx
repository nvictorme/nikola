import { DataTable } from "@/components/DataTable";
import { useCallback, useEffect } from "react";
import { columnasUsuarios, Usuario } from "./columnas.usuarios";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PlusCircle } from "lucide-react";
import { useUsuariosStore } from "@/store/usuarios.store";
import UsuarioForm from "./UsuarioForm";

const UsuariosPage: React.FC = () => {
  const {
    usuarios,
    listarUsuarios,
    setUsuario,
    openSheet,
    showSheet,
    hideSheet,
    page,
    limit,
    pageCount,
    setPage,
    setLimit,
  } = useUsuariosStore();

  useEffect(() => {
    listarUsuarios({});
  }, [listarUsuarios]);

  const onOpenSheet = useCallback(() => {
    setUsuario(null);
    showSheet();
  }, [setUsuario, showSheet]);

  return (
    <div>
      <header className="flex items-center justify-end mb-4">
        <Sheet
          open={openSheet}
          onOpenChange={(open) => {
            if (!open) hideSheet();
          }}
        >
          <button
            className="text-blue-500 flex gap-1"
            onClick={onOpenSheet}
            type="button"
          >
            <PlusCircle size={24} /> Usuario
          </button>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Usuario</SheetTitle>
            </SheetHeader>
            <SheetDescription asChild>
              <UsuarioForm />
            </SheetDescription>
          </SheetContent>
        </Sheet>
      </header>
      <DataTable
        columns={columnasUsuarios}
        data={usuarios as Usuario[]}
        page={page}
        pageCount={pageCount}
        limit={limit}
        setPage={setPage}
        setLimit={setLimit}
      />
    </div>
  );
};

export default UsuariosPage;
