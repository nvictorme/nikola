import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IPersona } from "shared/interfaces";
import { ApiClient } from "../api/api.client";

export type PersonasStore = {
  personas: IPersona[];
  persona: IPersona | null;
  crearPersona: (persona: IPersona) => Promise<void>;
  listarPersonas: () => Promise<void>;
  actualizarPersona: (persona: IPersona) => Promise<void>;
  setPersona: (persona: IPersona | null) => void;
  openSheet: boolean;
  showSheet: () => void;
  hideSheet: () => void;
  page: number;
  total: number;
  limit: number;
  pageCount: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  term: string;
  setTerm: (term: string) => void;
};

const initialState: Pick<
  PersonasStore,
  | "personas"
  | "persona"
  | "openSheet"
  | "total"
  | "page"
  | "limit"
  | "pageCount"
  | "term"
> = {
  personas: [],
  persona: null,
  openSheet: false,
  total: 0,
  page: 1,
  limit: 10,
  pageCount: 1,
  term: "",
};

export const usePersonasStore = create<PersonasStore>()(
  persist(
    (set, get): PersonasStore => ({
      ...initialState,
      crearPersona: async (persona) => {
        try {
          await new ApiClient().post(`/personas`, { persona });
          await get().listarPersonas();
        } catch (error) {
          console.error(error);
        }
      },
      listarPersonas: async () => {
        try {
          const { data } = await new ApiClient().get(`/personas`, {
            page: get().page,
            limit: get().limit,
            term: get().term,
          });
          set({ ...data });
        } catch (error) {
          console.error(error);
        }
      },
      actualizarPersona: async (persona: IPersona) => {
        try {
          await new ApiClient().put(`/personas/${persona.id}`, {
            persona,
          });
          await get().listarPersonas();
        } catch (error) {
          console.error(error);
        }
      },
      setPersona: (persona) => set({ persona }),
      showSheet: () => set({ openSheet: true }),
      hideSheet: () => set({ openSheet: false }),
      setPage: (page) => {
        set({ page });
        get().listarPersonas();
      },
      setLimit: (limit) => {
        set({ limit });
        get().listarPersonas();
      },
      setTerm: (term: string) => {
        set({ term });
        get().listarPersonas();
      },
    }),
    {
      name: "personas-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
