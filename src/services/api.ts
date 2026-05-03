import axios from "axios";

import { AUTH_STORAGE_KEY } from "./storage";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001/api",
});

api.interceptors.request.use((config) => {
  const rawValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawValue) {
    return config;
  }

  try {
    const session = JSON.parse(rawValue) as { token?: string };

    if (session.token) {
      config.headers.set("Authorization", `Bearer ${session.token}`);
    }
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  return config;
});

export function extractApiErrorMessage(error: unknown, fallbackMessage: string) {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      fallbackMessage
    );
  }

  if (typeof error === "object" && error !== null) {
    const genericError = error as {
      response?: {
        data?: {
          error?: { message?: string };
          message?: string;
        };
      };
    };

    const responseMessage =
      genericError.response?.data?.error?.message ?? genericError.response?.data?.message;

    if (responseMessage) {
      return responseMessage;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
