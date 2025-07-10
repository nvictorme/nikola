import { useEffect, useState } from "react";
import { useMovimientosStore } from "@/store/movimientos.store";
import { DataTable } from "@/components/DataTable";
import { columnasMovimientos } from "./columnas.movimientos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { Search, RefreshCw, PlusCircleIcon } from "lucide-react";
import { EstatusMovimiento } from "shared/enums";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MovimientoForm } from "./MovimientoForm";
import { IMovimiento } from "shared/interfaces";
import { getEstatusMovimientoColor } from "shared/helpers";
import { MovimientoPreview } from "./MovimientoPreview";

export default function MovimientosPage() {
  const {
    movimientos,
    loading,
    error,
    total,
    page,
    pageCount,
    filters,
    getMovimientos,
    setFilters,
    updateMovimientoStatus,
    deleteMovimiento,
    clearError,
    setPage,
    setLimit,
    limit,
  } = useMovimientosStore();

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState(filters.term);
  const [selectedEstatus, setSelectedEstatus] = useState(
    filters.estatus || "Todos"
  );
  const [showForm, setShowForm] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] =
    useState<IMovimiento | null>(null);
  const [actionType, setActionType] = useState<"status" | "delete" | null>(
    null
  );
  const [newStatus, setNewStatus] = useState<EstatusMovimiento | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMovimiento, setPreviewMovimiento] =
    useState<IMovimiento | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    getMovimientos();
  }, [getMovimientos]);

  useEffect(() => {
    if (debouncedSearchTerm !== filters.term) {
      setFilters({ term: debouncedSearchTerm });
      const filterEstatus = selectedEstatus === "Todos" ? "" : selectedEstatus;
      getMovimientos({ term: debouncedSearchTerm, estatus: filterEstatus });
    }
  }, [
    debouncedSearchTerm,
    filters.term,
    selectedEstatus,
    setFilters,
    getMovimientos,
  ]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const handleStatusChange = (estatus: string) => {
    setSelectedEstatus(estatus);
    const filterEstatus = estatus === "Todos" ? "" : estatus;
    setFilters({ estatus: filterEstatus });
    getMovimientos({ term: searchTerm, estatus: filterEstatus });
  };

  const handleRefresh = () => {
    const filterEstatus = selectedEstatus === "Todos" ? "" : selectedEstatus;
    getMovimientos({ term: searchTerm, estatus: filterEstatus });
  };

  const handleStatusUpdate = async (
    movimientoId: string,
    estatus: EstatusMovimiento
  ) => {
    try {
      await updateMovimientoStatus(movimientoId, estatus);
      toast({
        title: "Éxito",
        description: `Movimiento actualizado a ${estatus}`,
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estatus del movimiento",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (movimientoId: string) => {
    try {
      await deleteMovimiento(movimientoId);
      toast({
        title: "Éxito",
        description: "Movimiento eliminado correctamente",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el movimiento",
        variant: "destructive",
      });
    }
  };

  const getStatusCount = (estatus: EstatusMovimiento) => {
    return movimientos.filter((m) => m.estatus === estatus).length;
  };

  const totalItems = movimientos.reduce(
    (sum, m) =>
      sum + m.items.reduce((itemSum, item) => itemSum + item.cantidad, 0),
    0
  );

  // Handler para editar movimiento
  const handleEditMovimiento = (movimiento: IMovimiento) => {
    setSelectedMovimiento(movimiento);
    setShowForm(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      {/* Eliminar el botón Movimiento de la cabecera superior */}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Movimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getStatusCount(EstatusMovimiento.pendiente)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getStatusCount(EstatusMovimiento.transito)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {getStatusCount(EstatusMovimiento.recibido)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Unidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="w-full flex flex-col md:flex-row md:items-end md:gap-4">
            {/* Campo Buscar */}
            <div className="flex flex-col flex-1">
              <Label
                htmlFor="search-movimientos"
                className="text-left block mb-2"
              >
                Buscar
              </Label>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-movimientos"
                  placeholder="Buscar por serial, almacén, usuario..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            {/* Botones */}
            <div className="flex gap-4 md:ml-auto mt-4 md:mt-0 items-end">
              {/* Select de Estatus a la izquierda */}
              <div className="w-full md:w-[180px] flex flex-col">
                <Label
                  htmlFor="estatus-movimientos"
                  className="text-left block mb-2"
                >
                  Estatus
                </Label>
                <Select
                  value={selectedEstatus}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger
                    id="estatus-movimientos"
                    className={
                      selectedEstatus !== "Todos" && selectedEstatus
                        ? getEstatusMovimientoColor(
                            selectedEstatus as unknown as EstatusMovimiento
                          )
                        : ""
                    }
                  >
                    <SelectValue placeholder="Filtrar por estatus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos</SelectItem>
                    <SelectItem value={EstatusMovimiento.pendiente}>
                      Pendiente
                    </SelectItem>
                    <SelectItem value={EstatusMovimiento.aprobado}>
                      Aprobado
                    </SelectItem>
                    <SelectItem value={EstatusMovimiento.transito}>
                      En Tránsito
                    </SelectItem>
                    <SelectItem value={EstatusMovimiento.recibido}>
                      Recibido
                    </SelectItem>
                    <SelectItem value={EstatusMovimiento.anulado}>
                      Anulado
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Botón Actualizar */}
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Actualizar
              </Button>
              {/* Botón Movimiento al lado de Actualizar */}
              <Button
                onClick={() => {
                  setSelectedMovimiento(null); // Limpiar selección para modo creación
                  setShowForm(true);
                }}
                className="gap-2"
                disabled={showForm}
              >
                <PlusCircleIcon size={16} /> Movimiento
              </Button>
              {/* Ocultar el botón Limpiar */}
              {/* <Button variant="outline" onClick={clearFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Limpiar
              </Button> */}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <DataTable
        columns={columnasMovimientos({
          onEdit: handleEditMovimiento,
          onPreview: (movimiento: IMovimiento) => {
            setPreviewMovimiento(movimiento);
            setShowPreview(true);
          },
        })}
        data={movimientos as IMovimiento[]}
        loading={loading}
        page={page}
        pageCount={pageCount}
        setPage={setPage}
        setLimit={setLimit}
        limit={limit}
        hideFilter={true}
      />

      {/* Preview Dialog */}
      {previewMovimiento && (
        <MovimientoPreview
          movimiento={previewMovimiento}
          open={showPreview}
          onOpenChange={(open) => {
            setShowPreview(open);
            if (!open) setPreviewMovimiento(null);
          }}
        />
      )}

      {/* Form Dialog */}
      {showForm && (
        <MovimientoForm
          movimiento={selectedMovimiento}
          open={showForm}
          onOpenChange={(open) => {
            setShowForm(open);
            if (!open) setSelectedMovimiento(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setSelectedMovimiento(null);
            getMovimientos();
          }}
        />
      )}

      {/* Confirm Dialog for Status Update */}
      <ConfirmDialog
        open={actionType === "status" && selectedMovimiento !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null);
            setSelectedMovimiento(null);
            setNewStatus(null);
          }
        }}
        title="Confirmar cambio de estatus"
        description={`¿Estás seguro de que quieres cambiar el estatus del movimiento a "${newStatus}"?`}
        onConfirm={() => {
          if (selectedMovimiento && newStatus) {
            handleStatusUpdate(selectedMovimiento.id, newStatus);
            setActionType(null);
            setSelectedMovimiento(null);
            setNewStatus(null);
          }
        }}
      />

      {/* Confirm Dialog for Delete */}
      <ConfirmDialog
        open={actionType === "delete" && selectedMovimiento !== null}
        onOpenChange={(open) => {
          if (!open) {
            setActionType(null);
            setSelectedMovimiento(null);
          }
        }}
        title="Confirmar eliminación"
        description="¿Estás seguro de que quieres eliminar este movimiento? Esta acción no se puede deshacer."
        onConfirm={() => {
          if (selectedMovimiento) {
            handleDelete(selectedMovimiento.id);
            setActionType(null);
            setSelectedMovimiento(null);
          }
        }}
        // variant="destructive"
      />
    </div>
  );
}
