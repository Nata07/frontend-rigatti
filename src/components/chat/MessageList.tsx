import { useEffect, useRef } from "react";

import type { ChatMessage } from "../../types/chat";
import type { StreamActivity } from "../../types/stream";
import { MessageBubble } from "./MessageBubble";

interface MessageListProps {
  isResponding: boolean;
  messages: ChatMessage[];
  streamActivities?: StreamActivity[];
  streamedContent?: string;
}

export function MessageList({
  isResponding,
  messages,
  streamActivities = [],
  streamedContent = "",
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === "function") {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isResponding, messages]);

  if (messages.length === 0 && streamActivities.length === 0 && !streamedContent && !isResponding) {
    return (
      <div className="chat-empty-state">
        <p>Ask about products, pricing, or categories to start the conversation.</p>
      </div>
    );
  }

  return (
    <div className="message-list" data-testid="message-list">
      {messages.map((message, index) => (
        <div className={`message-row message-row--${message.role}`} key={`${message.createdAt}-${index}`}>
          <MessageBubble message={message} />
        </div>
      ))}

      {streamActivities.map((activity) => (
        <div className="message-row message-row--assistant" key={activity.id}>
          <article className="message-bubble message-bubble--assistant" data-testid={activity.type}>
            <div className="message-bubble__meta">
              <span>{activity.label}</span>
            </div>
            <p>{activity.detail}</p>
          </article>
        </div>
      ))}

      {streamedContent ? (
        <div className="message-row message-row--assistant">
          <MessageBubble
            message={{
              role: "assistant",
              content: streamedContent,
              createdAt: new Date().toISOString(),
            }}
          />
        </div>
      ) : null}

      {isResponding ? (
        <div className="message-row message-row--assistant">
          <div
            aria-label="Assistant is responding"
            className="chat-loading-indicator"
            role="status"
          >
            <span className="sr-only">AI is typing...</span>
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}

      <div ref={bottomRef} />
    </div>
  );
}
