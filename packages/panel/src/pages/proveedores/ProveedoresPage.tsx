import { DataTable } from "@/components/DataTable";
import { useProveedoresStore } from "@/store/proveedores.store";
import { useCallback, useEffect } from "react";
import { columnasProveedores, Proveedor } from "./columnas.proveedores";
import CreateButton from "@/components/CreateButton";
import ProveedorForm from "./ProveedorForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ProveedoresPage: React.FC = () => {
  const {
    proveedores,
    listarProveedores,
    setProveedor,
    openSheet,
    showSheet,
    hideSheet,
    page,
    limit,
    pageCount,
    setPage,
    setLimit,
    term,
    setTerm,
  } = useProveedoresStore();

  useEffect(() => {
    listarProveedores();
  }, [listarProveedores]);

  const onOpenSheet = useCallback(() => {
    setProveedor(null);
    showSheet();
  }, [setProveedor, showSheet]);

  return (
    <div className="container mx-auto space-y-4">
      <header className="sticky top-16 z-50 border-b bg-background py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="text-left block mb-2">
              Buscar
            </Label>
            <Input
              id="search"
              placeholder="Buscar proveedores por nombre, marca, email o teléfono"
              defaultValue={term}
              onChange={(e) => {
                const value = e.target.value ?? "";
                setTerm(value.trim());
              }}
              disabled={openSheet}
            />
          </div>
          <div className="flex flex-col">
            <div className="mb-2 h-5"></div>
            <CreateButton
              title="Proveedor"
              buttonText="Proveedor"
              open={openSheet}
              onOpenChange={(open) => {
                if (!open) hideSheet();
              }}
              onOpen={onOpenSheet}
            >
              <ProveedorForm />
            </CreateButton>
          </div>
        </div>
      </header>
      <DataTable
        columns={columnasProveedores}
        data={proveedores as Proveedor[]}
        page={page}
        limit={limit}
        pageCount={pageCount}
        setPage={setPage}
        setLimit={setLimit}
        hideFilter
      />
    </div>
  );
};

export default ProveedoresPage;
