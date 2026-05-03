import { useEffect, useState } from "react";

import { useConversation, useSendMessage } from "../../hooks/useChat";
import { extractApiErrorMessage } from "../../services/api";
import { ChatInput } from "./ChatInput";
import { MessageList } from "./MessageList";

export const CHAT_PANEL_STORAGE_KEY = "mini-saas.chat-collapsed";

function readCollapsedState() {
  return window.localStorage.getItem(CHAT_PANEL_STORAGE_KEY) === "true";
}

export function ChatPanel() {
  const [isCollapsed, setIsCollapsed] = useState(readCollapsedState);
  const conversationQuery = useConversation();
  const sendMessageMutation = useSendMessage();

  useEffect(() => {
    window.localStorage.setItem(CHAT_PANEL_STORAGE_KEY, String(isCollapsed));
  }, [isCollapsed]);

  const errorMessage = sendMessageMutation.error
    ? extractApiErrorMessage(sendMessageMutation.error, "Unable to send the message right now.")
    : conversationQuery.error
      ? extractApiErrorMessage(
          conversationQuery.error,
          "Unable to load the conversation right now.",
        )
      : null;

  if (isCollapsed) {
    return (
      <button
        aria-label="Open chat panel"
        className="chat-panel-toggle"
        onClick={() => setIsCollapsed(false)}
        type="button"
      >
        Open chat
      </button>
    );
  }

  return (
    <aside className="chat-panel" data-testid="chat-panel">
      <div className="chat-panel__header">
        <div>
          <span className="eyebrow">AI chat</span>
          <h2>Assistant workspace</h2>
          <p>Stay on the dashboard while the assistant reads the same tenant-safe catalog.</p>
        </div>

        <button
          aria-label="Collapse chat panel"
          className="secondary-button"
          onClick={() => setIsCollapsed(true)}
          type="button"
        >
          Collapse
        </button>
      </div>

      {conversationQuery.isLoading ? (
        <div className="catalog-feedback" role="status">
          Loading conversation...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="catalog-feedback catalog-feedback--error" role="alert">
          {errorMessage}
        </div>
      ) : null}

      <div className="chat-panel__body">
        <MessageList
          isResponding={sendMessageMutation.isPending}
          messages={conversationQuery.data?.messages ?? []}
          streamActivities={sendMessageMutation.streamActivities}
          streamedContent={sendMessageMutation.streamedContent}
        />
        <ChatInput
          isSending={sendMessageMutation.isPending}
          isStreaming={sendMessageMutation.isStreaming}
          onCancel={sendMessageMutation.cancelStream}
          onSend={(message) => sendMessageMutation.mutateAsync(message)}
        />
      </div>
    </aside>
  );
}
