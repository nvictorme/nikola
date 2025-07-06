import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { IOrden, IEnvio, IOrdenHistorial } from "shared/interfaces";
import { ApiClient } from "../api/api.client";
import { EstatusOrden, TipoOrden } from "shared/enums";
import { toast } from "sonner";

export type OrdenesStore = {
  ordenes: IOrden[];
  orden: IOrden | null;
  crearOrden: (args: Partial<IOrden>) => Promise<void>;
  listarOrdenes: () => Promise<void>;
  actualizarOrden: (orden: IOrden) => Promise<void>;
  actualizarEstatusOrden: (
    ordenId: string,
    estatus: EstatusOrden
  ) => Promise<void>;
  eliminarArchivoItemOrden: ({
    ordenId,
    itemId,
    archivoId,
  }: {
    ordenId: string;
    itemId: string;
    archivoId: string;
  }) => void;
  eliminarOrden: (ordenId: string) => Promise<void>;
  setOrden: (orden: IOrden | null) => void;
  convertirEnOrden: (orden: IOrden) => Promise<void>;
  loading: boolean;
  page: number;
  total: number;
  limit: number;
  pageCount: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  term: string;
  setTerm: (term: string) => void;
  tipo: TipoOrden | null;
  setTipo: (tipo: TipoOrden | null) => void;
  estatus: EstatusOrden | null;
  setEstatus: (estatus: EstatusOrden | null) => void;
  showForm: boolean;
  setShowForm: (showForm: boolean) => void;
  agregarEnvio: (args: {
    ordenId: string;
    envio: Partial<IEnvio>;
  }) => Promise<void>;
  historial: IOrdenHistorial[];
  listarHistorial: (ordenId: string) => Promise<void>;
  reemplazarOrden: (orden: IOrden) => void;
  removerOrden: (orden: IOrden) => void;
};

const initialState: Pick<
  OrdenesStore,
  | "ordenes"
  | "orden"
  | "page"
  | "pageCount"
  | "total"
  | "limit"
  | "term"
  | "tipo"
  | "estatus"
  | "showForm"
  | "loading"
  | "historial"
> = {
  ordenes: [],
  orden: null,
  page: 1,
  total: 0,
  limit: 10,
  pageCount: 1,
  term: "",
  tipo: null,
  estatus: null,
  showForm: false,
  loading: false,
  historial: [],
};

export const useOrdenesStore = create<OrdenesStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      listarOrdenes: async () => {
        try {
          const { term, tipo, estatus } = get();
          const { data } = await new ApiClient().get(`/ordenes`, {
            page: get().page,
            limit: get().limit,
            ...(term && { term }),
            ...(tipo && { tipo }),
            ...(estatus && { estatus }),
          });
          set({ ...data });
        } catch (error) {
          console.error(error);
        }
      },
      setOrden: (orden) => set({ orden }),
      convertirEnOrden: async (orden: IOrden) => {
        try {
          const {
            data: { message },
          } = await new ApiClient().put(`/ordenes/convertir`, {
            ordenId: orden.id,
          });
          await get().listarOrdenes();
          toast.success(message, {
            duration: 2000,
            position: "top-center",
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error(error);
          const message = error.response?.data?.message || error.message;
          toast.error(message, { duration: 5000, position: "top-center" });
        }
      },
      crearOrden: async (orden) => {
        try {
          await new ApiClient().post(`/ordenes`, { orden });
          await get().listarOrdenes();
        } catch (error) {
          console.error(error);
        }
      },
      actualizarOrden: async (orden: IOrden) => {
        try {
          await new ApiClient().put(`/ordenes/${orden.id}`, {
            orden,
          });
          await get().listarOrdenes();
        } catch (error) {
          console.error(error);
        }
      },
      actualizarEstatusOrden: async (
        ordenId: string,
        estatus: EstatusOrden
      ) => {
        try {
          set({ loading: true });
          await new ApiClient().put(`/ordenes/${ordenId}/estatus`, {
            estatus,
          });
          await get().listarOrdenes();
        } catch (error) {
          console.error(error);
        } finally {
          set({ loading: false });
        }
      },
      eliminarArchivoItemOrden: async ({ ordenId, itemId, archivoId }) => {
        try {
          await new ApiClient().delete(
            `/ordenes/${ordenId}/items/${itemId}/archivos/${archivoId}`,
            {}
          );
          await get().listarOrdenes();
        } catch (error) {
          console.error(error);
        }
      },
      eliminarOrden: async (ordenId: string) => {
        try {
          await new ApiClient().delete(`/ordenes/${ordenId}`, {});
          await get().listarOrdenes();
        } catch (error) {
          console.error(error);
        }
      },
      setPage: (page: number) => {
        set({ page });
        get().listarOrdenes();
      },
      setLimit: (limit: number) => {
        set({ limit });
        get().listarOrdenes();
      },
      setTerm: (term: string) => {
        set({ term });
        get().listarOrdenes();
      },
      setTipo: (tipo: TipoOrden | null) => {
        set({ tipo });
        get().listarOrdenes();
      },
      setEstatus: (estatus: EstatusOrden | null) => {
        set({ estatus });
        get().listarOrdenes();
      },
      setShowForm: (showForm: boolean) => {
        set({ showForm });
      },
      agregarEnvio: async ({ ordenId, envio }) => {
        try {
          await new ApiClient().post(`/ordenes/${ordenId}/envios`, { envio });
          await get().listarOrdenes();
          toast.success("Envío agregado correctamente");
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.error(error);
          const message = error.response?.data?.message || error.message;
          toast.error(message);
        }
      },
      listarHistorial: async (ordenId: string) => {
        try {
          const { data } = await new ApiClient().get(
            `/ordenes/${ordenId}/historial`,
            {}
          );
          set({ historial: data });
        } catch (error) {
          console.error(error);
          toast.error("Error al cargar el historial");
        }
      },
      reemplazarOrden: (orden: IOrden) => {
        const { ordenes } = get();
        const index = ordenes.findIndex((o) => o.id === orden.id);
        if (index !== -1) {
          set({
            ordenes: [
              ...ordenes.slice(0, index),
              orden,
              ...ordenes.slice(index + 1),
            ],
          });
        } else if (get().page === 1) {
          set({ ordenes: [orden, ...ordenes] });
        }
      },
      removerOrden: (orden: IOrden) => {
        const { ordenes } = get();
        const index = ordenes.findIndex((o) => o.id === orden.id);
        if (index !== -1) {
          set({ ordenes: ordenes.filter((o) => o.id !== orden.id) });
        }
      },
    }),
    {
      name: "ordenes-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
