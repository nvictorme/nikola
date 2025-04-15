import { DataTable } from "@/components/DataTable";
import { useAuditoriaStore } from "@/store/auditoria.store";
import { columnasAuditoria } from "./columnas.auditoria";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { isSuperAdmin } from "shared/helpers";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useRef } from "react";

const AuditoriaPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);

  // Add refs for the input elements
  const entityIdInputRef = useRef<HTMLInputElement>(null);
  const userIdInputRef = useRef<HTMLInputElement>(null);

  // Add state for select values to handle resets
  const [entitySelectValue, setEntitySelectValue] = useState<string>("Todos");
  const [actionSelectValue, setActionSelectValue] = useState<string>("Todos");

  const {
    logs,
    listarAuditLogs,
    page,
    pageCount,
    limit,
    entityId,
    userId,
    setPage,
    setLimit,
    setEntity,
    setAction,
    setEntityId,
    setUserId,
    loading,
  } = useAuditoriaStore();

  useEffect(() => {
    listarAuditLogs();
  }, [listarAuditLogs]);

  // Reset all filters
  const handleResetFilters = () => {
    // Reset state in the store
    setEntity(null);
    setAction(null);
    setEntityId(null);
    setUserId(null);

    // Reset UI components
    setEntitySelectValue("Todos");
    setActionSelectValue("Todos");

    // Clear input fields
    if (entityIdInputRef.current) {
      entityIdInputRef.current.value = "";
    }

    if (userIdInputRef.current) {
      userIdInputRef.current.value = "";
    }

    // Fetch data with cleared filters
    listarAuditLogs();
  };

  return (
    <div className="container mx-auto space-y-4">
      {loading ? (
        <div className="fixed inset-0 bg-background/5 backdrop-blur-sm flex flex-col gap-2 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-lg">Cargando...</p>
        </div>
      ) : null}
      <header className="sticky top-16 z-50 flex flex-col gap-4 border-b bg-background py-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="search" className="text-left block mb-2">
              ID de Entidad
            </Label>
            <Input
              id="search"
              ref={entityIdInputRef}
              placeholder="Buscar por ID de entidad"
              defaultValue={entityId || ""}
              onChange={(e) => {
                const value = e.target.value ?? "";
                setEntityId(value.trim() || null);
              }}
            />
          </div>
          <div className="w-[180px]">
            <Label htmlFor="entity" className="text-left block mb-2">
              Entidad
            </Label>
            <Select
              value={entitySelectValue}
              onValueChange={(value) => {
                setEntitySelectValue(value);
                if (value === "Todos") return setEntity(null);
                setEntity(value);
              }}
            >
              <SelectTrigger id="entity">
                <SelectValue placeholder="Entidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Precio">Precio</SelectItem>
                <SelectItem value="Orden">Orden</SelectItem>
                <SelectItem value="Producto">Producto</SelectItem>
                <SelectItem value="Usuario">Usuario</SelectItem>
                <SelectItem value="Persona">Persona</SelectItem>
                <SelectItem value="Proveedor">Proveedor</SelectItem>
                <SelectItem value="Sucursal">Sucursal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[180px]">
            <Label htmlFor="action" className="text-left block mb-2">
              Acción
            </Label>
            <Select
              value={actionSelectValue}
              onValueChange={(value) => {
                setActionSelectValue(value);
                if (value === "Todos") return setAction(null);
                setAction(value);
              }}
            >
              <SelectTrigger id="action">
                <SelectValue placeholder="Acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="INSERT">Crear</SelectItem>
                <SelectItem value="UPDATE">Actualizar</SelectItem>
                <SelectItem value="DELETE">Eliminar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isAdmin && (
            <div className="w-[180px]">
              <Label htmlFor="userId" className="text-left block mb-2">
                Usuario
              </Label>
              <Input
                id="userId"
                ref={userIdInputRef}
                placeholder="ID de Usuario"
                defaultValue={userId || ""}
                onChange={(e) => {
                  const value = e.target.value ?? "";
                  setUserId(value.trim() || null);
                }}
              />
            </div>
          )}
          <Button variant="outline" onClick={handleResetFilters}>
            Limpiar Filtros
          </Button>
        </div>
      </header>
      <DataTable
        columns={columnasAuditoria}
        data={logs}
        page={page}
        pageCount={pageCount}
        limit={limit}
        setPage={setPage}
        setLimit={setLimit}
        hideFilter
      />
    </div>
  );
};

export default AuditoriaPage;
