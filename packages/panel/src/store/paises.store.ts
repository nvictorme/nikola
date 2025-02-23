import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IPais } from "shared/interfaces";
import { ApiClient } from "../api/api.client";

export type PaisesStore = {
  paises: IPais[];
  pais: IPais | null;
  listarPaises: () => Promise<void>;
  listarTodosLosPaises: () => Promise<void>;
  crearPais: (pais: IPais) => Promise<void>;
  actualizarPais: (pais: IPais) => Promise<void>;
  eliminarPais: (id: string) => Promise<void>;
  setPais: (pais: IPais | null) => void;
  page: number;
  total: number;
  limit: number;
  pageCount: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  isLoading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
};

const initialState: Pick<
  PaisesStore,
  | "paises"
  | "pais"
  | "page"
  | "limit"
  | "pageCount"
  | "total"
  | "isLoading"
  | "error"
> = {
  paises: [],
  pais: null,
  page: 1,
  limit: 10,
  pageCount: 1,
  total: 0,
  isLoading: false,
  error: null,
};

export const usePaisesStore = create<PaisesStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      listarPaises: async () => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await new ApiClient().get("/paises", {
            page: get().page,
            limit: get().limit,
          });
          set({ ...data, isLoading: false });
        } catch (error) {
          set({ error: "Error al cargar países", isLoading: false });
        }
      },
      listarTodosLosPaises: async () => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await new ApiClient().get("/paises/todos", {});
          set({ paises: data.paises, isLoading: false });
        } catch (error) {
          set({ error: "Error al cargar países", isLoading: false });
        }
      },
      crearPais: async (pais: IPais) => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await new ApiClient().post("/paises", pais);
          set({ pais: data.pais, isLoading: false });
          await get().listarPaises();
        } catch (error) {
          set({ error: "Error al crear país", isLoading: false });
        }
      },
      actualizarPais: async (pais: IPais) => {
        try {
          set({ isLoading: true, error: null });
          const { data } = await new ApiClient().put(
            `/paises/${pais.id}`,
            pais
          );
          set({ pais: data.pais, isLoading: false });
          await get().listarPaises();
        } catch (error) {
          set({ error: "Error al actualizar país", isLoading: false });
        }
      },
      eliminarPais: async (id: string) => {
        try {
          set({ isLoading: true, error: null });
          await new ApiClient().delete(`/paises/${id}`, {});
          set({ isLoading: false });
          await get().listarPaises();
        } catch (error) {
          set({ error: "Error al eliminar país", isLoading: false });
        }
      },
      setError: (error) => set({ error }),
      setPais: (pais: IPais | null) => set({ pais }),
      setPage: (page: number) => {
        set({ page });
        get().listarPaises();
      },
      setLimit: (limit: number) => {
        set({ limit });
        get().listarPaises();
      },
    }),
    {
      name: "paises-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
