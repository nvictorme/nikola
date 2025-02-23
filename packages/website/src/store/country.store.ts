import { create } from "zustand";
import { persist } from "zustand/middleware";

const API_URL = import.meta.env.VITE_API_URL;

interface Country {
  id: string;
  nombre: string;
  name: string;
  iso2: string;
}

interface ApiResponse {
  success: boolean;
  count: number;
  data: Country[];
}

interface CountryStore {
  selectedCountry: Country | null;
  countries: Country[];
  loading: boolean;
  error: string | null;
  setSelectedCountry: (country: Country) => void;
  fetchCountries: () => Promise<void>;
}

const initialState: Pick<
  CountryStore,
  "countries" | "selectedCountry" | "loading" | "error"
> = {
  countries: [],
  selectedCountry: null,
  loading: false,
  error: null,
};

export const useCountryStore = create<CountryStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setSelectedCountry: (country) => set({ selectedCountry: country }),
      fetchCountries: async () => {
        set({ loading: true, error: null });
        try {
          const response = await fetch(`${API_URL}/paises`);
          const data: ApiResponse = await response.json();
          if (data.success) {
            set({ countries: data.data });
          } else {
            if (!get().countries.length) {
              set({ error: "Failed to fetch countries" });
            }
          }
        } catch (error) {
          set({ error: "Error fetching countries" });
          console.error("Error fetching countries:", error);
        } finally {
          set({ loading: false });
        }
      },
    }),
    {
      name: "country-storage",
      partialize: (state) => ({ selectedCountry: state.selectedCountry }),
    }
  )
);
