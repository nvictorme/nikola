/* eslint-disable react-hooks/rules-of-hooks */
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { EyeIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";

export interface IAuditLog {
  id: string;
  entity: string;
  entityId: string | null;
  action: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
  };
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  timestamp: string;
}

export type AuditLog = IAuditLog;

// Utility function to format changes for display
const formatChanges = (
  oldValue: Record<string, unknown> | null | undefined,
  newValue: Record<string, unknown> | null | undefined
) => {
  if (!oldValue && !newValue) return null;

  // Create a set of all keys from both objects
  const allKeys = new Set<string>();
  if (oldValue) {
    Object.keys(oldValue).forEach((key) => allKeys.add(key));
  }
  if (newValue) {
    Object.keys(newValue).forEach((key) => allKeys.add(key));
  }

  // Format object nicely for display
  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "object") {
      return (
        <pre className="whitespace-pre-wrap font-mono">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return String(value);
  };

  return Array.from(allKeys).map((key) => {
    const oldVal = oldValue?.[key];
    const newVal = newValue?.[key];
    const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

    return (
      <div
        key={key}
        className={`mb-4 pb-2 ${hasChanged ? "border-b border-gray-200" : ""}`}
      >
        <div className="font-semibold text-sm mb-1">{key}:</div>
        {hasChanged ? (
          <div className="grid grid-cols-1 gap-2">
            <div className="text-sm">
              <div className="text-red-500 bg-red-50 p-2 rounded-md">
                <span className="text-xs font-medium text-red-700 block mb-1">
                  Valor Anterior:
                </span>
                {formatValue(oldVal)}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-green-700 bg-green-50 p-2 rounded-md">
                <span className="text-xs font-medium text-green-700 block mb-1">
                  Valor Nuevo:
                </span>
                {formatValue(newVal)}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm bg-gray-50 p-2 rounded-md">
            {formatValue(newVal)}
          </div>
        )}
      </div>
    );
  });
};

export const columnasAuditoria: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const id = row.original.id;
      if (!id) return <span className="text-gray-500">-</span>;

      return (
        <span className="text-xs text-muted-foreground">
          {id.substring(0, 8)}
        </span>
      );
    },
  },
  {
    accessorKey: "timestamp",
    header: "Fecha y Hora",
    cell: ({ row }) => {
      const timestamp = row.original.timestamp;
      if (!timestamp) return <span className="text-gray-500">-</span>;

      const fecha = new Date(timestamp);
      return (
        <span>
          {fecha.toLocaleDateString()} {fecha.toLocaleTimeString()}
        </span>
      );
    },
  },
  {
    accessorKey: "entity",
    header: "Entidad",
    cell: ({ row }) => {
      return <span>{row.original.entity || "-"}</span>;
    },
  },
  {
    accessorKey: "entityId",
    header: "ID Entidad",
    cell: ({ row }) => {
      const entityId = row.original.entityId;
      if (!entityId) return <span className="text-gray-500">-</span>;

      return <span className="text-xs">{entityId.substring(0, 8)}...</span>;
    },
  },
  {
    accessorKey: "action",
    header: "Acción",
    cell: ({ row }) => {
      const action = row.original.action;
      if (!action) return <span className="text-gray-500">-</span>;

      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            action === "CREATE" || action === "crear"
              ? "bg-green-100 text-green-800"
              : action === "UPDATE" || action === "actualizar"
              ? "bg-blue-100 text-blue-800"
              : action === "DELETE" || action === "eliminar"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {action}
        </span>
      );
    },
  },
  {
    accessorKey: "user",
    header: "Usuario",
    cell: ({ row }) => {
      const user = row.original.user;
      if (!user) return <span className="text-gray-500">-</span>;

      return <span>{user.nombre + " " + user.apellido || "Anónimo"}</span>;
    },
  },
  {
    accessorKey: "changes",
    header: "Cambios",
    cell: ({ row }) => {
      const [open, setOpen] = useState(false);
      const oldValue = row.original.oldValue;
      const newValue = row.original.newValue;

      return (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <EyeIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[750px] lg:max-w-[900px]">
            <DialogHeader>
              <DialogTitle>Detalles del Cambio</DialogTitle>
            </DialogHeader>
            <ScrollArea className="mt-2 max-h-[60vh] rounded-md border p-4">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-sm font-medium">Entidad:</span>
                    <span className="ml-2">{row.original.entity}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">ID Entidad:</span>
                    <span className="ml-2">
                      {row.original.entityId || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Acción:</span>
                    <span className="ml-2">{row.original.action}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Usuario:</span>
                    <span className="ml-2">
                      {row.original.user?.nombre +
                        " " +
                        row.original.user?.apellido || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium">Fecha:</span>
                    <span className="ml-2">
                      {new Date(row.original.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Cambios:</h3>
                  <div className="bg-slate-50 p-4 rounded-md text-xs overflow-auto max-h-[400px]">
                    {oldValue || newValue ? (
                      formatChanges(oldValue, newValue)
                    ) : (
                      <span className="text-gray-500">
                        No hay cambios registrados
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      );
    },
  },
];
