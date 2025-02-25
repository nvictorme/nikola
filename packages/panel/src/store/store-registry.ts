import { create, StateCreator } from "zustand";
import { persist, createJSONStorage, PersistOptions } from "zustand/middleware";

// Central store registry to track all stores that need to be reset
type StoreRegistry = {
  stores: Array<{ name: string; resetFn: () => void }>;
  register: (storeName: string, resetFn: () => void) => void;
  resetAll: () => void;
};

export const storeRegistry = create<StoreRegistry>()((set, get) => ({
  stores: [],
  register: (storeName, resetFn) => {
    const { stores } = get();
    // Only register if not already registered
    if (!stores.some((store) => store.name === storeName)) {
      set({ stores: [...stores, { name: storeName, resetFn }] });
    }
  },
  resetAll: () => {
    const { stores } = get();
    stores.forEach((store) => store.resetFn());
  },
}));

// Helper function to create a persisted store that automatically registers with the registry
export function createPersistedStore<T extends { reset: () => void }>(
  storeName: string,
  storeCreator: StateCreator<T, [], []>,
  persistOptions?: Omit<PersistOptions<T, T>, "name" | "storage">
) {
  const useStore = create<T>()(
    persist(storeCreator, {
      name: storeName,
      storage: createJSONStorage(() => localStorage),
      ...persistOptions,
    })
  );

  // Register the store's reset function with the registry
  storeRegistry.getState().register(storeName, useStore.getState().reset);

  return useStore;
}
