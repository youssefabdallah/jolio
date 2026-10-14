import { describe, expect, it } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, sessionCookieAttributes } from "./cookies";
import { SESSION_COOKIE } from "./config";

function req(url: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(new Request(url, { headers }));
}

describe("sessionCookieAttributes", () => {
  it("is HttpOnly, Lax, host-only, and non-Secure on plain local HTTP", () => {
    const attrs = sessionCookieAttributes(req("http://localhost:3000/dashboard"));
    expect(attrs).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });
    expect(attrs.maxAge).toBeGreaterThan(0);
  });

  it("marks Secure behind a TLS-terminating proxy", () => {
    const attrs = sessionCookieAttributes(
      req("http://internal:3000/dashboard", { "x-forwarded-proto": "https" }),
    );
    expect(attrs.secure).toBe(true);
  });

  it("marks Secure on direct https", () => {
    expect(sessionCookieAttributes(req("https://app.example/dashboard")).secure).toBe(true);
  });

  it("never sets a Domain (host-only cookie)", () => {
    expect(sessionCookieAttributes(req("https://app.example/dashboard"))).not.toHaveProperty(
      "domain",
    );
  });
});

describe("clearSessionCookie", () => {
  it("expires the cookie with mirrored Path/SameSite scope", () => {
    const incoming = req("http://localhost:3000/dashboard");
    const res = NextResponse.next();
    clearSessionCookie(incoming, res);
    const header = res.headers.get("set-cookie") ?? "";
    expect(header).toContain(`${SESSION_COOKIE}=`);
    expect(header).toMatch(/Max-Age=0|Expires=Thu, 01 Jan 1970/i);
    expect(header).toContain("Path=/");
    expect(header).toMatch(/SameSite=Lax/i);
    expect(header).toContain("HttpOnly");
  });
});
