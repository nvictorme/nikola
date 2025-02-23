import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IRol } from "shared/interfaces";
import { ApiClient } from "../api/api.client";

export type RolesStore = {
  roles: IRol[];
  crearRol: (rol: IRol) => Promise<void>;
  listarRoles: () => Promise<void>;
  actualizarRol: (rol: IRol) => Promise<void>;
};

const initialState: Pick<RolesStore, "roles"> = {
  roles: [],
};

export const useRolesStore = create<RolesStore>()(
  persist(
    (set, get): RolesStore => ({
      ...initialState,
      crearRol: async (rol: IRol) => {
        try {
          await new ApiClient().post(`/roles`, { rol });
          await get().listarRoles();
        } catch (error) {
          console.error(error);
        }
      },
      listarRoles: async () => {
        try {
          const { data } = await new ApiClient().get(`/roles`, {});
          set({ roles: data.roles });
        } catch (error) {
          console.error(error);
        }
      },
      actualizarRol: async (rol: IRol) => {
        try {
          await new ApiClient().put(`/roles/${rol.id}`, {
            rol,
          });
          await get().listarRoles();
        } catch (error) {
          console.error(error);
        }
      },
    }),
    {
      name: "roles-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
