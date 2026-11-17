
import { afterEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError } from "./http";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HTTP client", () => {
  it("adds a Bearer token to authenticated requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/auth/me", {
      token: "test-jwt",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/auth/me"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer test-jwt",
        }),
      }),
    );
  });

  it("does not send a token on public requests", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 }),
    );

    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/products");

    const options = fetchMock.mock.calls[0][1];

    expect(options.headers).not.toHaveProperty("Authorization");
  });

  it("handles invalid credentials with HTTP 401", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, { status: 401 }),
      ),
    );

    await expect(
      apiRequest("/auth/login", {
        method: "POST",
        body: {
          email: "wrong@example.com",
          password: "incorrect",
        },
      }),
    ).rejects.toMatchObject({
      status: 401,
      message: "Invalid credentials or expired session.",
    });
  });

  it("handles forbidden requests with HTTP 403", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, { status: 403 }),
      ),
    );

    await expect(
      apiRequest("/admin", { token: "customer-token" }),
    ).rejects.toMatchObject({
      status: 403,
    });
  });

  it("handles network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(apiRequest("/products")).rejects.toBeInstanceOf(
      ApiError,
    );

    await expect(apiRequest("/products")).rejects.toMatchObject({
      status: 0,
    });
  });
});
