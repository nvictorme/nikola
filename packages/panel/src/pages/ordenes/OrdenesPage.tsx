import { DataTable } from "@/components/DataTable";
import { useOrdenesStore } from "@/store/ordenes.store";
import { columnasOrdenes, Orden } from "./columnas.ordenes";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EstatusOrden, TipoOrden } from "shared/enums";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircleIcon } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { canCreateOrders, getEstatusColor, isSuperAdmin } from "shared/helpers";
import { Label } from "@/components/ui/label";
import OrdenForm from "./OrdenForm";
import { useEffect } from "react";
import { useProductosStore } from "@/store/productos.store";
import { usePersonasStore } from "@/store/personas.store";
import { useSucursalesStore } from "@/store/sucursales.store";
import { useSocket } from "@/providers/socket.provider";
import { IOrden } from "shared/interfaces";
import { useConfiguracionStore } from "@/store/configuracion.store";

const OrdenesPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);
  const canCreate = canCreateOrders(user);

  const {
    ordenes,
    orden,
    listarOrdenes,
    setOrden,
    page,
    pageCount,
    limit,
    term,
    tipo,
    estatus,
    setPage,
    setLimit,
    setTerm,
    setTipo,
    setEstatus,
    showForm,
    setShowForm,
    loading,
    reemplazarOrden,
    removerOrden,
  } = useOrdenesStore();

  const { listarProductos } = useProductosStore();
  const { listarPersonas } = usePersonasStore();
  const { listarSucursales } = useSucursalesStore();

  const { fetchFactores } = useConfiguracionStore();

  useEffect(() => {
    fetchFactores();
  }, [fetchFactores]);

  useEffect(() => {
    listarOrdenes();
    listarProductos();
    listarSucursales();
    listarPersonas();
    return () => {
      setShowForm(false);
    };
  }, [
    listarOrdenes,
    listarProductos,
    listarSucursales,
    listarPersonas,
    user,
    isAdmin,
    setShowForm,
  ]);

  const socket = useSocket();

  useEffect(() => {
    socket?.on("ordenActualizada", (data: { orden: IOrden }) => {
      reemplazarOrden(data.orden);
    });
    socket?.on("ordenEliminada", (data: { orden: IOrden }) => {
      removerOrden(data.orden);
    });
    if (isAdmin) {
      socket?.on("nuevaOrden", (data: { orden: IOrden }) => {
        reemplazarOrden(data.orden);
      });
    }
    return () => {
      socket?.off("ordenActualizada");
      if (isAdmin) {
        socket?.off("nuevaOrden");
        socket?.off("ordenEliminada");
      }
    };
  }, [socket, reemplazarOrden, removerOrden, isAdmin]);

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
              Buscar
            </Label>
            <Input
              id="search"
              placeholder="Buscar ordenes por serial, cliente (nif, empresa, nombre, apellido) o producto (nombre, SKU)"
              defaultValue={term}
              onChange={(e) => {
                const value = e.target.value ?? "";
                setTerm(value.trim());
              }}
              disabled={showForm}
            />
          </div>
          <div className="w-[180px]">
            <Label htmlFor="tipo" className="text-left block mb-2">
              Tipo
            </Label>
            <Select
              disabled={showForm}
              defaultValue={tipo ?? "Todos"}
              onValueChange={(value) => {
                if (value === "Todos") return setTipo(null);
                setTipo(value as TipoOrden);
              }}
            >
              <SelectTrigger id="tipo">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value={TipoOrden.cotizacion}>
                  {TipoOrden.cotizacion}
                </SelectItem>
                <SelectItem value={TipoOrden.venta}>
                  {TipoOrden.venta}
                </SelectItem>
                <SelectItem value={TipoOrden.credito}>
                  {TipoOrden.credito}
                </SelectItem>
                <SelectItem value={TipoOrden.reposicion}>
                  {TipoOrden.reposicion}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-[180px]">
            <Label htmlFor="estatus" className="text-left block mb-2">
              Estatus
            </Label>
            <Select
              disabled={showForm}
              defaultValue={estatus ?? "Todos"}
              onValueChange={(value) => {
                if (value === "Todos") return setEstatus(null);
                setEstatus(value as EstatusOrden);
              }}
            >
              <SelectTrigger
                id="estatus"
                className={getEstatusColor(estatus as EstatusOrden)}
              >
                <SelectValue placeholder="Estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {Object.values(EstatusOrden).map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {canCreate ? (
            <Button
              disabled={showForm}
              onClick={() => {
                setOrden(null);
                setShowForm(true);
              }}
              className="gap-2"
            >
              <PlusCircleIcon size={16} /> Orden
            </Button>
          ) : null}
        </div>
      </header>
      {showForm ? (
        <OrdenForm orden={orden} onCloseForm={() => setShowForm(false)} />
      ) : (
        <DataTable
          columns={columnasOrdenes}
          data={ordenes as Orden[]}
          page={page}
          pageCount={pageCount}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
          hideFilter
        />
      )}
      {/* Widget de cotización flotante, solo visible una franja de 35px pegada al borde inferior. Al hacer hover se expande. */}
      <div className="fixed bottom-0 left-4 z-50" style={{ width: 300 }}>
        <div
          className="group w-full transition-all duration-300 ease-in-out overflow-hidden rounded-t-lg shadow border border-gray-200 bg-white"
          style={{ height: "35px" }} // Altura inicial visible
          // Al hacer hover, expande el widget; al salir, lo colapsa
          onMouseEnter={(e) => (e.currentTarget.style.height = "263px")}
          onMouseLeave={(e) => (e.currentTarget.style.height = "35px")}
        >
          {/* Iframe de elcamb.io, siempre ocupa 263px pero solo se muestra completo al expandirse */}
          <iframe
            src="https://elcamb.io/?embed=true"
            className="w-full h-[263px] rounded-lg border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ pointerEvents: "auto" }}
          />
        </div>
      </div>
    </div>
  );
};

export default OrdenesPage;
