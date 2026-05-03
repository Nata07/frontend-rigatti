import { readFileSync } from "node:fs";

import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { api } from "../services/api";
import { AUTH_STORAGE_KEY } from "../services/storage";
import { createFakeJwt } from "../test/jwt";
import { renderWithProviders } from "../test/utils";
import App from "../App";

const appCss = readFileSync("src/App.css", "utf8");

vi.mock("../services/api", async () => {
  const actual = await vi.importActual<typeof import("../services/api")>("../services/api");

  return {
    ...actual,
    api: {
      ...actual.api,
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  };
});

const baseProduct = {
  _id: "product-1",
  name: "Aurora Lamp",
  description: "Hand-finished desk lamp with warm brass details.",
  price: 149.9,
  category: "lighting",
  imageUrl: "https://example.com/lamp.jpg",
};

const emptyConversation = {
  _id: "conversation-1",
  userId: "user-123",
  companyId: "company-456",
  createdAt: "2026-04-29T10:00:00.000Z",
  updatedAt: "2026-04-29T10:00:00.000Z",
  messages: [],
};

function createConversation(
  messages: Array<{ role: "user" | "assistant"; content: string; createdAt: string }>,
) {
  return {
    ...emptyConversation,
    updatedAt: messages[messages.length - 1]?.createdAt ?? emptyConversation.updatedAt,
    messages,
  };
}

function mockDashboardRequests({
  productResponses = [[baseProduct]],
  conversation = emptyConversation,
}: {
  productResponses?: unknown[];
  conversation?: unknown;
} = {}) {
  const queuedProducts = [...productResponses];

  vi.mocked(api.get).mockImplementation(async (url) => {
    if (url === "/products") {
      return {
        data: queuedProducts.length > 1 ? queuedProducts.shift() : queuedProducts[0] ?? [],
      };
    }

    if (url === "/chat") {
      return { data: conversation };
    }

    throw new Error(`Unexpected GET ${url}`);
  });
}

function setAuth(role: "admin" | "user", verified = true) {
  window.localStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({
      token: createFakeJwt({
        userId: "user-123",
        companyId: "company-456",
        role,
      }),
      user: {
        id: "server-user-id",
        companyId: "company-456",
        name: role === "admin" ? "Ada Lovelace" : "Grace Hopper",
        email: role === "admin" ? "ada@example.com" : "grace@example.com",
        role,
        verified,
      },
    }),
  );
}

async function renderDashboard(role: "admin" | "user" = "admin", verified = true) {
  setAuth(role, verified);
  const view = renderWithProviders(<App />, { initialEntries: ["/dashboard"] });
  await screen.findByRole("heading", { name: "Company inventory" });
  return view;
}

