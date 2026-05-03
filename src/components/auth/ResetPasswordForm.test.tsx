import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/utils";
import { ResetPasswordForm } from "./ResetPasswordForm";

vi.mock("../../services/authService", () => ({
  resetPassword: vi.fn(),
  validatePasswordStrength: vi.fn((password: string) => {
    if (password.length < 8) {
      return "Password must contain at least 8 characters";
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
  }),
}));

describe("ResetPasswordForm", () => {
  it("renders the password and confirmation inputs", () => {
    renderWithProviders(<ResetPasswordForm token="token-123" />);

    expect(screen.getByLabelText("New password")).toBeInTheDocument();
    expect(screen.getByLabelText("Confirm new password")).toBeInTheDocument();
  });

  it("validates password strength", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ResetPasswordForm token="token-123" />);
    await user.type(screen.getByLabelText("New password"), "weak");
    await user.type(screen.getByLabelText("Confirm new password"), "weak");
    await user.click(screen.getByRole("button", { name: "Reset password" }));

    expect(
      await screen.findByText("Password must contain at least 8 characters"),
    ).toBeInTheDocument();
  });

  it("shows helpful error messages", async () => {
    renderWithProviders(<ResetPasswordForm token={null} />);

    expect(
      screen.getByText("This password reset link is missing a token. Request a new email."),
    ).toBeInTheDocument();
  });
});
