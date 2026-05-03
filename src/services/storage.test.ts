import { describe, expect, it } from "vitest";

import {
  AUTH_STORAGE_KEY,
  clearAuthSession,
  readAuthSession,
  writeAuthSession,
} from "./storage";

describe("auth storage helpers", () => {
  it("writes and reads the auth session", () => {
    writeAuthSession({
      token: "token-123",
      user: {
        id: "user-123",
        companyId: "company-456",
        name: "Ada Lovelace",
        email: "ada@example.com",
        role: "admin",
        verified: true,
      },
    });

    expect(readAuthSession()).toEqual({
      token: "token-123",
      user: {
        id: "user-123",
        companyId: "company-456",
        name: "Ada Lovelace",
        email: "ada@example.com",
        role: "admin",
        verified: true,
      },
    });
  });

  it("clears the auth session", () => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ token: "token-123" }));

    clearAuthSession();

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("drops malformed auth storage values", () => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, "{broken-json");

    expect(readAuthSession()).toBeNull();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
