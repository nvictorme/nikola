import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ApiClient } from "../api/api.client";
import { toast } from "sonner";
import { IUsuario } from "shared/interfaces";

export interface IAuditLog {
  id: string;
  entity: string;
  entityId: string;
  action: string;
  user: IUsuario;
  changes: Record<string, unknown>;
  timestamp: string;
  oldValue: Record<string, unknown>;
  newValue: Record<string, unknown>;
}

export type AuditoriaStore = {
  logs: IAuditLog[];
  loading: boolean;
  page: number;
  total: number;
  limit: number;
  pageCount: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  entity: string | null;
  setEntity: (entity: string | null) => void;
  action: string | null;
  setAction: (action: string | null) => void;
  entityId: string | null;
  setEntityId: (entityId: string | null) => void;
  userId: string | null;
  setUserId: (userId: string | null) => void;
  listarAuditLogs: () => Promise<void>;
};

const initialState: Pick<
  AuditoriaStore,
  | "logs"
  | "page"
  | "pageCount"
  | "total"
  | "limit"
  | "entity"
  | "action"
  | "entityId"
  | "userId"
  | "loading"
> = {
  logs: [],
  page: 1,
  total: 0,
  limit: 10,
  pageCount: 1,
  entity: null,
  action: null,
  entityId: null,
  userId: null,
  loading: false,
};

export const useAuditoriaStore = create<AuditoriaStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      listarAuditLogs: async () => {
        try {
          set({ loading: true });
          const { entity, action, entityId, userId } = get();
          const { data } = await new ApiClient().get(`/auditoria`, {
            page: get().page,
            limit: get().limit,
            ...(entity && { entity }),
            ...(action && { action }),
            ...(entityId && { entityId }),
            ...(userId && { userId }),
          });
          set({
            logs: data.logs,
            total: data.total,
            page: data.page,
            limit: data.limit,
            pageCount: data.pageCount,
          });
        } catch (error) {
          console.error(error);
          toast.error("Error al cargar los registros de auditoría", {
            duration: 3000,
            position: "top-center",
          });
        } finally {
          set({ loading: false });
        }
      },
      setPage: (page: number) => {
        set({ page });
        get().listarAuditLogs();
      },
      setLimit: (limit: number) => {
        set({ limit });
        get().listarAuditLogs();
      },
      setEntity: (entity: string | null) => {
        set({ entity, page: 1 });
        get().listarAuditLogs();
      },
      setAction: (action: string | null) => {
        set({ action, page: 1 });
        get().listarAuditLogs();
      },
      setEntityId: (entityId: string | null) => {
        set({ entityId, page: 1 });
        get().listarAuditLogs();
      },
      setUserId: (userId: string | null) => {
        set({ userId, page: 1 });
        get().listarAuditLogs();
      },
    }),
    {
      name: "auditoria-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
