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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Plus, Search, Filter, RefreshCw } from "lucide-react";
import { EstatusMovimiento } from "shared/enums";
import { useDebounce } from "@/hooks/useDebounce";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MovimientoForm } from "./MovimientoForm";
import { IMovimiento } from "shared/interfaces";

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
    clearFilters,
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
    filters.estatus || "todos"
  );
  const [showForm, setShowForm] = useState(false);
  const [selectedMovimiento, setSelectedMovimiento] = useState<string | null>(
    null
  );
  const [actionType, setActionType] = useState<"status" | "delete" | null>(
    null
  );
  const [newStatus, setNewStatus] = useState<EstatusMovimiento | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    getMovimientos();
  }, [getMovimientos]);

  useEffect(() => {
    if (debouncedSearchTerm !== filters.term) {
      setFilters({ term: debouncedSearchTerm });
      const filterEstatus = selectedEstatus === "todos" ? "" : selectedEstatus;
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
    const filterEstatus = estatus === "todos" ? "" : estatus;
    setFilters({ estatus: filterEstatus });
    getMovimientos({ term: searchTerm, estatus: filterEstatus });
  };

  const handleRefresh = () => {
    const filterEstatus = selectedEstatus === "todos" ? "" : selectedEstatus;
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

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Movimientos</h1>
          <p className="text-muted-foreground">
            Gestiona el movimiento de productos entre almacenes
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Movimiento
        </Button>
      </div>

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
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Filtra los movimientos por término de búsqueda y estatus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por serial, almacén, usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedEstatus} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estatus</SelectItem>
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
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Limpiar
            </Button>
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
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos</CardTitle>
          <CardDescription>
            Lista de todos los movimientos de productos entre almacenes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columnasMovimientos}
            data={movimientos as IMovimiento[]}
            loading={loading}
            page={page}
            pageCount={pageCount}
            setPage={setPage}
            setLimit={setLimit}
            limit={limit}
          />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      {showForm && (
        <MovimientoForm
          open={showForm}
          onOpenChange={setShowForm}
          onSuccess={() => {
            setShowForm(false);
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
            handleStatusUpdate(selectedMovimiento, newStatus);
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
            handleDelete(selectedMovimiento);
            setActionType(null);
            setSelectedMovimiento(null);
          }
        }}
        // variant="destructive"
      />
    </div>
  );
}
