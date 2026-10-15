import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { SESSION_COOKIE } from "./config";

const USER = {
  id: "01J0000000000000000000000",
  display_name: "Alex Chen",
  email: "alex@example.com",
  provider: "credentials",
  avatar_url: null,
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function req(path: string, token?: string, headers?: Record<string, string>): NextRequest {
  const coincHeaders: Record<string, string> = { ...(headers ?? {}) };
  if (token !== undefined) {
    coincHeaders.cookie = `${SESSION_COOKIE}=${token}`;
  }
  return new NextRequest(new Request(`http://localhost:3000${path}`, { headers: coincHeaders }));
}

function locationOf(res: Response): string | null {
  return res.headers.get("location");
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("proxy authentication behavior", () => {
  it("lets a missing cookie through on public routes and the sign-in page", async () => {
    vi.stubGlobal("fetch", vi.fn());
    for (const path of ["/", "/register", "/auth/callback", "/unavailable"]) {
      const res = await proxy(req(path));
      expect(res.headers.get("x-middleware-next"), path).toBe("1");
    }
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it("redirects a missing cookie on protected routes with a safe ?next=", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const res = await proxy(req("/dashboard"));
    expect(res.status).toBe(307);
    const location = new URL(locationOf(res) ?? "");
    expect(location.pathname).toBe("/");
    expect(location.searchParams.get("next")).toBe("/dashboard");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("passes a valid session on protected routes and bounces auth pages", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(200, USER)));
    const pass = await proxy(req("/dashboard", "good-token"));
    expect(pass.headers.get("x-middleware-next")).toBe("1");
    expect(pass.headers.get("set-cookie")).toBeNull();

    const bounce = await proxy(req("/", "good-token"));
    expect(new URL(locationOf(bounce) ?? "").pathname).toBe("/dashboard");
  });

  it("deletes the cookie on explicitly invalid sessions (401)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(401, { message: "Unauthenticated." })));
    const res = await proxy(req("/dashboard", "dead-token"));
    expect(new URL(locationOf(res) ?? "").pathname).toBe("/");
    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toContain(`${SESSION_COOKIE}=`);
    expect(setCookie).toMatch(/Max-Age=0|1970/i);
  });

  it("keeps the cookie and shows the outage page when verification fails (500)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(500, { error: "boom" })));
    const res = await proxy(req("/dashboard", "maybe-good-token"));
    expect(res.headers.get("x-middleware-rewrite")).toContain("/unavailable");
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it.each([429, 503])("keeps the cookie on HTTP %s (no access, no logout)", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => json(status, {})));
    const res = await proxy(req("/dashboard", "maybe-good-token"));
    expect(res.headers.get("x-middleware-rewrite")).toContain("/unavailable");
    expect(locationOf(res)).toBeNull();
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("keeps the cookie on network failure and malformed payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    const down = await proxy(req("/dashboard", "maybe-good-token"));
    expect(down.headers.get("x-middleware-rewrite")).toContain("/unavailable");
    expect(down.headers.get("set-cookie")).toBeNull();

    vi.stubGlobal("fetch", vi.fn(async () => json(200, { id: "only-an-id" })));
    const malformed = await proxy(req("/dashboard", "maybe-good-token"));
    expect(malformed.headers.get("x-middleware-rewrite")).toContain("/unavailable");
    expect(malformed.headers.get("set-cookie")).toBeNull();
  });

  it("still renders auth pages during outages (their forms report the failure)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => json(500, {})));
    const res = await proxy(req("/", "maybe-good-token"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("proxy routing behavior", () => {
  it("fails unknown routes closed", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const res = await proxy(req("/some/future/page"));
    expect(new URL(locationOf(res) ?? "").pathname).toBe("/");
  });

  it("never verifies the public outage page (loop-proof, no backend call)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await proxy(req("/unavailable", "any-token"));
    expect(res.headers.get("x-middleware-next")).toBe("1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("gates /apiary at the decision layer (matcher coverage is separate)", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const res = await proxy(req("/apiary"));
    expect(new URL(locationOf(res) ?? "").pathname).toBe("/");
  });
});

describe("proxy security behavior", () => {
  it("ignores user-controlled Host headers for the backend destination", async () => {
    const fetchMock = vi.fn(async () => json(200, USER));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("API_BASE_URL", "http://api:8000");
    await proxy(req("/dashboard", "good-token", { host: "evil.example" }));
    vi.unstubAllEnvs();
    const [url] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api:8000/api/user");
    expect(new URL(url).host).not.toBe("evil.example");
  });

  it("only forwards Accept + Authorization upstream", async () => {
    const fetchMock = vi.fn(async () => json(200, USER));
    vi.stubGlobal("fetch", fetchMock);
    await proxy(
      req("/dashboard", "good-token", {
        "x-custom-secret": "should-never-forward",
        cookie: `${SESSION_COOKIE}=good-token; other=1`,
      }),
    );
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const headers = new Headers(init.headers);
    expect([...headers.keys()].sort()).toEqual(["accept", "authorization"]);
  });
});
