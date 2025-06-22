/* eslint-disable react-hooks/rules-of-hooks */
import { IPersona } from "shared/interfaces";
import { ColumnDef } from "@tanstack/react-table";
import { currencyFormat } from "shared/helpers";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCallback } from "react";
import { usePersonasStore } from "@/store/personas.store";
import { EditIcon, EyeIcon, InfoIcon } from "lucide-react";

// NOTA: Si los campos 'limiteCredito', 'saldoDisponible' y 'balanceCredito' no existen en IPersona, deben agregarse o mapearse correctamente.
export type Persona = Pick<
  IPersona,
  | "nif"
  | "empresa"
  | "nombre"
  | "apellido"
  | "notas"
  | "tipoCliente"
  | "creditoHabilitado"
  | "creditoLimite"
  | "balance"
> & {
  limiteCredito?: number | string;
  saldoDisponible?: number | string;
  balanceCredito?: number | string;
};

export const columnasPersonas: ColumnDef<Persona>[] = [
  // Header centrado para 'Cédula'
  {
    accessorKey: "nif",
    header: () => (
      <span
        style={{ display: "inline-block", width: "100%", textAlign: "center" }}
      >
        Cédula
      </span>
    ),
  },
  // Header centrado para 'Nombre'
  {
    accessorKey: "nombre",
    header: () => (
      <span
        style={{ display: "inline-block", width: "100%", textAlign: "center" }}
      >
        Nombre
      </span>
    ),
  },
  // Header centrado para 'Apellido'
  {
    accessorKey: "apellido",
    header: () => (
      <span
        style={{ display: "inline-block", width: "100%", textAlign: "center" }}
      >
        Apellido
      </span>
    ),
  },
  // Header centrado para 'Empresa'
  {
    accessorKey: "empresa",
    header: () => (
      <span
        style={{ display: "inline-block", width: "100%", textAlign: "center" }}
      >
        Empresa
      </span>
    ),
  },
  // Header centrado y en dos líneas para 'Tipo de Cliente'
  {
    accessorKey: "tipoCliente",
    header: () => (
      <span
        style={{ display: "inline-block", width: "100%", textAlign: "center" }}
      >
        Tipo de
        <br />
        Cliente
      </span>
    ),
  },
  // Header centrado y en dos líneas para 'Crédito habilitado'
  {
    accessorKey: "creditoHabilitado",
    header: () => (
      <span
        style={{ display: "inline-block", width: "100%", textAlign: "center" }}
      >
        Crédito
        <br />
        habilitado
      </span>
    ),
    cell: ({ row }) => {
      // Si no tiene crédito habilitado, mostrar "No"
      if (!row.original.creditoHabilitado) return "No";
      // Tomar los valores de límite, balance y calcular disponible
      const limite = row.original.creditoLimite;
      const balance = row.original.balance;
      const disponible = limite - balance;
      // Renderiza el valor "Sí" y el popover con la información de crédito
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontWeight: "bold", color: "#15803d" }}>Sí</span>
          <Popover>
            <PopoverTrigger>
              <InfoIcon
                size={15}
                className="text-blue-500 cursor-pointer ml-1"
              />
            </PopoverTrigger>
            <PopoverContent>
              {/* Popover con la información de crédito en 3 líneas centradas */}
              <div className="p-2 min-w-[140px]">
                <div
                  className={`px-2 py-1 rounded-md flex justify-center ${
                    disponible > 0
                      ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                      : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                  }`}
                >
                  <span
                    style={{
                      fontSize: "1em",
                      fontWeight: 400,
                      textAlign: "center",
                      width: "100%",
                    }}
                  >
                    <b>Crédito disponible:</b>{" "}
                    {currencyFormat({ value: disponible })}
                  </span>
                </div>
                <div className="flex flex-col items-center gap-1 text-gray-500 dark:text-gray-400 mt-2">
                  <div style={{ fontSize: "0.95em", textAlign: "center" }}>
                    <b>Límite:</b> {currencyFormat({ value: limite })}
                  </div>
                  <div style={{ fontSize: "0.95em", textAlign: "center" }}>
                    <b>Balance:</b> {currencyFormat({ value: balance })}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </span>
      );
    },
  },
  // Header centrado para 'Notas'
  {
    accessorKey: "notas",
    header: () => (
      <span
        style={{ display: "inline-block", width: "100%", textAlign: "center" }}
      >
        Notas
      </span>
    ),
    cell: ({ row }) => {
      const notas = row.original.notas;
      if (!notas) return null;
      return (
        <Popover>
          <PopoverTrigger>
            <EyeIcon size={16} className="text-blue-500" />
          </PopoverTrigger>
          <PopoverContent>
            <div className="p-4">{notas}</div>
          </PopoverContent>
        </Popover>
      );
    },
  },
  {
    id: "acciones",
    header: "",
    cell: ({ row }) => {
      const persona = row.original as IPersona;
      const { showSheet, setPersona } = usePersonasStore();
      const onEdit = useCallback(() => {
        setPersona(persona);
        showSheet();
      }, [persona, setPersona, showSheet]);
      return (
        <div className="flex gap-2">
          <button className="text-blue-500" onClick={onEdit}>
            <EditIcon size={16} />
          </button>
        </div>
      );
    },
  },
];
