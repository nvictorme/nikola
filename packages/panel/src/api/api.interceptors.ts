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

interface ErrorResponseData {
  error?: string;
  message?: string;
}

// refactor to also check if accessToken expired
const shouldRefreshToken = (configUrl: string) => {
  // Exclude Auth URLs from a token refresh workflow
  const isAuthURL = configUrl.includes("auth");
  if (isAuthURL) return false;
  const tokens = useAuthStore.getState().tokens;
  if (!tokens?.accessToken) return false; // No access token to check
  try {
    const decoded: DecodedToken = jwtDecode(tokens.accessToken);
    const expired = decoded.exp < Date.now() / 1000;
    return expired;
  } catch {
    // If token is malformed and cannot be decoded, consider it invalid/expired for refresh purposes
    // Also log this event, as it indicates a potentially problematic token in storage
    console.error(
      "Failed to decode access token during shouldRefreshToken check."
    );
    return true;
  }
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
    async error(e: AxiosError<ErrorResponseData>) {
      if (!e.response) {
        // Network error (server is down, CORS issue, etc.)
        toast.error(
          e.message || "Network error. Please check your connection.",
          { duration: 5000, position: "top-center" }
        );
        return Promise.reject(e);
      }

      const status = e.response.status;
      const config = e.config as AxiosRequestConfig;
      const { url: configUrl = "" } = config;
      const responseData = e.response.data;
      const errorMessage =
        responseData?.error ||
        responseData?.message ||
        e.message ||
        "Ocurrió un error desconocido";

      switch (status) {
        case 401:
          if (shouldRefreshToken(configUrl)) {
            try {
              const tokens: AuthTokens = await refreshTokens(
                useAuthStore.getState().tokens?.refreshToken ?? ""
              );
              useAuthStore.setState({ tokens });
              if (tokens.accessToken && config.headers) {
                config.headers.Authorization = `Bearer ${tokens.accessToken}`;
                return axios.request(config); // Retry original request
              }
              // If retry isn't possible (should not happen if refresh was successful and returned tokens)
              // Fall through to show error, but this path is highly unlikely.
            } catch (refreshError: unknown) {
              let refreshErrorMessage =
                "Your session has expired. Please log in again.";
              if (
                axios.isAxiosError(refreshError) &&
                refreshError.response?.data
              ) {
                const refreshResponseData = refreshError.response
                  .data as ErrorResponseData;
                refreshErrorMessage =
                  refreshResponseData?.error ||
                  refreshResponseData?.message ||
                  refreshError.message ||
                  refreshErrorMessage;
              } else if (refreshError instanceof Error) {
                refreshErrorMessage = refreshError.message;
              }

              toast.error(refreshErrorMessage, {
                duration: 4000,
                position: "top-center",
              });
              useAuthStore.getState().signOut();
              return Promise.reject(refreshError);
            }
          } else {
            // 401 not eligible for refresh (e.g., /auth/login failure, or /auth/refresh itself failed and got here,
            // or non-auth URL with a token that's not expired but invalid e.g. revoked)
            toast.error(errorMessage, {
              duration: 5000,
              position: "top-center",
            });
            // If it's a non-auth URL and an access token was present but not considered "expired" by shouldRefreshToken
            // (e.g., token revoked by server but technically not expired by its own clock), sign out.
            if (!configUrl.includes("auth")) {
              const tokens = useAuthStore.getState().tokens;
              if (tokens?.accessToken) {
                try {
                  const decoded: DecodedToken = jwtDecode(tokens.accessToken);
                  if (!(decoded.exp < Date.now() / 1000)) {
                    // Token not expired by client clock
                    useAuthStore.getState().signOut(); // Sign out as token is likely invalid/revoked
                  }
                } catch (decodeError) {
                  console.error(
                    "Failed to decode token during 401 handling:",
                    decodeError
                  );
                  useAuthStore.getState().signOut();
                }
              }
            }
            return Promise.reject(e);
          }
          break; // Break for 401 if not returned/rejected above.

        case 403: // Forbidden
          toast.error(errorMessage, {
            duration: 5000,
            position: "top-center",
          });
          // Sign out if:
          // 1. The refresh token endpoint itself returns 403 (refresh token is invalid/forbidden).
          // 2. It's a non-auth URL, an access token was present, AND that token was expired (shouldRefreshToken would have been true).
          //    This covers cases where a server might misuse 403 for expired tokens.
          if (
            configUrl.includes("/auth/refresh") ||
            (useAuthStore.getState().tokens?.accessToken &&
              shouldRefreshToken(configUrl))
          ) {
            useAuthStore.getState().signOut();
          }
          return Promise.reject(e);

        case 429: // Too Many Requests
          toast.error("Too many requests, please try again later.", {
            duration: 5000,
            position: "top-center",
          });
          return Promise.reject(e);

        default:
          // Other errors (400, 404, 500, etc.)
          toast.error(errorMessage, {
            duration: 5000,
            position: "top-center",
          });
          return Promise.reject(e);
      }
      // Fallback if a switch case doesn't return/reject (should not happen with current structure)
      return Promise.reject(e);
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
