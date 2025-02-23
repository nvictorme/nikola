import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  RawAxiosRequestHeaders,
} from "axios";
import { attachInterceptors } from "./api.interceptors";
import { useAuthStore } from "../store/auth.store";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export class ApiClient {
  axiosInstance: AxiosInstance;
  headers: RawAxiosRequestHeaders;

  constructor() {
    const tokens = useAuthStore.getState().tokens;
    this.headers = {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${tokens?.accessToken ?? ""}`,
    };
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      headers: this.headers,
    });
    attachInterceptors(this.axiosInstance);
  }

  get<T>(url: string, params: T) {
    const config: AxiosRequestConfig = {
      url: `${API_BASE_URL}${url}`,
      method: "GET",
      params,
    };
    return this.request(config);
  }

  post<T>(url: string, data: T) {
    const config: AxiosRequestConfig = {
      url: `${API_BASE_URL}${url}`,
      method: "POST",
      data,
    };
    return this.request(config);
  }

  put<T>(url: string, data: T) {
    const config: AxiosRequestConfig = {
      url: `${API_BASE_URL}${url}`,
      method: "PUT",
      data,
    };
    return this.request(config);
  }

  delete<T>(url: string, params: T) {
    const config: AxiosRequestConfig = {
      url: `${API_BASE_URL}${url}`,
      method: "DELETE",
      params,
    };
    return this.request(config);
  }

  request(config: AxiosRequestConfig) {
    return this.axiosInstance.request(config);
  }
}