describe("DashboardPage integration", () => {
  beforeEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.put).mockReset();
    vi.mocked(api.delete).mockReset();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("loads products from the backend via React Query", async () => {
    mockDashboardRequests();

    await renderDashboard();

    expect(await screen.findByText("Aurora Lamp")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/products");
  });

  it("allows an admin to create a product via the form", async () => {
    mockDashboardRequests({
      productResponses: [
        [baseProduct],
        [
          baseProduct,
          {
            _id: "product-2",
            name: "Nimbus Chair",
            description: "Ergonomic lounge chair with wool upholstery.",
            price: 320,
            category: "furniture",
            imageUrl: "",
          },
        ],
      ],
    });
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        _id: "product-2",
        name: "Nimbus Chair",
        description: "Ergonomic lounge chair with wool upholstery.",
        price: 320,
        category: "furniture",
        imageUrl: "",
      },
    });
    const user = userEvent.setup();

    await renderDashboard();
    await user.click(screen.getByRole("button", { name: "New Product" }));
    await user.type(screen.getByLabelText("Name"), "Nimbus Chair");
    await user.type(
      screen.getByLabelText("Description"),
      "Ergonomic lounge chair with wool upholstery.",
    );
    await user.type(screen.getByLabelText("Price"), "320");
    await user.type(screen.getByLabelText("Category"), "furniture");
    await user.click(screen.getByRole("button", { name: "Create product" }));

    await screen.findByText("Nimbus Chair");
    expect(api.post).toHaveBeenCalledWith("/products", {
      name: "Nimbus Chair",
      description: "Ergonomic lounge chair with wool upholstery.",
      price: 320,
      category: "furniture",
      imageUrl: undefined,
    });
  });

  it("allows an admin to edit an existing product", async () => {
    mockDashboardRequests({
      productResponses: [[baseProduct], [{ ...baseProduct, name: "Aurora Lamp Pro", price: 199.9 }]],
    });
    vi.mocked(api.put).mockResolvedValueOnce({
      data: { ...baseProduct, name: "Aurora Lamp Pro", price: 199.9 },
    });
    const user = userEvent.setup();

    await renderDashboard();
    await screen.findByText("Aurora Lamp");
    await user.click(screen.getByRole("button", { name: "Edit" }));
    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);
    await user.type(nameInput, "Aurora Lamp Pro");
    const priceInput = screen.getByLabelText("Price");
    await user.clear(priceInput);
    await user.type(priceInput, "199.9");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    await screen.findByText("Aurora Lamp Pro");
    expect(api.put).toHaveBeenCalledWith("/products/product-1", {
      name: "Aurora Lamp Pro",
      description: "Hand-finished desk lamp with warm brass details.",
      price: 199.9,
      category: "lighting",
      imageUrl: "https://example.com/lamp.jpg",
    });
  });

  it("allows an admin to delete a product after confirmation", async () => {
    mockDashboardRequests({
      productResponses: [[baseProduct], []],
    });
    vi.mocked(api.delete).mockResolvedValueOnce({ data: undefined });
    const user = userEvent.setup();

    await renderDashboard();
    await screen.findByText("Aurora Lamp");
    await user.click(screen.getByRole("button", { name: "Delete" }));

    await screen.findByText("No products yet. Add one to start the catalog.");
    expect(window.confirm).toHaveBeenCalledWith('Delete "Aurora Lamp" from the catalog?');
    expect(api.delete).toHaveBeenCalledWith("/products/product-1");
  });

  it("hides CRUD buttons for regular users", async () => {
    mockDashboardRequests();

    await renderDashboard("user");

    expect(screen.queryByRole("button", { name: "New Product" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();
  });

  it("shows the verification banner for unverified users and resends the email", async () => {
    mockDashboardRequests();
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        message: "Verification email sent",
      },
    });
    const user = userEvent.setup();

    await renderDashboard("user", false);
    expect(await screen.findByTestId("verification-banner")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Resend Email" }));

    expect(api.post).toHaveBeenCalledWith("/auth/resend-verification", {
      email: "grace@example.com",
    });
    expect(await screen.findByText("Verification email sent")).toBeInTheDocument();
  });

  it("refreshes the product list after create, update, and delete", async () => {
    mockDashboardRequests({
      productResponses: [
        [baseProduct],
        [
          baseProduct,
          {
            _id: "product-2",
            name: "Nimbus Chair",
            description: "Ergonomic lounge chair with wool upholstery.",
            price: 320,
            category: "furniture",
          },
        ],
        [
          { ...baseProduct, name: "Aurora Lamp Pro" },
          {
            _id: "product-2",
            name: "Nimbus Chair",
            description: "Ergonomic lounge chair with wool upholstery.",
            price: 320,
            category: "furniture",
          },
        ],
        [
          {
            _id: "product-2",
            name: "Nimbus Chair",
            description: "Ergonomic lounge chair with wool upholstery.",
            price: 320,
            category: "furniture",
          },
        ],
      ],
    });
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        _id: "product-2",
        name: "Nimbus Chair",
        description: "Ergonomic lounge chair with wool upholstery.",
        price: 320,
        category: "furniture",
      },
    });
    vi.mocked(api.put).mockResolvedValueOnce({
      data: { ...baseProduct, name: "Aurora Lamp Pro" },
    });
    vi.mocked(api.delete).mockResolvedValueOnce({ data: undefined });
    const user = userEvent.setup();

    await renderDashboard();

    await user.click(screen.getByRole("button", { name: "New Product" }));
    await user.type(screen.getByLabelText("Name"), "Nimbus Chair");
    await user.type(
      screen.getByLabelText("Description"),
      "Ergonomic lounge chair with wool upholstery.",
    );
    await user.type(screen.getByLabelText("Price"), "320");
    await user.type(screen.getByLabelText("Category"), "furniture");
    await user.click(screen.getByRole("button", { name: "Create product" }));
    await screen.findByText("Nimbus Chair");

    const editButtons = await screen.findAllByRole("button", { name: "Edit" });
    await user.click(editButtons[0]);
    const editNameInput = screen.getByLabelText("Name");
    await user.clear(editNameInput);
    await user.type(editNameInput, "Aurora Lamp Pro");
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await screen.findByText("Aurora Lamp Pro");

    const cards = screen.getAllByRole("article");
    const auroraCard = cards.find((card) => within(card).queryByText("Aurora Lamp Pro"));

    expect(auroraCard).toBeDefined();

    await user.click(within(auroraCard!).getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(screen.queryByText("Aurora Lamp Pro")).not.toBeInTheDocument();
    });

    expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === "/products")).toHaveLength(4);
  });

  it("shows an API error to the user", async () => {
    vi.mocked(api.get).mockImplementation(async (url) => {
      if (url === "/products") {
        throw {
          response: {
            data: {
              message: "Catalog service unavailable",
            },
          },
        };
      }

      if (url === "/chat") {
        return { data: emptyConversation };
      }

      throw new Error(`Unexpected GET ${url}`);
    });

    await renderDashboard();

    expect(await screen.findByRole("alert")).toHaveTextContent("Catalog service unavailable");
  });

  it("loads conversation history on mount", async () => {
    mockDashboardRequests({
      conversation: createConversation([
        {
          role: "user",
          content: "Do we have desk lamps?",
          createdAt: "2026-04-29T10:00:00.000Z",
        },
        {
          role: "assistant",
          content: "Yes. Aurora Lamp is available in lighting.",
          createdAt: "2026-04-29T10:00:03.000Z",
        },
      ]),
    });

    await renderDashboard();

    expect(await screen.findByText("Do we have desk lamps?")).toBeInTheDocument();
    expect(await screen.findByText("Yes. Aurora Lamp is available in lighting.")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/chat");
  });

  it("sends a message, shows loading, and renders the assistant response", async () => {
    mockDashboardRequests();
    const user = userEvent.setup();

    let resolveChatResponse: (() => void) | undefined;
    vi.mocked(api.post).mockImplementation(
      (async (url, payload) => {
        if (url !== "/chat") {
          throw new Error(`Unexpected POST ${url}`);
        }

        expect(payload).toEqual({ message: "Show lighting products" });

        return new Promise<{
          data: {
            conversation: ReturnType<typeof createConversation>;
            assistantMessage: {
              role: "assistant";
              content: string;
              createdAt: string;
            };
          };
        }>((resolve) => {
          resolveChatResponse = () =>
            resolve({
              data: {
                conversation: createConversation([
                  {
                    role: "user",
                    content: "Show lighting products",
                    createdAt: "2026-04-29T10:10:00.000Z",
                  },
                  {
                    role: "assistant",
                    content: "Aurora Lamp is the current lighting option.",
                    createdAt: "2026-04-29T10:10:04.000Z",
                  },
                ]),
                assistantMessage: {
                  role: "assistant",
                  content: "Aurora Lamp is the current lighting option.",
                  createdAt: "2026-04-29T10:10:04.000Z",
                },
              },
            });
        });
      }) as typeof api.post,
    );

    await renderDashboard();
    await user.type(screen.getByLabelText("Message"), "Show lighting products");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(
      await within(screen.getByTestId("message-list")).findByText("Show lighting products"),
    ).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Assistant is responding" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();

    resolveChatResponse?.();

    expect(await screen.findByText("Aurora Lamp is the current lighting option.")).toBeInTheDocument();
  });

  it("shows an API error when sending a chat message fails", async () => {
    mockDashboardRequests();
    vi.mocked(api.post).mockRejectedValueOnce({
      response: {
        data: {
          message: "Assistant service unavailable",
        },
      },
    });
    const user = userEvent.setup();

    await renderDashboard();
    await user.type(screen.getByLabelText("Message"), "Need recommendations");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Assistant service unavailable");
  });

  it("persists the collapsed state after a reload", async () => {
    mockDashboardRequests();
    const user = userEvent.setup();

    const view = await renderDashboard();
    await user.click(screen.getByRole("button", { name: "Collapse chat panel" }));
    expect(screen.getByRole("button", { name: "Open chat panel" })).toBeInTheDocument();

    view.unmount();
    mockDashboardRequests();
    await renderDashboard();

    expect(screen.getByRole("button", { name: "Open chat panel" })).toBeInTheDocument();
  });

  it("keeps conversation history visible after a reload", async () => {
    mockDashboardRequests({
      conversation: createConversation([
        {
          role: "assistant",
          content: "Aurora Lamp is available.",
          createdAt: "2026-04-29T11:00:00.000Z",
        },
      ]),
    });

    const firstRender = await renderDashboard();
    expect(await screen.findByText("Aurora Lamp is available.")).toBeInTheDocument();

    firstRender.unmount();
    mockDashboardRequests({
      conversation: createConversation([
        {
          role: "assistant",
          content: "Aurora Lamp is available.",
          createdAt: "2026-04-29T11:00:00.000Z",
        },
      ]),
    });
    await renderDashboard();

    expect(await screen.findByText("Aurora Lamp is available.")).toBeInTheDocument();
  });

  it("keeps the grid responsive on mobile and desktop widths", async () => {
    mockDashboardRequests();

    await renderDashboard();
    await screen.findByText("Aurora Lamp");
    expect(screen.getByTestId("product-grid")).toBeInTheDocument();

    expect(appCss).toContain("@media (max-width: 900px)");
    expect(appCss).toContain(".product-grid");
    expect(appCss).toContain("grid-template-columns: 1fr;");
    expect(appCss).toContain(".chat-panel");
    expect(appCss).toContain("position: fixed;");
  });
});
