import { DataTable } from "@/components/DataTable";
import { usePersonasStore } from "@/store/personas.store";
import { useCallback, useEffect } from "react";
import { columnasPersonas, Persona } from "./columnas.personas";
import CreateButton from "@/components/CreateButton";
import PersonaForm from "./PersonaForm";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PersonasPage: React.FC = () => {
  const {
    personas,
    listarPersonas,
    setPersona,
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
  } = usePersonasStore();

  useEffect(() => {
    listarPersonas({});
  }, [listarPersonas]);

  const onOpenSheet = useCallback(() => {
    setPersona(null);
    showSheet();
  }, [setPersona, showSheet]);

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
              placeholder="Buscar clientes por NIF, empresa, nombre, apellido o email"
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
              title="Cliente"
              buttonText="Cliente"
              open={openSheet}
              onOpenChange={(open) => {
                if (!open) hideSheet();
              }}
              onOpen={onOpenSheet}
            >
              <PersonaForm />
            </CreateButton>
          </div>
        </div>
      </header>
      <DataTable
        columns={columnasPersonas}
        data={personas as Persona[]}
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

export default PersonasPage;
