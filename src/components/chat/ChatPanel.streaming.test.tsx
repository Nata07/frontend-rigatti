import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/utils";
import { ChatPanel } from "./ChatPanel";

vi.mock("../../services/chatService", async () => {
  const actual =
    await vi.importActual<typeof import("../../services/chatService")>("../../services/chatService");

  return {
    ...actual,
    getConversation: vi.fn(),
    sendMessage: vi.fn(),
    streamChatMessage: vi.fn(),
  };
});

import {
  StreamChatError,
  getConversation,
  sendMessage,
  streamChatMessage,
} from "../../services/chatService";

const emptyConversation = {
  id: "conversation-1",
  userId: "user-123",
  companyId: "company-456",
  createdAt: "2026-04-29T10:00:00.000Z",
  updatedAt: "2026-04-29T10:00:00.000Z",
  messages: [],
};

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });

  return { promise, resolve };
}

describe("ChatPanel streaming integration", () => {
  beforeEach(() => {
    vi.mocked(getConversation).mockReset();
    vi.mocked(sendMessage).mockReset();
    vi.mocked(streamChatMessage).mockReset();
    vi.mocked(getConversation).mockResolvedValue(emptyConversation);
  });

  it("streams tokens progressively, shows typing, and renders tool activity", async () => {
    const streamGate = deferred<void>();

    vi.mocked(getConversation)
      .mockResolvedValueOnce(emptyConversation)
      .mockResolvedValueOnce({
        ...emptyConversation,
        updatedAt: "2026-04-29T10:00:05.000Z",
        messages: [
          {
            role: "user",
            content: "Show lighting products",
            createdAt: "2026-04-29T10:00:00.000Z",
          },
          {
            role: "assistant",
            content: "Aurora Lamp is available.",
            createdAt: "2026-04-29T10:00:05.000Z",
          },
        ],
      });
    vi.mocked(streamChatMessage).mockImplementationOnce(async (_message, handlers) => {
      await handlers.onToken?.({ type: "token", data: "Aurora " });
      await streamGate.promise;
      await handlers.onToolCall?.({
        type: "tool_call",
        data: {
          id: "call-1",
          name: "searchCatalog",
          argumentsJson: '{"category":"lighting"}',
        },
      });
      await handlers.onToolResult?.({
        type: "tool_result",
        data: {
          toolCallId: "call-1",
          name: "searchCatalog",
          content: "Found 1 product",
        },
      });
      await handlers.onToken?.({ type: "token", data: "Lamp is available." });
      await handlers.onComplete?.({
        type: "complete",
        data: { conversationId: "conversation-1" },
      });
    });
    const user = userEvent.setup();

    renderWithProviders(<ChatPanel />);
    await user.type(screen.getByLabelText("Message"), "Show lighting products");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText((content) => content.includes("Aurora"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Streaming..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel stream" })).toBeInTheDocument();
    expect(screen.getByText("AI is typing...")).toBeInTheDocument();

    streamGate.resolve();

    expect(await screen.findByText("Using searchCatalog")).toBeInTheDocument();
    expect(await screen.findByText("Found 1 product")).toBeInTheDocument();
    expect(await screen.findByText("Aurora Lamp is available.")).toBeInTheDocument();
  });

  it("shows a stream error to the user", async () => {
    vi.mocked(streamChatMessage).mockRejectedValueOnce(new Error("Streaming failed"));
    const user = userEvent.setup();

    renderWithProviders(<ChatPanel />);
    await user.type(screen.getByLabelText("Message"), "Need recommendations");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Streaming failed");
  });

  it("cancels the current stream", async () => {
    let capturedSignal: AbortSignal | undefined;

    vi.mocked(streamChatMessage).mockImplementationOnce(async (_message, _handlers, options) => {
      capturedSignal = options?.signal;

      await new Promise<void>((resolve, reject) => {
        options?.signal?.addEventListener(
          "abort",
          () => {
            reject(new DOMException("The operation was aborted.", "AbortError"));
            resolve();
          },
          { once: true },
        );
      });
    });
    const user = userEvent.setup();

    renderWithProviders(<ChatPanel />);
    await user.type(screen.getByLabelText("Message"), "Need recommendations");
    await user.click(screen.getByRole("button", { name: "Send message" }));
    await user.click(await screen.findByRole("button", { name: "Cancel stream" }));

    await waitFor(() => {
      expect(capturedSignal?.aborted).toBe(true);
      expect(screen.queryByRole("button", { name: "Cancel stream" })).not.toBeInTheDocument();
    });
  });

  it("falls back to the non-streaming endpoint when SSE is unavailable", async () => {
    vi.mocked(streamChatMessage).mockRejectedValueOnce(
      new StreamChatError("Streaming unavailable", { canFallback: true }),
    );
    vi.mocked(sendMessage).mockResolvedValueOnce({
      conversation: {
        ...emptyConversation,
        updatedAt: "2026-04-29T10:00:05.000Z",
        messages: [
          {
            role: "user",
            content: "Need recommendations",
            createdAt: "2026-04-29T10:00:00.000Z",
          },
          {
            role: "assistant",
            content: "Aurora Lamp is available.",
            createdAt: "2026-04-29T10:00:05.000Z",
          },
        ],
      },
      assistantMessage: {
        role: "assistant",
        content: "Aurora Lamp is available.",
        createdAt: "2026-04-29T10:00:05.000Z",
      },
    });
    const user = userEvent.setup();

    renderWithProviders(<ChatPanel />);
    await user.type(screen.getByLabelText("Message"), "Need recommendations");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("Aurora Lamp is available.")).toBeInTheDocument();
    expect(sendMessage).toHaveBeenCalledWith("Need recommendations");
  });
});
