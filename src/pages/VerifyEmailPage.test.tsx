import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { verifyEmail } from "../services/authService";
import { renderWithProviders } from "../test/utils";
import { VerifyEmailPage } from "./VerifyEmailPage";

vi.mock("../services/authService", async () => {
  const actual = await vi.importActual<typeof import("../services/authService")>(
    "../services/authService",
  );

  return {
    ...actual,
    verifyEmail: vi.fn(),
  };
});

describe("VerifyEmailPage", () => {
  it("renders a missing-token error when the URL has no token", async () => {
    renderWithProviders(<VerifyEmailPage />, { initialEntries: ["/verify-email"] });

    expect(
      await screen.findByText("This verification link is missing a token. Request a new verification email."),
    ).toBeInTheDocument();
  });

  it("verifies the token from the URL and shows a success message", async () => {
    vi.mocked(verifyEmail).mockResolvedValueOnce({
      message: "Email verified",
    });

    renderWithProviders(<VerifyEmailPage />, {
      initialEntries: ["/verify-email?token=verify-token-123"],
    });

    expect(await screen.findByText("Email verified. Redirecting you to sign in...")).toBeInTheDocument();
    expect(verifyEmail).toHaveBeenCalledWith("verify-token-123");
  });
});
