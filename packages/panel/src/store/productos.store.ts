import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ApiClient } from "../api/api.client";
import {
  IArchivo,
  IHistorialPrecio,
  IProducto,
  IStockProducto,
} from "shared/interfaces";
import { EstatusArchivo } from "shared/enums";
import { toast } from "sonner";

export type ProductosStore = {
  productos: IProducto[];
  producto: IProducto | null;
  stock: IStockProducto | null;
  loading: boolean;
  crearProducto: (producto: IProducto) => Promise<void>;
  listarProductos: () => Promise<void>;
  getProducto: (productoId: string) => Promise<void>;
  actualizarProducto: (producto: IProducto) => Promise<void>;
  agregarItemGaleria: (
    producto: IProducto,
    file: File,
    fileKey: string,
    isPortada?: boolean
  ) => Promise<void>;
  eliminarItemGaleria: (productoId: string, archivoId: string) => Promise<void>;
  setProducto: (producto: IProducto | null) => void;
  reset: () => void;
  actualizarStock: (
    productoId: string,
    almacenId: string,
    stock: Partial<IStockProducto>
  ) => Promise<void>;
  getStock: (productoId: string, almacenId: string) => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTerm: (term: string | null) => void;
  setCategoria: (categoria: string | null) => void;
  setEnOferta: (enOferta: boolean) => void;
  page: number;
  limit: number;
  pageCount: number;
  total: number;
  term: string | null;
  categoria: string | null;
  enOferta: boolean;
  showDetails: boolean;
  setShowDetails: (showDetails: boolean) => void;
  showGallery: boolean;
  setShowGallery: (showGallery: boolean) => void;
  showStockModal: boolean;
  setShowStockModal: (showStockModal: boolean) => void;
  resetFilters: () => void;
  fetchHistorialPrecio: (productoId: string) => Promise<void>;
  historialPrecio: IHistorialPrecio[];
};

const initialState: Pick<
  ProductosStore,
  | "productos"
  | "producto"
  | "stock"
  | "loading"
  | "page"
  | "limit"
  | "pageCount"
  | "total"
  | "term"
  | "categoria"
  | "enOferta"
  | "showDetails"
  | "showGallery"
  | "showStockModal"
  | "historialPrecio"
> = {
  productos: [],
  producto: null,
  stock: null,
  loading: false,
  page: 1,
  limit: 10,
  pageCount: 10,
  total: 0,
  term: null,
  categoria: null,
  enOferta: false,
  showDetails: false,
  showGallery: false,
  showStockModal: false,
  historialPrecio: [],
};

export const useProductosStore = create<ProductosStore>()(
  persist(
    (set, get): ProductosStore => ({
      ...initialState,
      crearProducto: async (producto) => {
        try {
          await new ApiClient().post(`/productos`, { producto });
          await get().listarProductos();
        } catch (error) {
          console.error(error);
        }
      },
      listarProductos: async () => {
        try {
          set({ loading: true });
          const { data } = await new ApiClient().get(`/productos`, {
            page: get().page,
            limit: get().limit,
            term: get().term,
            categoria: get().categoria,
            enOferta: get().enOferta,
          });
          set({ ...data });
        } catch (error) {
          console.error(error);
        } finally {
          set({ loading: false });
        }
      },
      getProducto: async (productoId) => {
        try {
          set({ loading: true });
          const { data } = await new ApiClient().get(
            `/productos/${productoId}`,
            {}
          );
          set({ producto: data.producto });
        } catch (error) {
          console.error(error);
        } finally {
          set({ loading: false });
        }
      },
      actualizarProducto: async (producto: IProducto) => {
        try {
          await new ApiClient().put(`/productos/${producto.id}`, {
            producto,
          });
          await get().listarProductos();
        } catch (error) {
          console.error(error);
        }
      },
      agregarItemGaleria: async (
        producto,
        file,
        fileKey,
        isPortada = false
      ) => {
        try {
          const archivo: Partial<IArchivo> = {
            nombre: file.name,
            tipo: file.type,
            estatus: EstatusArchivo.cargado,
            url: fileKey,
          };

          await new ApiClient().post(`/productos/${producto.id}/galeria`, {
            archivo,
            isPortada,
          });

          await get().getProducto(producto.id);
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      eliminarItemGaleria: async (productoId, archivoId) => {
        try {
          await new ApiClient().delete(
            `/productos/${productoId}/galeria/${archivoId}`,
            {}
          );
          await get().getProducto(productoId);
        } catch (error) {
          console.error(error);
          throw error;
        }
      },
      setProducto: (producto) => {
        set({ producto });
      },
      reset: () => set(initialState),
      getStock: async (productoId, almacenId) => {
        try {
          const { data } = await new ApiClient().get(
            `/productos/${productoId}/stock/${almacenId}`,
            {}
          );
          set({ stock: data.stock });
        } catch (error) {
          console.error(error);
        }
      },
      actualizarStock: async (productoId, almacenId, stock) => {
        try {
          await new ApiClient().put(
            `/productos/${productoId}/stock/${almacenId}`,
            {
              stock,
            }
          );
          await get().getProducto(productoId);
          toast.success("Stock actualizado correctamente");
        } catch (error) {
          console.error(error);
          toast.error("Error al actualizar el stock");
        }
      },
      setPage: (page) => {
        set({ page });
        get().listarProductos();
      },
      setLimit: (limit) => {
        set({ limit, page: 1 });
        get().listarProductos();
      },
      setTerm: (term) => {
        set({ term, page: term ? get().page : 1 });
        get().listarProductos();
      },
      setCategoria: (categoria) => {
        set({ categoria, page: categoria ? get().page : 1 });
        get().listarProductos();
      },
      setEnOferta: (enOferta) => {
        set({ enOferta, page: enOferta ? get().page : 1 });
        get().listarProductos();
      },
      setShowDetails: (showDetails) => {
        set({ showDetails });
      },
      setShowGallery: (showGallery) => {
        set({ showGallery });
      },
      setShowStockModal: (showStockModal) => {
        set({ showStockModal });
      },
      resetFilters: () => {
        set({
          categoria: null,
          enOferta: false,
          term: null,
          page: 1,
        });
        get().listarProductos();
      },
      fetchHistorialPrecio: async (productoId) => {
        try {
          const { data } = await new ApiClient().get(
            `/productos/${productoId}/historial-precios`,
            {}
          );
          set({ historialPrecio: data.historialPrecio });
        } catch (error) {
          console.error(error);
        }
      },
    }),
    {
      name: "productos-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
