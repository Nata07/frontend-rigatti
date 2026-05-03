import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  forgotPassword,
  login,
  MIN_PASSWORD_LENGTH,
  register,
  resendVerification,
  resetPassword,
  validatePasswordStrength,
  verifyEmail,
} from "./authService";
import { api } from "./api";

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");

  return {
    ...actual,
    api: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("validates password strength rules in order", () => {
    expect(validatePasswordStrength("")).toBe("Password is required");
    expect(validatePasswordStrength("Ab1")).toBe(
      `Password must contain at least ${MIN_PASSWORD_LENGTH} characters`,
    );
    expect(validatePasswordStrength("PASSWORD1")).toBe(
      "Password must include at least one lowercase letter",
    );
    expect(validatePasswordStrength("password1")).toBe(
      "Password must include at least one uppercase letter",
    );
    expect(validatePasswordStrength("Password")).toBe(
      "Password must include at least one number",
    );
    expect(validatePasswordStrength("Password1")).toBeNull();
  });

  it("posts login credentials and returns the API payload", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { token: "token-1" } });

    await expect(login("ada@example.com", "Password1")).resolves.toEqual({ token: "token-1" });
    expect(api.post).toHaveBeenCalledWith("/auth/login", {
      email: "ada@example.com",
      password: "Password1",
    });
  });

  it("posts registration data", async () => {
    const payload = {
      name: "Ada",
      email: "ada@example.com",
      password: "Password1",
      companyName: "Analytical Engines",
    };
    vi.mocked(api.post).mockResolvedValueOnce({ data: { token: "token-2" } });

    await register(payload);

    expect(api.post).toHaveBeenCalledWith("/auth/register", payload);
  });

  it("posts the forgot-password email", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: "If account exists, reset email sent" },
    });

    await forgotPassword("ada@example.com");

    expect(api.post).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "ada@example.com",
    });
  });

  it("posts the reset-password payload", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: "Password reset successful" },
    });

    await resetPassword("reset-token", "NewPassword1");

    expect(api.post).toHaveBeenCalledWith("/auth/reset-password", {
      token: "reset-token",
      password: "NewPassword1",
    });
  });

  it("requests email verification with a query-string token", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { message: "Email verified" } });

    await verifyEmail("verify-token");

    expect(api.get).toHaveBeenCalledWith("/auth/verify-email", {
      params: { token: "verify-token" },
    });
  });

  it("posts resend-verification email requests", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { message: "Verification email sent" },
    });

    await resendVerification("ada@example.com");

    expect(api.post).toHaveBeenCalledWith("/auth/resend-verification", {
      email: "ada@example.com",
    });
  });
});
