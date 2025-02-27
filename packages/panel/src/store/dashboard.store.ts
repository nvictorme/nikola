import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ApiClient } from "../api/api.client";
import type { IDashboardCharts } from "shared/interfaces";

export type DashboardStore = {
  isLoading: boolean;
  isLoadingCharts: boolean;
  ventasMensuales: number;
  totalVentasMes: number;
  promedioVenta: number;
  charts: IDashboardCharts;
  fetchDashboardData: () => Promise<void>;
  fetchChartsData: () => Promise<void>;
};

const initialState: Omit<
  DashboardStore,
  "fetchDashboardData" | "fetchChartsData"
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
    }),
    {
      name: "dashboard-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
