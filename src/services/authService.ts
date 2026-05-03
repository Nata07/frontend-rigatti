import { api } from "./api";
import type { AuthResponse, RegisterData } from "../types/auth";

export const MIN_PASSWORD_LENGTH = 8;

export function validatePasswordStrength(password: string) {
  if (!password.trim()) {
    return "Password is required";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must contain at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter";
  }

  if (!/\d/.test(password)) {
    return "Password must include at least one number";
  }

  return null;
}

export async function login(email: string, password: string) {
  const response = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });

  return response.data;
}

export async function register(data: RegisterData) {
  const response = await api.post<AuthResponse>("/auth/register", data);

  return response.data;
}

export async function forgotPassword(email: string) {
  const response = await api.post<{ message: string }>("/auth/forgot-password", {
    email,
  });

  return response.data;
}

export async function resetPassword(token: string, password: string) {
  const response = await api.post<{ message: string }>("/auth/reset-password", {
    token,
    password,
  });

  return response.data;
}

export async function verifyEmail(token: string) {
  const response = await api.get<{ message: string }>("/auth/verify-email", {
    params: { token },
  });

  return response.data;
}

export async function resendVerification(email: string) {
  const response = await api.post<{ message: string }>("/auth/resend-verification", {
    email,
  });

  return response.data;
}
