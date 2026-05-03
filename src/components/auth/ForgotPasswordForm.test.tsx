import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/utils";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

vi.mock("../../services/authService", () => ({
  forgotPassword: vi.fn(),
}));

describe("ForgotPasswordForm", () => {
  it("renders the email field and submit action", () => {
    renderWithProviders(<ForgotPasswordForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeInTheDocument();
  });

  it("validates that a valid email is required", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ForgotPasswordForm />);
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
  });
});
