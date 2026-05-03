import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "../../test/utils";
import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
  it("validates that email is required", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginForm />);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Email is required")).toBeInTheDocument();
  });

  it("validates that password is required", async () => {
    const user = userEvent.setup();

    renderWithProviders(<LoginForm />);
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Password is required")).toBeInTheDocument();
  });

  it("shows the forgot password link", () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });
});
