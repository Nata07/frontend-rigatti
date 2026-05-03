import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithProviders } from "../../test/utils";
import { MessageBubble } from "./MessageBubble";

describe("MessageBubble", () => {
  it("renders user messages aligned to the right", () => {
    renderWithProviders(
      <MessageBubble
        message={{
          role: "user",
          content: "Show me the cheapest lamp.",
          createdAt: "2026-04-29T10:00:00.000Z",
        }}
      />,
    );

    expect(screen.getByTestId("user-message")).toHaveClass("message-bubble--user");
  });

  it("renders assistant messages aligned to the left", () => {
    renderWithProviders(
      <MessageBubble
        message={{
          role: "assistant",
          content: "Aurora Lamp starts at $149.90.",
          createdAt: "2026-04-29T10:01:00.000Z",
        }}
      />,
    );

    expect(screen.getByTestId("assistant-message")).toHaveClass("message-bubble--assistant");
  });
});

