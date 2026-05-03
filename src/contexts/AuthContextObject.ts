import { createContext } from "react";

import type { RegisterData, User } from "../types/auth";

interface AuthState {
  token: string | null;
  user: User | null;
}

export interface AuthContextType extends AuthState {
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  markEmailVerified: () => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
