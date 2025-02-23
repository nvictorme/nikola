import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { jwtDecode } from "jwt-decode";
import { ApiClient } from "./api.client";
import { AuthTokens, DecodedToken, useAuthStore } from "../store/auth.store";
import { toast } from "sonner";

// refactor to also check if accessToken expired
const shouldRefreshToken = (configUrl: string) => {
  // Exclude Auth URLs from a token refresh workflow
  const isAuthURL = configUrl.includes("auth");
  if (isAuthURL) return false;
  const tokens = useAuthStore.getState().tokens;
  // check if access token expired
  const decoded: DecodedToken = jwtDecode(tokens?.accessToken || "");
  const expired = decoded.exp < Date.now() / 1000;
  return expired;
};

const refreshTokens = async (refreshToken: string): Promise<AuthTokens> => {
  const { data: tokens } = await new ApiClient().post("/auth/refresh", {
    refreshToken,
  });
  return tokens;
};

const interceptors = {
  response: {
    success(response: AxiosResponse) {
      return response;
    },
    async error(e: AxiosError) {
      if (e) {
        const status = e.response?.status;
        const config = e.config as AxiosRequestConfig;
        const { url: configUrl = "" } = config;

        toast.error(
          (e.response?.data as { error?: string })?.error ??
            (e.response?.data as { message?: string })?.message ??
            e.message ??
            "Ocurrió un error desconocido",
          { duration: 3000, position: "top-center" }
        );

        switch (status) {
          case 401: {
            if (shouldRefreshToken(configUrl)) {
              const tokens: AuthTokens = await refreshTokens(
                useAuthStore.getState().tokens?.refreshToken ?? ""
              );
              useAuthStore.setState({ tokens });
              if (tokens.accessToken && config.headers) {
                config.headers.Authorization = `Bearer ${tokens.accessToken}`;
                return axios.request(config);
              }
            } else {
              // The request returned 401 as part of the token refresh flow
              return Promise.reject(e);
            }
            break;
          }
          case 403: {
            if (shouldRefreshToken(configUrl)) {
              // The request returned 403 as part of the token refresh flow
              // then user must be logged out
              useAuthStore.getState().signOut();
            }
            break;
          }
          case 429: {
            toast.error("Too many requests, please try again later.", {
              duration: 5000,
              position: "top-center",
            });
            break;
          }
          default: {
            return Promise.reject(e);
          }
        }
      }
    },
  },
};

const attachInterceptors = (axiosInstance: AxiosInstance) => {
  axiosInstance.interceptors.response.use(
    interceptors.response.success,
    interceptors.response.error
  );
  return axiosInstance;
};

export { refreshTokens, attachInterceptors };
