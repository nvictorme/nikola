import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ApiClient } from "../api/api.client";
import type { IDashboardCharts, IPersona } from "shared/interfaces";

export type DashboardStore = {
  isLoading: boolean;
  isLoadingCharts: boolean;
  ventasMensuales: number;
  totalVentasMes: number;
  promedioVenta: number;
  deudores: IPersona[];
  charts: IDashboardCharts;
  fetchDashboardData: () => Promise<void>;
  fetchChartsData: () => Promise<void>;
  fetchDeudores: () => Promise<void>;
};

const initialState: Omit<
  DashboardStore,
  "fetchDashboardData" | "fetchChartsData" | "fetchDeudores"
> = {
  ventasMensuales: 0,
  totalVentasMes: 0,
  promedioVenta: 0,
  isLoading: false,
  isLoadingCharts: false,
  charts: {
    dailySales: [],
    salesByCategory: [],
    salesByBranch: [],
  },
  deudores: [],
};

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set) => ({
      ...initialState,
      fetchDashboardData: async () => {
        try {
          set({ isLoading: true });
          const { data } = await new ApiClient().get("/dashboard", {});
          set(data);
        } catch (error) {
          console.error(error);
        } finally {
          set({ isLoading: false });
        }
      },
      fetchChartsData: async () => {
        try {
          set({ isLoadingCharts: true });
          const { data } = await new ApiClient().get("/dashboard/charts", {});
          set({ charts: data });
        } catch (error) {
          console.error(error);
        } finally {
          set({ isLoadingCharts: false });
        }
      },
      fetchDeudores: async () => {
        try {
          const { data } = await new ApiClient().get("/dashboard/deudores", {});
          set({ deudores: data.deudores });
        } catch (error) {
          console.error(error);
        }
      },
    }),
    {
      name: "dashboard-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
