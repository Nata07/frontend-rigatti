import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useStreamChat } from "./useStreamChat";

function createStreamResponse(chunks: string[], delayMs = 0) {
  return new Response(
    new ReadableStream({
      start(controller) {
        chunks.forEach((chunk, index) => {
          setTimeout(() => {
            controller.enqueue(new TextEncoder().encode(chunk));

            if (index === chunks.length - 1) {
              controller.close();
            }
          }, delayMs * (index + 1));
        });
      },
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
      },
    },
  );
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((innerResolve) => {
    resolve = innerResolve;
  });

  return { promise, resolve };
}

describe("useStreamChat", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the streaming API", () => {
    const { result } = renderHook(() => useStreamChat());

    expect(typeof result.current.sendMessage).toBe("function");
    expect(typeof result.current.cancelStream).toBe("function");
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.streamedContent).toBe("");
  });

  it("creates a POST stream request with the expected URL", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      createStreamResponse(['event: complete\ndata: {"conversationId":"conversation-1"}\n\n']),
    );

    const { result } = renderHook(() => useStreamChat());
    await result.current.sendMessage("Show lighting products");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3001/api/chat/stream",
      expect.objectContaining({
        body: JSON.stringify({ message: "Show lighting products" }),
        method: "POST",
      }),
    );
  });

  it("accumulates tokens progressively and updates the streaming state", async () => {
    const gate = deferred<void>();

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        new ReadableStream({
          async start(controller) {
            controller.enqueue(new TextEncoder().encode('event: token\ndata: "Aurora "\n\n'));
            await gate.promise;
            controller.enqueue(new TextEncoder().encode('event: token\ndata: "Lamp"\n\n'));
            controller.enqueue(
              new TextEncoder().encode(
                'event: complete\ndata: {"conversationId":"conversation-1"}\n\n',
              ),
            );
            controller.close();
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
          },
        },
      ),
    );

    const { result } = renderHook(() => useStreamChat());
    let sendPromise!: Promise<void>;

    act(() => {
      sendPromise = result.current.sendMessage("Show lighting products");
    });

    await waitFor(() => {
      expect(result.current.streamedContent).toBe("Aurora ");
    });

    gate.resolve();

    await waitFor(() => {
      expect(result.current.isStreaming).toBe(false);
    });

    await sendPromise;

    expect(result.current.isStreaming).toBe(false);
  });

  it("aborts the stream on unmount", async () => {
    let capturedSignal: AbortSignal | undefined;

    vi.mocked(fetch).mockImplementationOnce(async (_input, init) => {
      capturedSignal = init?.signal as AbortSignal;

      return createStreamResponse(['event: token\ndata: "Aurora "\n\n'], 50);
    });

    const { result, unmount } = renderHook(() => useStreamChat());
    void result.current.sendMessage("Show lighting products");

    await waitFor(() => {
      expect(capturedSignal).toBeDefined();
    });

    unmount();

    expect(capturedSignal?.aborted).toBe(true);
  });
});
