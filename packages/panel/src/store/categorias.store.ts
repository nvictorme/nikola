import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ICategoria, ISubcategoria } from "shared/interfaces";
import { ApiClient } from "../api/api.client";

export type CategoriasStore = {
  categorias: ICategoria[];
  categoria: ICategoria | null;
  subcategorias: ISubcategoria[];
  subcategoria: ISubcategoria | null;
  listarCategorias: () => Promise<void>;
  crearCategoria: (categoria: ICategoria) => Promise<void>;
  actualizarCategoria: (categoria: ICategoria) => Promise<void>;
  eliminarCategoria: (id: string) => Promise<void>;
  setCategoria: (categoria: ICategoria | null) => void;
  listarSubcategorias: (id: string) => Promise<void>;
  crearSubcategoria: (subcategoria: ISubcategoria) => Promise<void>;
  actualizarSubcategoria: (subcategoria: ISubcategoria) => Promise<void>;
  eliminarSubcategoria: (id: string) => Promise<void>;
  setSubcategoria: (subcategoria: ISubcategoria | null) => void;
};

const initialState: Pick<
  CategoriasStore,
  "categorias" | "categoria" | "subcategorias" | "subcategoria"
> = {
  categorias: [],
  categoria: null,
  subcategorias: [],
  subcategoria: null,
};

export const useCategoriasStore = create<CategoriasStore>()(
  persist(
    (set) => ({
      ...initialState,
      listarCategorias: async () => {
        const { data } = await new ApiClient().get("/categorias", {});
        set({ categorias: data.categorias });
      },
      crearCategoria: async (categoria: ICategoria) => {
        const { data } = await new ApiClient().post("/categorias", categoria);
        set({ categoria: data.categoria });
      },
      actualizarCategoria: async (categoria: ICategoria) => {
        const { data } = await new ApiClient().put(
          `/categorias/${categoria.id}`,
          categoria
        );
        set({ categoria: data.categoria });
      },
      eliminarCategoria: async (id: string) => {
        await new ApiClient().delete(`/categorias/${id}`, {});
      },
      setCategoria: (categoria: ICategoria | null) => set({ categoria }),
      listarSubcategorias: async (id: string) => {
        const { data } = await new ApiClient().get(
          `/categorias/${id}/subcategorias`,
          {}
        );
        set({ subcategorias: data.subcategorias });
      },
      crearSubcategoria: async (subcategoria: ISubcategoria) => {
        const { data } = await new ApiClient().post(
          `/categorias/${subcategoria.categoria.id}/subcategorias`,
          subcategoria
        );
        set({ subcategoria: data.subcategoria });
      },
      actualizarSubcategoria: async (subcategoria: ISubcategoria) => {
        const { data } = await new ApiClient().put(
          `/categorias/${subcategoria.categoria.id}/subcategorias/${subcategoria.id}`,
          subcategoria
        );
        set({ subcategoria: data.subcategoria });
      },
      eliminarSubcategoria: async (id: string) => {
        await new ApiClient().delete(`/subcategorias/${id}`, {});
      },
      setSubcategoria: (subcategoria: ISubcategoria | null) =>
        set({ subcategoria }),
    }),
    {
      name: "categorias-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
