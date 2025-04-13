import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IProveedor } from "shared/interfaces";
import { ApiClient } from "../api/api.client";

export type ProveedoresStore = {
  proveedores: IProveedor[];
  proveedor: IProveedor | null;
  crearProveedor: (proveedor: IProveedor) => Promise<void>;
  listarProveedores: () => Promise<void>;
  listarTodosLosProveedores: () => Promise<void>;
  actualizarProveedor: (proveedor: IProveedor) => Promise<void>;
  eliminarProveedor: (id: string) => Promise<void>;
  setProveedor: (proveedor: IProveedor | null) => void;
  openSheet: boolean;
  showSheet: () => void;
  hideSheet: () => void;
  page: number;
  total: number;
  limit: number;
  pageCount: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  term: string;
  setTerm: (term: string) => void;
};

const initialState: Pick<
  ProveedoresStore,
  | "proveedores"
  | "proveedor"
  | "openSheet"
  | "total"
  | "page"
  | "limit"
  | "pageCount"
  | "term"
> = {
  proveedores: [],
  proveedor: null,
  openSheet: false,
  total: 0,
  page: 1,
  limit: 10,
  pageCount: 1,
  term: "",
};

export const useProveedoresStore = create<ProveedoresStore>()(
  persist(
    (set, get): ProveedoresStore => ({
      ...initialState,
      crearProveedor: async (proveedor) => {
        try {
          await new ApiClient().post(`/proveedores`, { proveedor });
          await get().listarProveedores();
        } catch (error) {
          console.error(error);
        }
      },
      listarProveedores: async () => {
        try {
          const { data } = await new ApiClient().get(`/proveedores`, {
            page: get().page,
            limit: get().limit,
            term: get().term,
          });
          set({ ...data });
        } catch (error) {
          console.error(error);
        }
      },
      listarTodosLosProveedores: async () => {
        try {
          const { data } = await new ApiClient().get(`/proveedores/todos`, {});
          set({ proveedores: data.proveedores });
        } catch (error) {
          console.error(error);
        }
      },
      actualizarProveedor: async (proveedor: IProveedor) => {
        try {
          await new ApiClient().put(`/proveedores/${proveedor.id}`, {
            proveedor,
          });
          await get().listarProveedores();
        } catch (error) {
          console.error(error);
        }
      },
      eliminarProveedor: async (id: string) => {
        try {
          await new ApiClient().delete(`/proveedores/${id}`, {});
          await get().listarProveedores();
        } catch (error) {
          console.error(error);
        }
      },
      setProveedor: (proveedor) => set({ proveedor }),
      showSheet: () => set({ openSheet: true }),
      hideSheet: () => set({ openSheet: false }),
      setPage: (page) => {
        set({ page });
        get().listarProveedores();
      },
      setLimit: (limit) => {
        set({ limit });
        get().listarProveedores();
      },
      setTerm: (term: string) => {
        set({ term });
        get().listarProveedores();
      },
    }),
    {
      name: "proveedores-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
