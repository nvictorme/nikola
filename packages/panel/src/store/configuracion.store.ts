import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ApiClient } from "../api/api.client";
import { IFactores } from "shared/interfaces";
import { TipoCliente } from "shared/enums";
import { TipoCambio } from "shared/enums";

export type ConfiguracionStore = {
  factores: IFactores;
  fetchFactores: () => Promise<void>;
  actualizarFactores: (factores: IFactores) => Promise<void>;
};

const initialState: Omit<
  ConfiguracionStore,
  "fetchFactores" | "actualizarFactores"
> = {
  factores: {
    [TipoCliente.instalador]: 1,
    [TipoCliente.mayorista]: 0.9,
    [TipoCliente.general]: 1.1,
    [TipoCambio.usd]: 1,
    [TipoCambio.bcv]: 1.5,
  },
};

export const useConfiguracionStore = create<ConfiguracionStore>()(
  persist(
    (set) => ({
      ...initialState,
      fetchFactores: async () => {
        try {
          const { data } = await new ApiClient().get(
            "/configuracion/factores",
            {}
          );
          set({ factores: data.factores });
        } catch (error) {
          console.error(error);
        }
      },
      actualizarFactores: async (factores: IFactores) => {
        try {
          const { data } = await new ApiClient().post(
            "/configuracion/factores",
            { factores }
          );
          set({ factores: data.factores });
        } catch (error) {
          console.error(error);
        }
      },
    }),
    {
      name: "configuracion-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
