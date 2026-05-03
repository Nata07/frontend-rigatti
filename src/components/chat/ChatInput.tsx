import { useState, type FormEvent } from "react";

interface ChatInputProps {
  isSending: boolean;
  isStreaming: boolean;
  onCancel: () => void;
  onSend: (message: string) => Promise<unknown>;
}

export function ChatInput({ isSending, isStreaming, onCancel, onSend }: ChatInputProps) {
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    setMessage("");

    try {
      await onSend(trimmedMessage);
    } catch {
      setMessage(trimmedMessage);
      // Mutation errors are surfaced by the chat panel; keep the draft for retry.
    }
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <label className="field" htmlFor="chat-message">
        <span>Message</span>
        <textarea
          id="chat-message"
          name="message"
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Ask the assistant about the catalog..."
          rows={4}
          value={message}
        />
      </label>

      <div className="chat-input__actions">
        <p>Use the button to send. The field supports multi-line drafts.</p>
        {isStreaming ? (
          <button className="secondary-button" onClick={onCancel} type="button">
            Cancel stream
          </button>
        ) : null}
        <button className="primary-button" disabled={isSending || !message.trim()} type="submit">
          {isStreaming ? "Streaming..." : isSending ? "Sending..." : "Send message"}
        </button>
      </div>
    </form>
  );
}
