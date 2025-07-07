import { create } from "zustand";
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

interface MovimientosActions {
  // Getters
  getMovimientos: (params?: {
    page?: number;
    limit?: number;
    term?: string;
    estatus?: string;
  }) => Promise<void>;
  getMovimiento: (id: string) => Promise<void>;

  // Setters
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setSelectedMovimiento: (movimiento: IMovimiento | null) => void;
  setFilters: (filters: Partial<MovimientosState["filters"]>) => void;
  clearFilters: () => void;

  // CRUD Operations
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
  updateMovimientoStatus: (
    id: string,
    estatus: EstatusMovimiento,
    notas?: string
  ) => Promise<void>;
  deleteMovimiento: (id: string) => Promise<void>;

  // State management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
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

export const useMovimientosStore = create<
  MovimientosState & MovimientosActions
>((set, get) => ({
  ...initialState,

  // Getters
  getMovimientos: async (params = {}) => {
    try {
      set({ loading: true, error: null });

      const { page = 1, limit = 10, term, estatus } = params;
      const queryParams = new URLSearchParams();

      if (page) queryParams.append("page", page.toString());
      if (limit) queryParams.append("limit", limit.toString());
      if (term) queryParams.append("term", term);
      if (estatus) queryParams.append("estatus", estatus);

      const response = await apiClient.get(
        `/movimientos?${queryParams.toString()}`,
        {}
      );

      set({
        movimientos: response.data.movimientos,
        total: response.data.total,
        page: response.data.page,
        pageCount: response.data.pageCount,
        loading: false,
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al cargar movimientos";
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
        error instanceof Error ? error.message : "Error al cargar movimiento";
      set({
        error: errorMessage,
        loading: false,
      });
    }
  },

  // Setters
  setSelectedMovimiento: (movimiento) => {
    set({ selectedMovimiento: movimiento });
  },

  setFilters: (filters) => {
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
  createMovimiento: async (movimientoData) => {
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
      const errorMessage =
        error instanceof Error ? error.message : "Error al crear movimiento";
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
      const errorMessage =
        error instanceof Error ? error.message : "Error al actualizar estatus";
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
        movimientos: state.movimientos.filter((m) => m.id !== id),
        loading: false,
      }));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al eliminar movimiento";
      set({
        error: errorMessage,
        loading: false,
      });
      throw new Error(errorMessage);
    }
  },

  // State management
  setLoading: (loading) => {
    set({ loading });
  },

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
  setPage: (page) => {
    set({ page });
  },
  setLimit: (limit) => {
    set({ limit });
  },
}));
