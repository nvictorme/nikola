/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IPais, ISucursal } from "shared/interfaces";
import { ApiClient } from "../api/api.client";

export type SucursalesStore = {
  sucursales: ISucursal[];
  sucursal: ISucursal | null;
  crearSucursal: (sucursal: ISucursal) => Promise<void>;
  listarSucursales: () => Promise<void>;
  listarSucursalesPorPais: (pais: IPais) => Promise<void>;
  listarTodasLasSucursales: () => Promise<void>;
  actualizarSucursal: (sucursal: ISucursal) => Promise<void>;
  openSheet: boolean;
  showSheet: () => void;
  hideSheet: () => void;
  page: number;
  total: number;
  limit: number;
  pageCount: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  pais: IPais | null;
  setPais: (pais: IPais | null) => void;
  obtenerSucursal: (id: string) => Promise<void>;
  eliminarSucursal: (id: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

const initialState: Pick<
  SucursalesStore,
  | "sucursales"
  | "sucursal"
  | "openSheet"
  | "page"
  | "total"
  | "limit"
  | "pageCount"
  | "pais"
  | "isLoading"
  | "error"
> = {
  sucursales: [],
  sucursal: null,
  openSheet: false,
  page: 1,
  total: 0,
  limit: 10,
  pageCount: 1,
  pais: null,
  isLoading: false,
  error: null,
};

export const useSucursalesStore = create<SucursalesStore>()(
  persist(
    (set, get): SucursalesStore => ({
      ...initialState,
      crearSucursal: async (sucursal) => {
        try {
          set({ isLoading: true, error: null });
          await new ApiClient().post("/sucursales", {
            sucursal: {
              ...sucursal,
            },
          });
          set({ isLoading: false });
          await get().listarSucursales();
        } catch (error: any) {
          set({
            error: error.response?.data?.error || "Error al crear la sucursal",
            isLoading: false,
          });
        }
      },
      listarSucursalesPorPais: async (pais: IPais) => {
        try {
          const { data } = await new ApiClient().get(
            `/sucursales/pais/${pais.id}`,
            {}
          );
          set({ sucursales: data.sucursales });
        } catch (error) {
          console.error(error);
        }
      },
      listarSucursales: async () => {
        try {
          const { data } = await new ApiClient().get("/sucursales", {
            ...(get().pais && { pais: get().pais?.id }),
            page: Number(get().page),
            limit: Number(get().limit),
          });
          set({ ...data });
        } catch (error) {
          console.error(error);
        }
      },
      listarTodasLasSucursales: async () => {
        try {
          const { data } = await new ApiClient().get("/sucursales/todas", {});
          set({ sucursales: data.sucursales });
        } catch (error) {
          console.error(error);
        }
      },
      actualizarSucursal: async (sucursal: ISucursal) => {
        try {
          set({ isLoading: true, error: null });
          await new ApiClient().put(`/sucursales/${sucursal.id}`, {
            sucursal: {
              ...sucursal,
            },
          });
          set({ isLoading: false });
          await get().listarSucursales();
        } catch (error: any) {
          set({
            error:
              error.response?.data?.error || "Error al actualizar la sucursal",
            isLoading: false,
          });
        }
      },
      showSheet: () => set({ openSheet: true }),
      hideSheet: () => set({ openSheet: false }),
      setPage: (page: number) => {
        set({ page });
        get().listarSucursales();
      },
      setLimit: (limit: number) => {
        set({ limit });
        get().listarSucursales();
      },
      setPais: (pais) => {
        set({ pais, page: 1 });
        get().listarSucursales();
      },
      obtenerSucursal: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await new ApiClient().get(`/sucursales/${id}`, {});
          set({ sucursal: data.sucursal, isLoading: false });
        } catch (error: any) {
          set({
            error:
              error.response?.data?.error || "Error al obtener la sucursal",
            isLoading: false,
          });
        }
      },
      eliminarSucursal: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          await new ApiClient().delete(`/sucursales/${id}`, {});
          set({ isLoading: false });
          await get().listarSucursales();
        } catch (error: any) {
          set({
            error:
              error.response?.data?.error || "Error al eliminar la sucursal",
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "sucursales-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
