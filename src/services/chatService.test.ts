import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getConversation,
  isStreamFallbackError,
  sendMessage,
  StreamChatError,
  streamChatMessage,
} from "./chatService";
import { api } from "./api";
import { writeAuthSession } from "./storage";

vi.mock("./api", async () => {
  const actual = await vi.importActual<typeof import("./api")>("./api");

  return {
    ...actual,
    api: {
      defaults: {
        baseURL: "http://localhost:3001/api",
      },
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});

function createStreamResponse(chunks: string[], options?: { contentType?: string; ok?: boolean; status?: number }) {
  return new Response(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk) => controller.enqueue(new TextEncoder().encode(chunk)));
        controller.close();
      },
    }),
    {
      headers: {
        "Content-Type": options?.contentType ?? "text/event-stream",
      },
      status: options?.status ?? 200,
      statusText: "OK",
    },
  );
}

describe("chatService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("normalizes conversations returned by GET /chat", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        _id: "conversation-1",
        userId: "user-1",
        companyId: "company-1",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:01.000Z",
        messages: [{ role: "assistant", content: "Hello", createdAt: "2026-01-01T00:00:02.000Z" }],
      },
    });

    await expect(getConversation()).resolves.toMatchObject({
      id: "conversation-1",
      messages: [{ role: "assistant", content: "Hello", createdAt: "2026-01-01T00:00:02.000Z" }],
    });
  });

  it("normalizes sendMessage responses", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        conversation: {
          id: "conversation-1",
          userId: "user-1",
          companyId: "company-1",
          messages: [{ role: "user", content: "Hi", createdAt: "2026-01-01T00:00:00.000Z" }],
        },
        assistantMessage: {
          role: "assistant",
          content: "Hello",
          createdAt: "2026-01-01T00:00:01.000Z",
        },
      },
    });

    await expect(sendMessage("Hi")).resolves.toMatchObject({
      assistantMessage: {
        role: "assistant",
        content: "Hello",
      },
    });
  });

  it("streams events, forwards auth headers, and calls handlers", async () => {
    writeAuthSession({
      token: "token-123",
      user: {
        id: "user-1",
        companyId: "company-1",
        name: "Ada",
        email: "ada@example.com",
        role: "admin",
        verified: true,
      },
    });
    const onStart = vi.fn();
    const onToken = vi.fn();
    const onToolCall = vi.fn();
    const onToolResult = vi.fn();
    const onComplete = vi.fn();
    let capturedHeaders: Headers | undefined;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input, init) => {
        capturedHeaders = init?.headers as Headers;

        return createStreamResponse([
          'event: start\ndata: {}\n\n',
          'event: token\ndata: "Hello "\n\n',
          'event: tool_call\ndata: {"id":"call-1","name":"search_products","argumentsJson":"{}"}\n\n',
          'event: tool_result\ndata: {"toolCallId":"call-1","name":"search_products","content":"[]"}\n\n',
          'event: complete\ndata: {"conversationId":"conversation-1"}\n\n',
        ]);
      }),
    );

    await streamChatMessage(
      "Show products",
      { onComplete, onStart, onToken, onToolCall, onToolResult },
    );

    expect(capturedHeaders?.get("Authorization")).toBe("Bearer token-123");
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onToken).toHaveBeenCalledWith({ type: "token", data: "Hello " });
    expect(onToolCall).toHaveBeenCalledWith({
      type: "tool_call",
      data: { id: "call-1", name: "search_products", argumentsJson: "{}" },
    });
    expect(onToolResult).toHaveBeenCalledWith({
      type: "tool_result",
      data: { toolCallId: "call-1", name: "search_products", content: "[]" },
    });
    expect(onComplete).toHaveBeenCalledWith({
      type: "complete",
      data: { conversationId: "conversation-1" },
    });
  });

  it("marks transport and protocol failures as fallback-capable", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => createStreamResponse([], { contentType: "application/json" })));

    await expect(streamChatMessage("Show products", {})).rejects.toMatchObject({
      name: "StreamChatError",
      canFallback: true,
      message: "Streaming is unavailable for this client.",
    });

    const transportError = new StreamChatError("Unable to open the streaming connection.", {
      canFallback: true,
    });
    expect(isStreamFallbackError(transportError)).toBe(true);
    expect(isStreamFallbackError(new Error("plain"))).toBe(false);
  });

  it("throws the streamed error event message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        createStreamResponse([
          'event: error\ndata: {"message":"Provider down"}\n\n',
        ]),
      ),
    );

    await expect(streamChatMessage("Show products", {})).rejects.toThrow("Provider down");
  });
});
