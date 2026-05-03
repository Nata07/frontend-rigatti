import type { ChatMessage } from "../../types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

function formatTimestamp(createdAt: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(createdAt));
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <article
      className={`message-bubble message-bubble--${message.role}`}
      data-testid={`${message.role}-message`}
    >
      <div className="message-bubble__meta">
        <span>{isUser ? "You" : "Assistant"}</span>
        <time dateTime={message.createdAt}>{formatTimestamp(message.createdAt)}</time>
      </div>
      <p>{message.content}</p>
    </article>
  );
}

