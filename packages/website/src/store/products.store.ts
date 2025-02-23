import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IProducto } from "shared/dist/interfaces";
import { useCountryStore } from "./country.store";

const API_URL = import.meta.env.VITE_API_URL;

export type ProductosStore = {
  products: IProducto[];
  product: IProducto | null;
  fetchProducts: () => Promise<void>;
  setProduct: (producto: IProducto) => void;
};

const initialState: Pick<ProductosStore, "products" | "product"> = {
  products: [],
  product: null,
};

export const useProductsStore = create<ProductosStore>()(
  persist(
    (set): ProductosStore => ({
      ...initialState,
      fetchProducts: async () => {
        try {
          const selectedCountry = useCountryStore.getState().selectedCountry;
          if (!selectedCountry) {
            window.location.href = "/";
            return;
          }

          const response = await fetch(
            `${API_URL}/productos?pais=${selectedCountry.id}`
          );
          const data = await response.json();
          set({ products: data.data });
        } catch (error) {
          console.error(error);
        }
      },
      setProduct: (product) => set({ product }),
    }),
    {
      name: "products-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
