import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ITransaccion } from "shared/interfaces";
import { ApiClient } from "../api/api.client";
import { EstatusPago } from "shared/enums";

export type TransaccionesStore = {
  transacciones: ITransaccion[];
  pagosPendientes: number;
  reembolsosPendientes: number;
  totalPagos: number;
  totalReembolsos: number;
  listarTransacciones: (usuarioId: string) => Promise<void>;
  crearTransaccion: (transaccion: ITransaccion) => Promise<void>;
  actualizarEstatus: ({
    usuarioId,
    transaccionId,
    estatusPago,
  }: {
    usuarioId: string;
    transaccionId: string;
    estatusPago: EstatusPago;
  }) => Promise<void>;
  page: number;
  total: number;
  limit: number;
  pageCount: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  balance: number;
  setBalance: (balance: number) => void;
  isLoading: boolean;
};

const initialState: Pick<
  TransaccionesStore,
  | "transacciones"
  | "total"
  | "page"
  | "limit"
  | "pageCount"
  | "pagosPendientes"
  | "totalPagos"
  | "reembolsosPendientes"
  | "totalReembolsos"
  | "balance"
  | "isLoading"
> = {
  transacciones: [],
  total: 0,
  page: 1,
  limit: 10,
  pageCount: 1,
  pagosPendientes: 0,
  totalPagos: 0,
  reembolsosPendientes: 0,
  totalReembolsos: 0,
  balance: 0,
  isLoading: false,
};

export const useTransaccionesStore = create<TransaccionesStore>()(
  persist(
    (set, get): TransaccionesStore => ({
      ...initialState,
      listarTransacciones: async (usuarioId) => {
        set({ isLoading: true });
        try {
          const { page, limit } = get();
          const { data } = await new ApiClient().get("/transacciones", {
            page,
            limit,
            usuarioId,
          });
          set({
            ...data,
          });
        } catch (error) {
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      crearTransaccion: async (transaccion) => {
        await new ApiClient().post("/transacciones", {
          transaccion,
        });
        await get().listarTransacciones(transaccion.usuario.id);
      },
      actualizarEstatus: async ({ usuarioId, transaccionId, estatusPago }) => {
        try {
          await new ApiClient().put(`/transacciones/${transaccionId}/estatus`, {
            estatusPago,
          });
          await get().listarTransacciones(usuarioId);
        } catch (e) {
          console.error(e);
        }
      },
      setPage: (page) => {
        set({ page });
      },
      setLimit: (limit) => set({ limit }),
      setBalance: (balance) => set({ balance }),
    }),
    {
      name: "transacciones-store",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
