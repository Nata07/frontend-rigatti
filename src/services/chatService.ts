import { api } from "./api";
import { readAuthSession } from "./storage";
import type { ChatMessage, Conversation } from "../types/chat";
import type {
  StreamCompleteEvent,
  StreamErrorEvent,
  StreamEvent,
  StreamToolCallEvent,
  StreamToolResultEvent,
} from "../types/stream";

interface ChatMessageResponse {
  role: "user" | "assistant";
  content: string;
  createdAt: string | Date;
}

interface ConversationResponse {
  _id?: string;
  id?: string;
  userId?: string;
  companyId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  messages?: ChatMessageResponse[];
}

interface SendMessageResponse {
  conversation: ConversationResponse;
  assistantMessage: ChatMessageResponse;
}

export interface SendMessageResult {
  conversation: Conversation;
  assistantMessage: ChatMessage;
}

export class StreamChatError extends Error {
  canFallback: boolean;

  constructor(message: string, options?: { canFallback?: boolean }) {
    super(message);
    this.name = "StreamChatError";
    this.canFallback = options?.canFallback ?? false;
  }
}

interface StreamChatHandlers {
  onComplete?: (event: StreamCompleteEvent) => Promise<void> | void;
  onError?: (event: StreamErrorEvent) => Promise<void> | void;
  onStart?: () => Promise<void> | void;
  onToken?: (event: Extract<StreamEvent, { type: "token" }>) => Promise<void> | void;
  onToolCall?: (event: StreamToolCallEvent) => Promise<void> | void;
  onToolResult?: (event: StreamToolResultEvent) => Promise<void> | void;
}

interface StreamChatOptions {
  signal?: AbortSignal;
}

function normalizeDate(value?: string | Date) {
  if (!value) {
    return new Date().toISOString();
  }

  return new Date(value).toISOString();
}

function normalizeMessage(message: ChatMessageResponse): ChatMessage {
  return {
    role: message.role,
    content: message.content,
    createdAt: normalizeDate(message.createdAt),
  };
}

function normalizeConversation(conversation: ConversationResponse): Conversation {
  return {
    id: conversation.id ?? conversation._id ?? "conversation",
    userId: conversation.userId ?? "",
    companyId: conversation.companyId ?? "",
    createdAt: normalizeDate(conversation.createdAt),
    updatedAt: normalizeDate(conversation.updatedAt),
    messages: (conversation.messages ?? []).map(normalizeMessage),
  };
}

export async function getConversation() {
  const response = await api.get<ConversationResponse>("/chat");
  return normalizeConversation(response.data);
}

export async function sendMessage(message: string): Promise<SendMessageResult> {
  const response = await api.post<SendMessageResponse>("/chat", { message });

  return {
    conversation: normalizeConversation(response.data.conversation),
    assistantMessage: normalizeMessage(response.data.assistantMessage),
  };
}

export function isStreamFallbackError(error: unknown): error is StreamChatError {
  return error instanceof StreamChatError && error.canFallback;
}

export async function streamChatMessage(
  message: string,
  handlers: StreamChatHandlers,
  options: StreamChatOptions = {},
) {
  const session = readAuthSession();
  const baseUrl = String(api.defaults.baseURL ?? "").replace(/\/$/, "");
  const headers = new Headers({
    Accept: "text/event-stream",
    "Content-Type": "application/json",
  });

  if (session?.token) {
    headers.set("Authorization", `Bearer ${session.token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/chat/stream`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message }),
      signal: options.signal,
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw error;
    }

    throw new StreamChatError("Unable to open the streaming connection.", {
      canFallback: true,
    });
  }

  if (!response.ok) {
    throw new StreamChatError(
      `Streaming request failed with status ${response.status}`,
      { canFallback: true },
    );
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/event-stream") || !response.body) {
    throw new StreamChatError("Streaming is unavailable for this client.", {
      canFallback: true,
    });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamError: StreamErrorEvent | null = null;

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const parsed = drainEventBuffer(buffer);
    buffer = parsed.remainder;

    for (const event of parsed.events) {
      switch (event.type) {
        case "start":
          await handlers.onStart?.();
          break;
        case "token":
          await handlers.onToken?.(event);
          break;
        case "tool_call":
          await handlers.onToolCall?.(event);
          break;
        case "tool_result":
          await handlers.onToolResult?.(event);
          break;
        case "complete":
          await handlers.onComplete?.(event);
          break;
        case "error":
          streamError = event;
          await handlers.onError?.(event);
          break;
      }
    }

    if (done) {
      break;
    }
  }

  if (streamError) {
    throw new Error(streamError.data.message);
  }
}

function drainEventBuffer(buffer: string) {
  const chunks = buffer.split("\n\n");
  const remainder = chunks.pop() ?? "";

  return {
    events: chunks.map(parseStreamEvent).filter((event): event is StreamEvent => event !== null),
    remainder,
  };
}

function parseStreamEvent(chunk: string): StreamEvent | null {
  const lines = chunk
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  let eventType = "";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventType = line.slice("event:".length).trim();
      continue;
    }

    if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (!eventType || dataLines.length === 0) {
    return null;
  }

  const data = JSON.parse(dataLines.join("\n"));

  return {
    type: eventType,
    data,
  } as StreamEvent;
}
