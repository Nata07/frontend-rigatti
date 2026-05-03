import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useAuth } from "./useAuth";

function BrokenConsumer() {
  useAuth();
  return null;
}

describe("useAuth", () => {
  it("throws outside the provider", () => {
    expect(() => render(<BrokenConsumer />)).toThrow("useAuth must be used within an AuthProvider");
  });
});
