import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ApiClient } from "@/api/api.client";
import { IMovimiento, IAlmacen, IProducto } from "shared/interfaces";
import { EstatusMovimiento } from "shared/enums";

const apiClient = new ApiClient();

interface MovimientosState {
  movimientos: IMovimiento[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  pageCount: number;
  limit: number;
  selectedMovimiento: IMovimiento | null;
  filters: {
    term: string;
    estatus: string;
  };
}

const initialState: MovimientosState = {
  movimientos: [],
  loading: false,
  error: null,
  total: 0,
  page: 1,
  pageCount: 0,
  limit: 10,
  selectedMovimiento: null,
  filters: {
    term: "",
    estatus: "",
  },
};

export interface MovimientosStore extends MovimientosState {
  getMovimientos: (params?: {
    page?: number;
    limit?: number;
    term?: string;
    estatus?: string;
  }) => Promise<void>;
  getMovimiento: (id: string) => Promise<void>;
  setSelectedMovimiento: (movimiento: IMovimiento | null) => void;
  setFilters: (filters: Partial<MovimientosState["filters"]>) => void;
  clearFilters: () => void;
  createMovimiento: (movimiento: {
    origen: IAlmacen;
    destino: IAlmacen;
    items: {
      producto: IProducto;
      cantidad: number;
      notas: string;
    }[];
    notas?: string;
  }) => Promise<IMovimiento>;
  updateMovimiento: (
    id: string,
    movimiento: {
      origen: IAlmacen;
      destino: IAlmacen;
      items: {
        producto: IProducto;
        cantidad: number;
        notas: string;
      }[];
      notas?: string;
    }
  ) => Promise<IMovimiento>;
  updateMovimientoStatus: (
    id: string,
    estatus: EstatusMovimiento,
    notas?: string
  ) => Promise<void>;
  deleteMovimiento: (id: string) => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

export const useMovimientosStore = create<MovimientosStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Getters
      getMovimientos: async (params = {}) => {
        try {
          set({ loading: true, error: null });

          // Usa el valor actual del store si no viene en params
          const page = params.page ?? get().page;
          const limit = params.limit ?? get().limit;
          const term = params.term ?? get().filters.term;
          const estatus = params.estatus ?? get().filters.estatus;

          const queryParams = new URLSearchParams();
          if (page) queryParams.append("page", page.toString());
          if (limit) queryParams.append("limit", limit.toString());
          if (term) queryParams.append("term", term);
          if (estatus) queryParams.append("estatus", estatus);

          const response = await apiClient.get(
            `/movimientos?${queryParams.toString()}`,
            {}
          );

          set({ ...response.data, loading: false });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Error al cargar movimientos";
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      getMovimiento: async (id: string) => {
        try {
          set({ loading: true, error: null });

          const response = await apiClient.get(`/movimientos/${id}`, {});

          set({
            selectedMovimiento: response.data,
            loading: false,
          });
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Error al cargar movimiento";
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      // Setters
      setSelectedMovimiento: (movimiento: IMovimiento | null) => {
        set({ selectedMovimiento: movimiento });
      },

      setFilters: (filters: Partial<MovimientosState["filters"]>) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      clearFilters: () => {
        set({
          filters: {
            term: "",
            estatus: "",
          },
        });
      },

      // CRUD Operations
      createMovimiento: async (movimientoData: {
        origen: IAlmacen;
        destino: IAlmacen;
        items: {
          producto: IProducto;
          cantidad: number;
          notas: string;
        }[];
        notas?: string;
      }) => {
        try {
          set({ loading: true, error: null });

          const response = await apiClient.post("/movimientos", {
            movimiento: movimientoData,
          });

          const newMovimiento = response.data.movimiento;

          set((state) => ({
            movimientos: [newMovimiento, ...state.movimientos],
            loading: false,
          }));

          return newMovimiento;
        } catch (error: unknown) {
          let errorMessage = "Error al crear movimiento";
          if (error instanceof Error) errorMessage = error.message;
          set({
            error: errorMessage,
            loading: false,
          });
          throw new Error(errorMessage);
        }
      },

      updateMovimiento: async (
        id: string,
        movimientoData: {
          origen: IAlmacen;
          destino: IAlmacen;
          items: {
            producto: IProducto;
            cantidad: number;
            notas: string;
          }[];
          notas?: string;
        }
      ) => {
        try {
          set({ loading: true, error: null });
          const response = await apiClient.put(`/movimientos/${id}`, {
            movimiento: movimientoData,
          });
          const updatedMovimiento = response.data.movimiento;
          set((state) => ({
            movimientos: state.movimientos.map((m: IMovimiento) =>
              m.id === id ? updatedMovimiento : m
            ),
            loading: false,
          }));
          // Refresca la lista completa
          await get().getMovimientos();
          return updatedMovimiento;
        } catch (error: unknown) {
          let errorMessage = "Error al actualizar movimiento";
          if (error instanceof Error) errorMessage = error.message;
          set({
            error: errorMessage,
            loading: false,
          });
          throw new Error(errorMessage);
        }
      },

      updateMovimientoStatus: async (
        id: string,
        estatus: EstatusMovimiento,
        notas?: string
      ) => {
        try {
          set({ loading: true, error: null });

          await apiClient.put(`/movimientos/${id}/estatus`, {
            estatus,
            notas,
          });

          // Refresh the movements list
          await get().getMovimientos();

          set({ loading: false });
        } catch (error: unknown) {
          let errorMessage = "Error al actualizar estatus";
          if (error instanceof Error) errorMessage = error.message;
          set({
            error: errorMessage,
            loading: false,
          });
          throw new Error(errorMessage);
        }
      },

      deleteMovimiento: async (id: string) => {
        try {
          set({ loading: true, error: null });

          await apiClient.delete(`/movimientos/${id}`, {});

          set((state) => ({
            movimientos: state.movimientos.filter(
              (m: IMovimiento) => m.id !== id
            ),
            loading: false,
          }));
        } catch (error: unknown) {
          let errorMessage = "Error al eliminar movimiento";
          if (error instanceof Error) errorMessage = error.message;
          set({
            error: errorMessage,
            loading: false,
          });
          throw new Error(errorMessage);
        }
      },

      // State management
      setLoading: (loading: boolean) => {
        set({ loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },

      clearError: () => {
        set({ error: null });
      },
      setPage: (page: number) => {
        set({ page });
        get().getMovimientos();
      },
      setLimit: (limit: number) => {
        set({ limit });
        get().getMovimientos();
      },
    }),
    {
      name: "movimientos-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
