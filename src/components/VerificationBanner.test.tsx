import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { resendVerification } from "../services/authService";
import { renderWithProviders } from "../test/utils";
import type { User } from "../types/auth";
import { VerificationBanner } from "./VerificationBanner";

vi.mock("../services/authService", async () => {
  const actual = await vi.importActual<typeof import("../services/authService")>(
    "../services/authService",
  );

  return {
    ...actual,
    resendVerification: vi.fn(),
  };
});

const baseUser: User = {
  id: "user-1",
  companyId: "company-1",
  name: "Grace Hopper",
  email: "grace@example.com",
  role: "user",
  verified: false,
};

describe("VerificationBanner", () => {
  beforeEach(() => {
    vi.mocked(resendVerification).mockReset();
  });

  it("renders for unverified users", () => {
    renderWithProviders(<VerificationBanner user={baseUser} />);

    expect(screen.getByRole("heading", { name: /verify your email/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend Email" })).toBeInTheDocument();
  });

  it("does not render for verified users", () => {
    renderWithProviders(<VerificationBanner user={{ ...baseUser, verified: true }} />);

    expect(screen.queryByTestId("verification-banner")).not.toBeInTheDocument();
  });

  it("resends the verification email and shows success feedback", async () => {
    vi.mocked(resendVerification).mockResolvedValueOnce({
      message: "Verification email sent",
    });
    const user = userEvent.setup();

    renderWithProviders(<VerificationBanner user={baseUser} />);
    await user.click(screen.getByRole("button", { name: "Resend Email" }));

    expect(resendVerification).toHaveBeenCalledWith("grace@example.com");
    expect(await screen.findByText("Verification email sent")).toBeInTheDocument();
  });

  it("handles resend rate limits gracefully", async () => {
    vi.mocked(resendVerification).mockRejectedValueOnce({
      response: {
        status: 429,
        data: {
          message: "Too many requests",
        },
      },
      isAxiosError: true,
    });
    const user = userEvent.setup();

    renderWithProviders(<VerificationBanner user={baseUser} />);
    await user.click(screen.getByRole("button", { name: "Resend Email" }));

    expect(
      await screen.findByText(
        "Too many verification emails requested. Please wait a moment before trying again.",
      ),
    ).toBeInTheDocument();
  });
});
