import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "../../test/utils";
import { ChatInput } from "./ChatInput";

describe("ChatInput", () => {
  it("disables the send button while loading", () => {
    renderWithProviders(
      <ChatInput isSending={true} isStreaming={false} onCancel={vi.fn()} onSend={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
  });

  it("clears the textarea after a successful send", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(
      <ChatInput isSending={false} isStreaming={false} onCancel={vi.fn()} onSend={onSend} />,
    );

    const textarea = screen.getByLabelText("Message");
    await user.type(textarea, "Need a list of lamps");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith("Need a list of lamps");
      expect(textarea).toHaveValue("");
    });
  });

  it("shows a cancel button while streaming", () => {
    renderWithProviders(
      <ChatInput isSending={true} isStreaming={true} onCancel={vi.fn()} onSend={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Cancel stream" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Streaming..." })).toBeDisabled();
  });
});
