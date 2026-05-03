import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSendMessage } from "./useChat";
import { getConversation, sendMessage } from "../services/chatService";
import { useStreamChat } from "./useStreamChat";
import type { Conversation } from "../types/chat";

vi.mock("../services/chatService", async () => {
  const actual = await vi.importActual<typeof import("../services/chatService")>(
    "../services/chatService",
  );

  return {
    ...actual,
    getConversation: vi.fn(),
    sendMessage: vi.fn(),
  };
});

vi.mock("./useStreamChat", () => ({
  useStreamChat: vi.fn(),
}));

function renderUseSendMessage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return {
    ...renderHook(() => useSendMessage(), { wrapper: Wrapper }),
    queryClient,
  };
}

function createConversation(content: string): Conversation {
  return {
    id: "conversation-1",
    userId: "user-1",
    companyId: "company-1",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    messages: [{ role: "assistant", content, createdAt: "2026-01-01T00:00:00.000Z" }],
  };
}

describe("useSendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refreshes the conversation after a completed stream", async () => {
    vi.mocked(useStreamChat).mockReturnValue({
      cancelStream: vi.fn(),
      error: null,
      isStreaming: false,
      sendMessage: vi.fn(async (_message, handlers) => {
        await handlers.onComplete?.();
      }),
      streamActivities: [],
      streamedContent: "",
    });
    vi.mocked(getConversation).mockResolvedValue(createConversation("Fresh response"));

    const { result, queryClient } = renderUseSendMessage();

    await act(async () => {
      await result.current.mutateAsync("Hello");
    });

    await waitFor(() => {
      expect(queryClient.getQueryData(["conversation"])).toMatchObject({
        messages: [{ content: "Fresh response" }],
      });
    });
  });

  it("falls back to the non-streaming mutation when requested", async () => {
    vi.mocked(useStreamChat).mockReturnValue({
      cancelStream: vi.fn(),
      error: null,
      isStreaming: false,
      sendMessage: vi.fn(async (message, handlers) => {
        await handlers.onFallback?.(message);
      }),
      streamActivities: [],
      streamedContent: "",
    });
    vi.mocked(sendMessage).mockResolvedValue({
      assistantMessage: {
        role: "assistant",
        content: "Fallback response",
        createdAt: "2026-01-01T00:00:01.000Z",
      },
      conversation: createConversation("Fallback response"),
    });

    const { result, queryClient } = renderUseSendMessage();

    await act(async () => {
      await result.current.mutateAsync("Hello");
    });

    expect(sendMessage).toHaveBeenCalledWith("Hello");
    expect(queryClient.getQueryData(["conversation"])).toMatchObject({
      messages: [{ content: "Fallback response" }],
    });
  });

  it("restores the previous conversation when streaming fails", async () => {
    const previousConversation = createConversation("Previous response");
    const streamError = new Error("stream failed");
    vi.mocked(useStreamChat).mockReturnValue({
      cancelStream: vi.fn(),
      error: null,
      isStreaming: false,
      sendMessage: vi.fn(async () => {
        throw streamError;
      }),
      streamActivities: [],
      streamedContent: "",
    });

    const { result, queryClient } = renderUseSendMessage();
    queryClient.setQueryData(["conversation"], previousConversation);

    await expect(
      act(async () => {
        await result.current.mutateAsync("Hello");
      }),
    ).rejects.toThrow("stream failed");

    expect(queryClient.getQueryData(["conversation"])).toEqual(previousConversation);
    expect(result.current.isPending).toBe(false);
  });
});
