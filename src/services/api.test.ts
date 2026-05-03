import { describe, expect, it } from "vitest";

import { api, extractApiErrorMessage } from "./api";
import { AUTH_STORAGE_KEY } from "./storage";
import { createFakeJwt } from "../test/jwt";

describe("api service", () => {
  it("does not attach authorization when there is no stored session", async () => {
    let authorizationHeader: string | undefined;

    await api.get("/products", {
      adapter: async (config) => {
        const rawHeader = config.headers.get("Authorization");
        authorizationHeader = typeof rawHeader === "string" ? rawHeader : undefined;

        return {
          data: {},
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      },
    });

    expect(authorizationHeader).toBeUndefined();
  });

  it("removes malformed auth storage before continuing the request", async () => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, "{broken-json");

    await api.get("/products", {
      adapter: async (config) => ({
        data: {},
        status: 200,
        statusText: "OK",
        headers: {},
        config,
      }),
    });

    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("attaches the bearer token when a stored session exists", async () => {
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: createFakeJwt({
          userId: "user-123",
          companyId: "company-456",
          role: "admin",
        }),
      }),
    );

    let authorizationHeader = "";

    await api.get("/products", {
      adapter: async (config) => {
        const rawHeader = config.headers.get("Authorization");
        authorizationHeader = typeof rawHeader === "string" ? rawHeader : "";

        return {
          data: {},
          status: 200,
          statusText: "OK",
          headers: {},
          config,
        };
      },
    });

    expect(authorizationHeader).toContain("Bearer ");
  });

  it("extracts nested API error messages", () => {
    expect(
      extractApiErrorMessage(
        {
          response: {
            data: {
              error: {
                message: "Nested API message",
              },
            },
          },
        },
        "Fallback message",
      ),
    ).toBe("Nested API message");
  });

  it("extracts messages from native errors and falls back when unknown", () => {
    expect(extractApiErrorMessage(new Error("Native error"), "Fallback message")).toBe(
      "Native error",
    );
    expect(extractApiErrorMessage(42, "Fallback message")).toBe("Fallback message");
  });
});
