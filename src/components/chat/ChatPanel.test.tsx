import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/utils";
import { ChatPanel, CHAT_PANEL_STORAGE_KEY } from "./ChatPanel";

vi.mock("../../hooks/useChat", () => ({
  useConversation: vi.fn(),
  useSendMessage: vi.fn(),
}));

import { useConversation, useSendMessage } from "../../hooks/useChat";

describe("ChatPanel", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(useConversation).mockReturnValue({
      data: { messages: [] },
      error: null,
      isLoading: false,
    } as unknown as ReturnType<typeof useConversation>);
    vi.mocked(useSendMessage).mockReturnValue({
      cancelStream: vi.fn(),
      error: null,
      isPending: false,
      isStreaming: false,
      mutateAsync: vi.fn(),
      streamActivities: [],
      streamedContent: "",
    } as unknown as ReturnType<typeof useSendMessage>);
  });

  it("renders expanded by default", () => {
    renderWithProviders(<ChatPanel />);

    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assistant workspace" })).toBeInTheDocument();
  });

  it("collapses when the collapse button is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ChatPanel />);
    await user.click(screen.getByRole("button", { name: "Collapse chat panel" }));

    expect(screen.getByRole("button", { name: "Open chat panel" })).toBeInTheDocument();
  });

  it("persists the collapsed state in localStorage", async () => {
    const user = userEvent.setup();

    renderWithProviders(<ChatPanel />);
    await user.click(screen.getByRole("button", { name: "Collapse chat panel" }));

    expect(window.localStorage.getItem(CHAT_PANEL_STORAGE_KEY)).toBe("true");
  });
});
