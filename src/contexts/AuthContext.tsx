import { useQueryClient } from "@tanstack/react-query";
import { jwtDecode } from "jwt-decode";
import { useState, type PropsWithChildren } from "react";

import { AuthContext, type AuthContextType } from "./AuthContextObject";
import { login as loginRequest, register as registerRequest } from "../services/authService";
import {
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
} from "../services/storage";
import type { AuthResponse, RegisterData, User } from "../types/auth";

interface TokenClaims {
  userId: string;
  companyId: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
}

function decodeToken(token: string): TokenClaims | null {
  try {
    return jwtDecode<TokenClaims>(token);
  } catch {
    return null;
  }
}

function buildUser(token: string, fallbackUser: User | null): User | null {
  const claims = decodeToken(token);

  if (!claims) {
    return null;
  }

  return {
    id: claims.userId,
    companyId: claims.companyId,
    role: claims.role,
    name: fallbackUser?.name ?? "",
    email: fallbackUser?.email ?? "",
    verified: fallbackUser?.verified ?? true,
  };
}

function readInitialState(): AuthState {
  const session = readAuthSession();

  if (!session) {
    return { token: null, user: null };
  }

  const user = buildUser(session.token, session.user);

  if (!user) {
    clearAuthSession();
    return { token: null, user: null };
  }

  return {
    token: session.token,
    user,
  };
}

function persistSession(result: AuthResponse): AuthState {
  const user = buildUser(result.token, result.user);

  if (!user) {
    throw new Error("Invalid authentication token");
  }

  const normalizedUser = {
    ...result.user,
    id: user.id,
    companyId: user.companyId,
    role: user.role,
  };

  writeAuthSession({
    token: result.token,
    user: normalizedUser,
  });

  return {
    token: result.token,
    user: normalizedUser,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>(() => readInitialState());

  async function login(email: string, password: string) {
    queryClient.clear();
    setState(persistSession(await loginRequest(email, password)));
  }

  async function register(data: RegisterData) {
    queryClient.clear();
    await registerRequest(data);
  }

  function markEmailVerified() {
    setState((currentState) => {
      if (!currentState.user || currentState.user.verified) {
        return currentState;
      }

      const nextState = {
        ...currentState,
        user: {
          ...currentState.user,
          verified: true,
        },
      };

      writeAuthSession({
        token: nextState.token!,
        user: nextState.user,
      });

      return nextState;
    });
  }

  function logout() {
    clearAuthSession();
    queryClient.clear();
    setState({
      token: null,
      user: null,
    });
  }

  const value: AuthContextType = {
    token: state.token,
    user: state.user,
    isAuthenticated: Boolean(state.token && state.user),
    login,
    register,
    markEmailVerified,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
