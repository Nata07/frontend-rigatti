import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../../services/api";
import { createFakeJwt } from "../../test/jwt";
import { renderWithProviders } from "../../test/utils";
import { RegisterForm } from "./RegisterForm";

vi.mock("../../services/api", async () => {
  const actual = await vi.importActual<typeof import("../../services/api")>("../../services/api");

  return {
    ...actual,
    api: {
      ...actual.api,
      post: vi.fn(),
    },
  };
});

function authResponse() {
  return {
    token: createFakeJwt({
      userId: "user-123",
      companyId: "company-456",
      role: "user",
    }),
    user: {
      id: "user-123",
      companyId: "company-456",
      name: "Ada",
      email: "ada@example.com",
      role: "user",
      verified: false,
    },
  };
}

describe("RegisterForm", () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset();
  });

  it("validates all required fields", async () => {
    const user = userEvent.setup();

    renderWithProviders(<RegisterForm />);
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Name is required")).toBeInTheDocument();
    expect(await screen.findByText("Email is required")).toBeInTheDocument();
    expect(await screen.findByText("Password is required")).toBeInTheDocument();
    expect(await screen.findByText("Company name is required")).toBeInTheDocument();
  });

  it("validates email format", async () => {
    const user = userEvent.setup();

    renderWithProviders(<RegisterForm />);
    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.type(screen.getByLabelText("Email"), "invalid-email");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Company name"), "Nova");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
  });

  it('shows a "check your email" message after a successful registration', async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: authResponse() });
    const user = userEvent.setup();

    renderWithProviders(<RegisterForm />);
    await user.type(screen.getByLabelText("Name"), "Ada");
    await user.type(screen.getByLabelText("Email"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "password123");
    await user.type(screen.getByLabelText("Company name"), "Nova");
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(vi.mocked(api.post)).toHaveBeenCalledWith("/auth/register", {
      name: "Ada",
      email: "ada@example.com",
      password: "password123",
      companyName: "Nova",
    });
    expect(await screen.findByText("Check your email to verify your account.")).toBeInTheDocument();
    expect(await screen.findByText(/We sent a verification link to/i)).toBeInTheDocument();
  });
});
