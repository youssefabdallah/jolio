import { afterEach, describe, expect, it, vi } from "vitest";
import { verifySession } from "./session";

const TOKEN = "test-token-abcdef123456";
const USER = {
  id: "01J0000000000000000000000",
  display_name: "Alex Chen",
  email: "alex@example.com",
  provider: "credentials",
  avatar_url: null,
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.AUTH_VERIFY_TIMEOUT_MS;
});

describe("verifySession", () => {
  it("returns authenticated for a valid session without leaking the token", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(200, USER));
    vi.stubGlobal("fetch", fetchMock);
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.stubEnv("API_BASE_URL", "http://api:8000");
    const result = await verifySession(TOKEN);
    vi.unstubAllEnvs();

    expect(result).toEqual({ status: "authenticated", user: USER });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("http://api:8000/api/user");
    const headers = new Headers(init.headers);
    expect(headers.get("Authorization")).toBe(`Bearer ${TOKEN}`);
    expect(headers.get("Accept")).toBe("application/json");
    for (const call of errorSpy.mock.calls) {
      expect(String(call[0])).not.toContain(TOKEN);
    }
  });

  it("treats an empty token as unauthenticated without calling the backend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await verifySession("")).toEqual({ status: "unauthenticated" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 403])("maps HTTP %s to unauthenticated (explicit rejection)", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(status, { message: "Nope." })));
    expect(await verifySession(TOKEN)).toEqual({ status: "unauthenticated" });
  });

  it.each([429, 500, 502, 503])(
    "maps HTTP %s to unavailable — never proof of an invalid session",
    async (status) => {
      vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(status, { error: "x" })));
      expect(await verifySession(TOKEN)).toEqual({ status: "unavailable" });
    },
  );

  it("maps network failures to unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );
    expect(await verifySession(TOKEN)).toEqual({ status: "unavailable" });
  });

  it("maps timeouts to unavailable", async () => {
    process.env.AUTH_VERIFY_TIMEOUT_MS = "50";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: unknown, init: unknown) =>
          new Promise((_resolve, reject) => {
            const signal = (init as { signal: AbortSignal }).signal;
            signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
          }),
      ),
    );
    expect(await verifySession(TOKEN)).toEqual({ status: "unavailable" });
  });

  it("maps redirects to unavailable instead of following them with credentials", async () => {
    const seen: RequestInit[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: unknown, init: unknown) => {
        seen.push(init as RequestInit);
        return new Response(null, { status: 302, headers: { location: "https://evil.example/" } });
      }),
    );
    expect(await verifySession(TOKEN)).toEqual({ status: "unavailable" });
    expect(seen[0]?.redirect).toBe("manual");
  });

  it("maps non-JSON bodies to unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>proxy error</html>", { status: 200 })),
    );
    expect(await verifySession(TOKEN)).toEqual({ status: "unavailable" });
  });

  it("maps malformed JSON to unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response("{oops", { status: 200, headers: { "content-type": "application/json" } }),
      ),
    );
    expect(await verifySession(TOKEN)).toEqual({ status: "unavailable" });
  });

  it("maps schema-invalid user payloads to unavailable (fail closed, keep cookie)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(200, { id: "only-an-id" })));
    expect(await verifySession(TOKEN)).toEqual({ status: "unavailable" });
  });
});
