import { useEffect, useRef, useState } from "react";

import {
  isStreamFallbackError,
  streamChatMessage,
  type StreamChatError,
} from "../services/chatService";
import type {
  StreamActivity,
  StreamCompleteEvent,
  StreamErrorEvent,
  StreamToolCallEvent,
  StreamToolResultEvent,
} from "../types/stream";

interface SendStreamMessageOptions {
  onComplete?: (event: StreamCompleteEvent) => Promise<void> | void;
  onFallback?: (message: string, error: StreamChatError) => Promise<void> | void;
}

export interface UseStreamChatResult {
  cancelStream: () => void;
  error: unknown;
  isStreaming: boolean;
  sendMessage: (message: string, options?: SendStreamMessageOptions) => Promise<void>;
  streamActivities: StreamActivity[];
  streamedContent: string;
}

function createAbortError() {
  return new DOMException("The operation was aborted.", "AbortError");
}

function toToolCallActivity(event: StreamToolCallEvent): StreamActivity {
  return {
    id: `tool-call:${event.data.id}`,
    type: "tool_call",
    label: `Using ${event.data.name}`,
    detail: event.data.argumentsJson,
  };
}

function toToolResultActivity(event: StreamToolResultEvent): StreamActivity {
  return {
    id: `tool-result:${event.data.toolCallId}`,
    type: "tool_result",
    label: `${event.data.name} finished`,
    detail: event.data.content,
  };
}

function toStreamError(errorEvent: StreamErrorEvent | null, error: unknown) {
  if (errorEvent) {
    return new Error(errorEvent.data.message);
  }

  return error;
}

function getStreamErrorMessage(errorEvent: StreamErrorEvent) {
  return errorEvent.data.message;
}

export function useStreamChat(): UseStreamChatResult {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [streamActivities, setStreamActivities] = useState<StreamActivity[]>([]);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort(createAbortError());
      abortControllerRef.current = null;
    };
  }, []);

  function cancelStream() {
    abortControllerRef.current?.abort(createAbortError());
  }

  async function sendMessage(message: string, options: SendStreamMessageOptions = {}) {
    abortControllerRef.current?.abort(createAbortError());

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    let receivedPayload = false;
    let streamErrorEvent: StreamErrorEvent | null = null;

    setError(null);
    setIsStreaming(true);
    setStreamedContent("");
    setStreamActivities([]);

    try {
      await streamChatMessage(
        message,
        {
          onToken: async (event) => {
            receivedPayload = true;
            setStreamedContent((current) => current + event.data);
          },
          onToolCall: async (event) => {
            receivedPayload = true;
            setStreamActivities((current) => [...current, toToolCallActivity(event)]);
          },
          onToolResult: async (event) => {
            receivedPayload = true;
            setStreamActivities((current) => [...current, toToolResultActivity(event)]);
          },
          onError: async (event) => {
            streamErrorEvent = event;
          },
          onComplete: async (event) => {
            await options.onComplete?.(event);
          },
        },
        { signal: abortController.signal },
      );

      if (streamErrorEvent !== null) {
        throw toStreamError(streamErrorEvent, new Error(getStreamErrorMessage(streamErrorEvent)));
      }

      setStreamedContent("");
    } catch (caughtError) {
      if (abortController.signal.aborted) {
        return;
      }

      if (isStreamFallbackError(caughtError) && !receivedPayload) {
        setIsStreaming(false);
        setStreamedContent("");
        setStreamActivities([]);
        await options.onFallback?.(message, caughtError);
        return;
      }

      setError(toStreamError(streamErrorEvent, caughtError));
      throw caughtError;
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }

      setIsStreaming(false);
    }
  }

  return {
    cancelStream,
    error,
    isStreaming,
    sendMessage,
    streamActivities,
    streamedContent,
  };
}
