import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";
import { IUsuario } from "shared/interfaces";
import { ApiClient } from "../api/api.client";
import { useProductosStore } from "./productos.store";
import { toast } from "sonner";

export type AuthTokens = { accessToken: string; refreshToken: string };

export type AuthStore = {
  loading: boolean;
  user: IUsuario | null;
  tokens: AuthTokens | null;
  recoverPassword: (data: { email: string }) => Promise<void>;
  resetPassword: (data: {
    password: string;
    confirmation: string;
    hash: string;
    token: string;
  }) => Promise<void>;
  signUp: (data: { email: string; password: string }) => Promise<void>;
  signIn: (data: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: Omit<IUsuario, "password">) => Promise<void>;
  reset: () => void;
};

export type DecodedToken = { user: IUsuario; iat: number; exp: number };

const initialState: Pick<AuthStore, "loading" | "user" | "tokens"> = {
  loading: false,
  user: null,
  tokens: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get): AuthStore => ({
      ...initialState,
      signUp: async ({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) => {
        try {
          set({ loading: true });
          const { data: tokens } = await new ApiClient().post("/auth/signup", {
            email,
            password,
          });
          const { user }: DecodedToken = jwtDecode(tokens.accessToken);
          set({ tokens, user, loading: false });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          let message = error.response?.data?.error ?? error.message;
          if (error.response?.status === 500)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            message = "El correo electrónico ya está registrado";
          console.error(message);
          set({ loading: false });
        }
      },
      signIn: async ({
        email,
        password,
      }: {
        email: string;
        password: string;
      }) => {
        try {
          set({ loading: true });
          const { data: tokens } = await new ApiClient().post("/auth/signin", {
            email,
            password,
          });
          const { user }: DecodedToken = jwtDecode(tokens.accessToken);
          set({ tokens, user, loading: false });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          set({ loading: false });
        }
      },
      signOut: async () => {
        try {
          set({ loading: true });
          await new ApiClient().post("/auth/signout", {
            refreshToken: get().tokens?.refreshToken,
          });
          window.location.href = "/";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          const message = error.response?.data?.error ?? error.message;
          console.error(message);
        } finally {
          get().reset();
          useProductosStore.getState().reset();
        }
      },
      recoverPassword: async ({ email }: { email: string }) => {
        try {
          set({ loading: true });
          await new ApiClient().post("/auth/recover", { email });
          toast.info(
            `Se ha enviado un enlace de recuperación a ${email}. Revisa tu bandeja de entrada.`,
            { duration: 5000, position: "top-center" }
          );
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          const message = error.response?.data?.error ?? error.message;
          toast.error(message, { duration: 3000, position: "top-center" });
        } finally {
          set({
            loading: false,
          });
        }
      },
      resetPassword: async ({ password, confirmation, hash, token }) => {
        try {
          set({ loading: true });
          await new ApiClient().post("/auth/reset", {
            password,
            confirmation,
            hash,
            token,
          });
          window.location.href = "/";
          toast.success("Contraseña actualizada correctamente", {
            duration: 3000,
            position: "top-center",
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          const message = error.response?.data?.error ?? error.message;
          toast.error(message, { duration: 3000, position: "top-center" });
        } finally {
          set({
            loading: false,
          });
        }
      },
      updateUser: async (user) => {
        try {
          set({ loading: true });
          const { data } = await new ApiClient().put("/auth/self", {
            ...user,
            seudonimo: user.seudonimo?.toLowerCase().trim() ?? null,
          });
          set({
            user: { ...get().user, ...data.profile },
            loading: false,
          });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          console.log(error.response);
          const message = error.response?.data?.error ?? error.message;
          console.error(message);
          set({
            loading: false,
          });
        }
      },
      reset: () => set(initialState),
    }),

    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
