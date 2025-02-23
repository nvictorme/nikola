import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IUsuario } from "shared/interfaces";
import { ApiClient } from "../api/api.client";

export type InvitacionPayload = {
  email: string;
  nombre: string;
  apellido: string;
};

export type UsuariosStore = {
  usuario: IUsuario | null;
  usuarios: IUsuario[];
  distribuidores: IUsuario[];
  invitarUsuario: (payload: InvitacionPayload) => Promise<void>;
  crearUsuario: (persona: IUsuario) => Promise<void>;
  listarUsuarios: ({
    nif,
    email,
  }: {
    nif?: string;
    email?: string;
  }) => Promise<void>;
  listarDistribuidores: () => Promise<void>;
  actualizarUsuario: (user: IUsuario) => Promise<void>;
  setUsuario: (usuario: IUsuario | null) => void;
  openSheet: boolean;
  showSheet: () => void;
  hideSheet: () => void;
  page: number;
  total: number;
  limit: number;
  pageCount: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
};

const initialState: Pick<
  UsuariosStore,
  | "usuarios"
  | "usuario"
  | "distribuidores"
  | "openSheet"
  | "total"
  | "page"
  | "limit"
  | "pageCount"
> = {
  usuario: null,
  usuarios: [],
  distribuidores: [],
  openSheet: false,
  total: 0,
  page: 1,
  limit: 10,
  pageCount: 1,
};

export const useUsuariosStore = create<UsuariosStore>()(
  persist(
    (set, get): UsuariosStore => ({
      ...initialState,
      invitarUsuario: async (payload) => {
        try {
          await new ApiClient().post(`/usuarios/invitar`, payload);
        } catch (error) {
          console.error(error);
        }
      },
      crearUsuario: async (usuario) => {
        try {
          await new ApiClient().post(`/usuarios`, { usuario });
          await get().listarUsuarios({});
        } catch (error) {
          console.error(error);
        }
      },
      listarUsuarios: async ({ nif, email }) => {
        try {
          const { data } = await new ApiClient().get(`/usuarios`, {
            page: get().page,
            limit: get().limit,
            ...(nif && { nif }),
            ...(email && { email }),
          });
          set({ ...data });
        } catch (error) {
          console.error(error);
        }
      },
      listarDistribuidores: async () => {
        try {
          const {
            data: { distribuidores },
          } = await new ApiClient().get(`/usuarios/distribuidores`, {});
          set({ distribuidores });
        } catch (error) {
          console.error(error);
        }
      },
      actualizarUsuario: async (user) => {
        try {
          await new ApiClient().put(`/usuarios/${user.id}`, {
            user,
          });
          await get().listarUsuarios({});
        } catch (error) {
          console.error(error);
        }
      },
      setUsuario: (usuario) => set({ usuario }),
      openSheet: false,
      showSheet: () => set({ openSheet: true }),
      hideSheet: () => set({ openSheet: false }),
      setPage: (page) => {
        set({ page });
        get().listarUsuarios({});
      },
      setLimit: (limit) => {
        set({ limit });
        get().listarUsuarios({});
      },
    }),
    {
      name: "usuarios-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
