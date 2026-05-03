export type StreamEventType = "start" | "token" | "tool_call" | "tool_result" | "complete" | "error";

export interface StreamStartEvent {
  type: "start";
  data: Record<string, never>;
}

export interface StreamTokenEvent {
  type: "token";
  data: string;
}

export interface StreamToolCallEvent {
  type: "tool_call";
  data: {
    id: string;
    name: string;
    argumentsJson: string;
  };
}

export interface StreamToolResultEvent {
  type: "tool_result";
  data: {
    toolCallId: string;
    name: string;
    content: string;
  };
}

export interface StreamCompleteEvent {
  type: "complete";
  data: {
    conversationId: string;
  };
}

export interface StreamErrorEvent {
  type: "error";
  data: {
    message: string;
  };
}

export type StreamEvent =
  | StreamStartEvent
  | StreamTokenEvent
  | StreamToolCallEvent
  | StreamToolResultEvent
  | StreamCompleteEvent
  | StreamErrorEvent;

export type StreamActivity =
  | {
      id: string;
      type: "tool_call";
      label: string;
      detail: string;
    }
  | {
      id: string;
      type: "tool_result";
      label: string;
      detail: string;
    };
