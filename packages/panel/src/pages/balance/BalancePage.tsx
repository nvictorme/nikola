import { IPersona, ITransaccion } from "shared/interfaces";
import { useAuthStore } from "@/store/auth.store";
import { isSuperAdmin } from "shared/helpers";
import TransaccionForm from "./TransaccionForm";
import { useTransaccionesStore } from "@/store/transacciones.store";
import { DataTable } from "@/components/DataTable";
import { columnasTransacciones, Transaccion } from "./columnas.transacciones";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Joyride, { CallBackProps } from "react-joyride";
import { balanceTourSteps } from "./balance.tour";
import { useSocket } from "@/providers/socket.provider";
import PersonaSelector from "../personas/PersonaSelector";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function TransactionPage() {
  const { user } = useAuthStore();
  const isAdmin = isSuperAdmin(user);

  const [persona, setPersona] = useState<IPersona | null>(null);
  const [clienteDialogOpen, setClienteDialogOpen] = useState(false);

  const {
    transacciones,
    pagosPendientes,
    reembolsosPendientes,
    balance,
    setBalance,
    totalPagos,
    totalReembolsos,
    listarTransacciones,
    isLoading,
    page,
    pageCount,
    limit,
    setPage,
    setLimit,
    reset, // Método para limpiar el estado global del store de transacciones
  } = useTransaccionesStore();

  useEffect(() => {
    if (!persona) return;
    listarTransacciones(persona.id);
    return () => {
      setPersona(null);
    };
  }, [listarTransacciones, persona, limit, page]);

  // Limpiar el cliente seleccionado y el store de transacciones al desmontar la página de Balance
  useEffect(() => {
    return () => {
      setPersona(null); // Limpia el cliente seleccionado
      reset(); // Limpia el estado global del store (balance, pagos, reembolsos, transacciones, etc.)
    };
  }, [reset]);

  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    // You might want to check if it's the user's first visit
    const hasSeenTour = localStorage.getItem("balance-tour-completed");
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, []);

  // realtime updates when a new transaccion is created
  const socket = useSocket();
  useEffect(() => {
    socket?.on(
      "nuevaTransaccion",
      (data: { balance: number; transaccion: ITransaccion }) => {
        setBalance(data.balance);
        listarTransacciones(data.transaccion.persona.id);
      }
    );
    return () => {
      socket?.off("nuevaTransaccion");
    };
  }, [socket, setBalance, listarTransacciones]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === "finished" || status === "skipped") {
      setRunTour(false);
      localStorage.setItem("balance-tour-completed", "true");
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Joyride
        steps={balanceTourSteps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        disableScrolling={false}
        scrollToFirstStep
        spotlightClicks
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: "#3b82f6",
            zIndex: 9999,
            arrowColor: "#fff",
            backgroundColor: "#fff",
            overlayColor: "rgba(0, 0, 0, 0.5)",
            textColor: "#333",
          },
          spotlight: {
            backgroundColor: "transparent",
          },
          tooltip: {
            padding: 16,
            borderRadius: 8,
          },
        }}
      />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 balance-page-title">
          Balance y Transacciones
        </h1>
        {user && isAdmin && (
          <div className="flex items-center gap-3 distribuidor-selector">
            <label className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {persona ? "Cliente:" : "Seleccionar Cliente:"}
            </label>
            <Dialog
              open={clienteDialogOpen}
              onOpenChange={setClienteDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="secondary" type="button">
                  {persona
                    ? `${persona.nif} - ${
                        persona.empresa ||
                        `${persona.nombre} ${persona.apellido}`
                      }`
                    : "Seleccionar Cliente"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Seleccione el cliente</DialogTitle>
                  <DialogDescription>
                    <PersonaSelector
                      onSelect={(persona) => {
                        setPersona(persona);
                        setClienteDialogOpen(false);
                      }}
                    />
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 balance-stats">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Balance Actual
            </span>
            <span
              className={`text-3xl font-bold ${
                (balance || 0) < 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(balance || 0)
              )}
            </span>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {pagosPendientes} Pagos Pendientes
            </span>
            <span
              className={`text-3xl font-bold ${
                totalPagos > 0 ? "text-blue-600" : "text-gray-500"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(totalPagos)
              )}
            </span>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex flex-col space-y-2">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {reembolsosPendientes} Reembolsos Pendientes
            </span>
            <span
              className={`text-3xl font-bold ${
                totalReembolsos > 0 ? "text-green-600" : "text-gray-500"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                }).format(totalReembolsos)
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
        <TransaccionForm persona={persona} />
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm historial-transacciones">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Historial de Transacciones</h2>
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </div>
            )}
          </div>
        </div>
        <DataTable
          columns={columnasTransacciones}
          data={transacciones as Transaccion[]}
          page={page}
          pageCount={pageCount}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
          hideFilter
          loading={isLoading}
        />
      </div>
    </div>
  );
}
