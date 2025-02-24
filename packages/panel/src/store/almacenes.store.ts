import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IAlmacen } from "shared/interfaces";
import { ApiClient } from "../api/api.client";

export type AlmacenesStore = {
  almacenes: IAlmacen[];
  almacen: IAlmacen | null;
  crearAlmacen: (almacen: IAlmacen) => Promise<void>;
  listarAlmacenes: () => Promise<void>;
  actualizarAlmacen: (almacen: IAlmacen) => Promise<void>;
  eliminarAlmacen: (id: string) => Promise<void>;
  openSheet: boolean;
  showSheet: () => void;
  hideSheet: () => void;
  loading: boolean;
  page: number;
  total: number;
  limit: number;
  pageCount: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  listarAlmacenesPorProducto: (productoId: string) => Promise<IAlmacen[]>;
  listarAlmacenesPorSucursal: (
    sucursalId: string,
    productoId: string
  ) => Promise<IAlmacen[]>;
};

const initialState: Pick<
  AlmacenesStore,
  | "almacenes"
  | "almacen"
  | "openSheet"
  | "total"
  | "page"
  | "limit"
  | "pageCount"
  | "loading"
> = {
  loading: false,
  almacenes: [],
  almacen: null,
  openSheet: false,
  total: 0,
  page: 1,
  limit: 10,
  pageCount: 1,
};

export const useAlmacenesStore = create<AlmacenesStore>()(
  persist(
    (set, get): AlmacenesStore => ({
      ...initialState,
      crearAlmacen: async (almacen) => {
        try {
          set({ loading: true });
          await new ApiClient().post("/almacenes", { almacen });
          await get().listarAlmacenes();
        } catch (error) {
          console.error(error);
        } finally {
          set({ loading: false });
        }
      },
      listarAlmacenes: async () => {
        try {
          set({ loading: true });
          const { data } = await new ApiClient().get("/almacenes", {
            page: get().page,
            limit: get().limit,
          });
          set({ ...data });
        } catch (error) {
          console.error(error);
        } finally {
          set({ loading: false });
        }
      },
      actualizarAlmacen: async (almacen: IAlmacen) => {
        try {
          set({ loading: true });
          await new ApiClient().put(`/almacenes/${almacen.id}`, {
            almacen,
          });
          await get().listarAlmacenes();
        } catch (error) {
          console.error(error);
        } finally {
          set({ loading: false });
        }
      },
      showSheet: () => set({ openSheet: true }),
      hideSheet: () => set({ openSheet: false }),
      setPage: (page: number) => {
        set({ page });
        get().listarAlmacenes();
      },
      setLimit: (limit: number) => {
        set({ limit });
        get().listarAlmacenes();
      },
      eliminarAlmacen: async (id: string) => {
        try {
          set({ loading: true });
          await new ApiClient().delete(`/almacenes/${id}`, {});
          await get().listarAlmacenes();
        } catch (error) {
          console.error(error);
        } finally {
          set({ loading: false });
        }
      },
      listarAlmacenesPorProducto: async (productoId: string) => {
        try {
          set({ loading: true });
          const { data } = await new ApiClient().get(
            `/almacenes/producto/${productoId}`,
            {}
          );
          return data.almacenes;
        } catch (error) {
          console.error(error);
          return [];
        } finally {
          set({ loading: false });
        }
      },
      listarAlmacenesPorSucursal: async (
        sucursalId: string,
        productoId: string
      ) => {
        try {
          set({ loading: true });
          const { data } = await new ApiClient().get(
            `/almacenes/sucursal/${sucursalId}/producto/${productoId}`,
            {}
          );
          return data.almacenes;
        } catch (error) {
          console.error(error);
          return [];
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "almacenes-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
