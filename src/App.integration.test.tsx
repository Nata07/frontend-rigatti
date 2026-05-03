import { screen, waitFor } from "@testing-library/react";
import { AxiosHeaders } from "axios";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "./services/api";
import { AUTH_STORAGE_KEY } from "./services/storage";
import { createFakeJwt } from "./test/jwt";
import { renderWithProviders } from "./test/utils";
import App from "./App";

vi.mock("./services/api", async () => {
  const actual = await vi.importActual<typeof import("./services/api")>("./services/api");

  return {
    ...actual,
    api: {
      ...actual.api,
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

function authResponse(overrides?: Partial<{ name: string; email: string; role: string }>) {
  return {
    token: createFakeJwt({
      userId: "user-123",
      companyId: "company-456",
      role: overrides?.role ?? "admin",
    }),
    user: {
      id: "server-user-id",
      companyId: "server-company-id",
      name: overrides?.name ?? "Ada Lovelace",
      email: overrides?.email ?? "ada@example.com",
      role: overrides?.role ?? "admin",
      verified: true,
    },
  };
}

const emptyConversation = {
  _id: "conversation-1",
  userId: "user-123",
  companyId: "company-456",
  createdAt: "2026-04-29T10:00:00.000Z",
  updatedAt: "2026-04-29T10:00:00.000Z",
  messages: [],
};

function mockDashboardMountRequests() {
  vi.mocked(api.get).mockImplementation(async (url) => {
    if (url === "/products") {
      return { data: [] };
    }

    if (url === "/chat") {
      return { data: emptyConversation };
    }

    throw new Error(`Unexpected GET ${url}`);
  });
}

describe("authentication app flow", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
  });

  it("stores the token and redirects on valid login", async () => {
    mockDashboardMountRequests();
    vi.mocked(api.post).mockResolvedValueOnce({ data: authResponse() });
    const user = userEvent.setup();

    renderWithProviders(<App />);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByRole("heading", { name: "Company inventory" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toContain("user-123");
  });

  it("shows an error when login credentials are invalid", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          message: "Invalid email or password",
        },
      },
    });
    const user = userEvent.setup();

    renderWithProviders(<App />);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "wrongpass");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
  });

  it('creates an account and shows the "check your email" state on valid registration', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: authResponse({ role: "user" }) });
    const user = userEvent.setup();

    renderWithProviders(<App />, { initialEntries: ["/register"] });
    await user.type(screen.getByLabelText("Name"), "Grace Hopper");
    await user.type(screen.getByLabelText("Email"), "grace@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Company name"), "Nova");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Check your email to verify your account.")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Company inventory" })).not.toBeInTheDocument();
  });

  it("shows an error when registration uses a duplicated email", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          message: "Email already in use",
        },
      },
    });
    const user = userEvent.setup();

    renderWithProviders(<App />, { initialEntries: ["/register"] });
    await user.type(screen.getByLabelText("Name"), "Grace Hopper");
    await user.type(screen.getByLabelText("Email"), "grace@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Company name"), "Nova");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Email already in use")).toBeInTheDocument();
  });

  it("submits forgot password requests and shows the success message", async () => {
    vi.mocked(api.post).mockImplementation(async (url) => {
      if (url === "/auth/forgot-password") {
        return {
          data: {
            message: "If account exists, reset email sent",
          },
        };
      }

      throw new Error(`Unexpected POST ${url}`);
    });
    const user = userEvent.setup();

    renderWithProviders(<App />, { initialEntries: ["/forgot-password"] });
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(vi.mocked(api.post)).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "ada@example.com",
    });
    expect(await screen.findByText(/Check your email for a password reset link/i)).toBeInTheDocument();
  });

  it("resets the password with the token from the URL and redirects to login", async () => {
    vi.mocked(api.post).mockImplementation(async (url) => {
      if (url === "/auth/reset-password") {
        return {
          data: {
            message: "Password reset successful",
          },
        };
      }

      throw new Error(`Unexpected POST ${url}`);
    });
    const user = userEvent.setup();

    renderWithProviders(<App />, { initialEntries: ["/reset-password?token=reset-token-123"] });
    await user.type(screen.getByLabelText("New password"), "NewPassword1");
    await user.type(screen.getByLabelText("Confirm new password"), "NewPassword1");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(vi.mocked(api.post)).toHaveBeenCalledWith("/auth/reset-password", {
      token: "reset-token-123",
      password: "NewPassword1",
    });
    expect(await screen.findByText("Password updated. Redirecting you to sign in...")).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: "Sign in" }, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Password updated. Sign in with your new password."),
    ).toBeInTheDocument();
  }, 10000);

  it("shows reset password errors from the API", async () => {
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          message: "Invalid or expired password reset token",
        },
      },
    });
    const user = userEvent.setup();

    renderWithProviders(<App />, { initialEntries: ["/reset-password?token=expired-token"] });
    await user.type(screen.getByLabelText("New password"), "NewPassword1");
    await user.type(screen.getByLabelText("Confirm new password"), "NewPassword1");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(
      await screen.findByText("Invalid or expired password reset token"),
    ).toBeInTheDocument();
  });

  it("verifies the email token from the URL and redirects to sign in", async () => {
    vi.mocked(api.get).mockImplementation(async (url, config) => {
      if (url === "/auth/verify-email") {
        expect(config).toEqual({
          params: {
            token: "verify-token-123",
          },
        });

        return {
          data: {
            message: "Email verified",
          },
        };
      }

      throw new Error(`Unexpected GET ${url}`);
    });

    renderWithProviders(<App />, { initialEntries: ["/verify-email?token=verify-token-123"] });

    expect(await screen.findByText("Email verified. Redirecting you to sign in...")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { name: "Sign in" }, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Email verified. Sign in to continue to your dashboard.")).toBeInTheDocument();
  }, 10000);

  it("shows verification errors from the API", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      response: {
        data: {
          message: "Verification token expired",
        },
      },
    });

    renderWithProviders(<App />, { initialEntries: ["/verify-email?token=expired-token"] });

    expect(await screen.findByText("Verification token expired")).toBeInTheDocument();
  });

  it("redirects unauthenticated users away from protected routes", async () => {
    renderWithProviders(<App />, { initialEntries: ["/dashboard"] });

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });

  it("allows authenticated users to access protected routes", async () => {
    mockDashboardMountRequests();
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: authResponse().token,
        user: authResponse().user,
      }),
    );

    renderWithProviders(<App />, { initialEntries: ["/dashboard"] });

    expect(
      await screen.findByRole("heading", { name: "Company inventory" }),
    ).toBeInTheDocument();
  });

  it("includes the Authorization header for authenticated requests", async () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: authResponse().token,
        user: authResponse().user,
      }),
    );

    const interceptor = api.interceptors.request.handlers![0]!;
    const config = await interceptor.fulfilled({
      headers: new AxiosHeaders(),
    });
    const authorizationHeader = String(config.headers.get("Authorization"));

    expect(authorizationHeader).toContain("Bearer ");
    expect(authorizationHeader).toContain(".signature");
  });

  it("clears the token and redirects to login on logout", async () => {
    mockDashboardMountRequests();
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: authResponse().token,
        user: authResponse().user,
      }),
    );
    const user = userEvent.setup();

    renderWithProviders(<App />, { initialEntries: ["/dashboard"] });
    await user.click(await screen.findByRole("button", { name: "Logout" }));

    await waitFor(() => {
      expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
  });
});
