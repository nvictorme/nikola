/* eslint-disable @typescript-eslint/no-explicit-any */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ApiClient } from "../api/api.client";
import { ReporteParams, ReporteResponse } from "shared/interfaces";

export type ReportesStore = {
  reportes: ReporteResponse[];
  isLoading: boolean;
  error: string | null;
  generarReporte: (params: ReporteParams) => Promise<void>;
  addReporte: (reporte: ReporteResponse) => void;
  removeReporte: (id: string) => void;
};

const initialState: Pick<ReportesStore, "reportes" | "isLoading" | "error"> = {
  reportes: [],
  isLoading: false,
  error: null,
};

export const useReportesStore = create<ReportesStore>()(
  persist(
    (set): ReportesStore => ({
      ...initialState,
      generarReporte: async (params: ReporteParams) => {
        try {
          set({ isLoading: true, error: null });
          const response = await new ApiClient().post<ReporteParams>(
            "/reportes/generar",
            params
          );
          set((state) => ({
            reportes: [response.data, ...state.reportes],
            isLoading: false,
          }));
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },
      addReporte: (reporte) =>
        set((state) => ({
          reportes: [...state.reportes, reporte],
        })),
      removeReporte: (id) =>
        set((state) => ({
          reportes: state.reportes.filter((reporte) => reporte.id !== id),
        })),
    }),
    {
      name: "reportes-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
