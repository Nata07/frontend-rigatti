import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PropsWithChildren, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { api } from "../services/api";
import { AUTH_STORAGE_KEY } from "../services/storage";
import { createFakeJwt } from "../test/jwt";
import { AuthProvider } from "./AuthContext";
import { useAuth } from "./useAuth";

vi.mock("../services/api", async () => {
  const actual = await vi.importActual<typeof import("../services/api")>("../services/api");

  return {
    ...actual,
    api: {
      post: vi.fn(),
    },
  };
});

function buildResponse() {
  return {
    token: createFakeJwt({
      userId: "user-123",
      companyId: "company-456",
      role: "admin",
    }),
    user: {
      id: "ignored-from-response",
      companyId: "ignored-company",
      name: "Ada Lovelace",
      email: "ada@example.com",
      role: "user",
      verified: false,
    },
  };
}

function renderAuthTest(children: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children: nestedChildren }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{nestedChildren}</AuthProvider>
      </QueryClientProvider>
    );
  }

  return render(children, { wrapper: Wrapper });
}

function LoginHarness() {
  const { login } = useAuth();

  return (
    <button onClick={() => login("ada@example.com", "password123")} type="button">
      Login
    </button>
  );
}

function LogoutHarness() {
  const { logout } = useAuth();

  return (
    <button onClick={() => logout()} type="button">
      Logout
    </button>
  );
}

function AuthStateHarness() {
  const { isAuthenticated, user } = useAuth();

  return (
    <>
      <span>{isAuthenticated ? "authenticated" : "anonymous"}</span>
      <span>{user?.id ?? "no-user"}</span>
      <span>{user?.companyId ?? "no-company"}</span>
      <span>{user?.role ?? "no-role"}</span>
      <span>{user?.name ?? "no-name"}</span>
    </>
  );
}

describe("AuthContext", () => {
  it("stores the token in localStorage after login", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: buildResponse() });

    renderAuthTest(<LoginHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toContain("user-123");
    });
  });

  it("removes the token from localStorage on logout", () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: buildResponse().token,
        user: buildResponse().user,
      }),
    );

    renderAuthTest(<LogoutHarness />);
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("decodes the JWT and extracts user info", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: buildResponse() });

    renderAuthTest(
      <>
        <LoginHarness />
        <AuthStateHarness />
      </>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByText("user-123")).toBeInTheDocument();
      expect(screen.getByText("company-456")).toBeInTheDocument();
      expect(screen.getByText("admin")).toBeInTheDocument();
      expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    });
  });

  it("returns true for isAuthenticated when a valid token is present", () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: buildResponse().token,
        user: buildResponse().user,
      }),
    );

    renderAuthTest(<AuthStateHarness />);

    expect(screen.getByText("authenticated")).toBeInTheDocument();
  });

  it("returns false for isAuthenticated when token is absent", () => {
    renderAuthTest(<AuthStateHarness />);

    expect(screen.getByText("anonymous")).toBeInTheDocument();
  });

  it("clears invalid stored tokens during bootstrap", () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: "not-a-jwt",
        user: buildResponse().user,
      }),
    );

    renderAuthTest(<AuthStateHarness />);

    expect(screen.getByText("anonymous")).toBeInTheDocument();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
