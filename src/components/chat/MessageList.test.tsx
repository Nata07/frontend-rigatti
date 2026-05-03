import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MessageList } from "./MessageList";

describe("MessageList", () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    Object.defineProperty(window.HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
  });

  afterEach(() => {
    scrollIntoView.mockReset();
  });

  it("auto-scrolls to the bottom when a new message is added", async () => {
    const { rerender } = render(
      <MessageList
        isResponding={false}
        messages={[
          {
            role: "user",
            content: "Hi",
            createdAt: "2026-04-29T10:00:00.000Z",
          },
        ]}
        streamActivities={[]}
        streamedContent=""
      />,
    );

    rerender(
      <MessageList
        isResponding={false}
        messages={[
          {
            role: "user",
            content: "Hi",
            createdAt: "2026-04-29T10:00:00.000Z",
          },
          {
            role: "assistant",
            content: "Hello there",
            createdAt: "2026-04-29T10:00:02.000Z",
          },
        ]}
        streamActivities={[]}
        streamedContent=""
      />,
    );

    await waitFor(() => {
      expect(scrollIntoView).toHaveBeenCalled();
    });
  });

  it("renders streamed assistant content and tool activity", () => {
    const { getByText, getByTestId } = render(
      <MessageList
        isResponding={true}
        messages={[]}
        streamActivities={[
          {
            id: "tool-call:1",
            type: "tool_call",
            label: "Using searchCatalog",
            detail: '{"category":"lighting"}',
          },
        ]}
        streamedContent="Aurora Lamp"
      />,
    );

    expect(getByText("Aurora Lamp")).toBeInTheDocument();
    expect(getByText("Using searchCatalog")).toBeInTheDocument();
    expect(getByTestId("tool_call")).toBeInTheDocument();
  });
});
