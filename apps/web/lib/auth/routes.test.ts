import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import {
  DASHBOARD_PATH,
  LOGIN_PATH,
  UNAVAILABLE_PATH,
  dashboardUrl,
  isAuthPage,
  isPublicRoute,
  isSafeNextPath,
  loginUrl,
  normalizePath,
} from "./routes";

function req(url: string): NextRequest {
  return new NextRequest(new Request(url));
}

describe("normalizePath", () => {
  it("collapses trailing slashes except root", () => {
    expect(normalizePath("/register/")).toBe("/register");
    expect(normalizePath("/dashboard//")).toBe("/dashboard");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("")).toBe("/");
    expect(normalizePath("/auth/callback")).toBe("/auth/callback");
  });
});

describe("isAuthPage", () => {
  it.each(["/", "/register", "/auth/callback", "/register/"])("treats %s as an auth page", (path) => {
    expect(isAuthPage(path)).toBe(true);
  });

  it.each(["/dashboard", "/unavailable", "/apiary", "/unknown", "/register/extra"])(
    "treats %s as protected (fail closed)",
    (path) => {
      expect(isAuthPage(path)).toBe(false);
    },
  );
});

describe("isPublicRoute", () => {
  it("passes only the outage page without verification", () => {
    expect(isPublicRoute("/unavailable")).toBe(true);
    expect(isPublicRoute("/unavailable/")).toBe(true);
    expect(isPublicRoute("/")).toBe(false);
    expect(isPublicRoute("/dashboard")).toBe(false);
  });
});

describe("isSafeNextPath", () => {
  it.each(["/dashboard", "/auth/callback", "/a/b/c", "/x?y=1"])("accepts %s", (path) => {
    expect(isSafeNextPath(path)).toBe(true);
  });

  it.each([
    "https://evil.example/dashboard",
    "http://evil.example",
    "//evil.example/dashboard",
    "/\\evil.example",
    "/foo\\bar",
    "javascript:alert(1)",
    "",
    "/with space",
    "/%2F%2Fevil.example",
    "/%5cevil",
  ])("rejects %s", (path) => {
    expect(isSafeNextPath(path)).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isSafeNextPath(undefined)).toBe(false);
    expect(isSafeNextPath(null)).toBe(false);
    expect(isSafeNextPath(42)).toBe(false);
    expect(isSafeNextPath({})).toBe(false);
  });

  it("rejects malformed percent-encoding", () => {
    expect(isSafeNextPath("/%zz")).toBe(false);
  });
});

describe("loginUrl", () => {
  it("carries a validated ?next= for post-login return", () => {
    const url = loginUrl(req("http://localhost:3000/dashboard"), "/dashboard");
    expect(url.pathname).toBe(LOGIN_PATH);
    expect(url.searchParams.get("next")).toBe("/dashboard");
  });

  it("drops attacker-controlled destinations instead of redirecting to them", () => {
    for (const evil of ["https://evil.example", "//evil.example", "/\\evil"]) {
      const url = loginUrl(req("http://localhost:3000/dashboard"), evil);
      expect(url.pathname).toBe(LOGIN_PATH);
      expect(url.searchParams.has("next")).toBe(false);
      expect(url.host).toBe("localhost:3000");
    }
  });

  it("never redirects off-origin", () => {
    const url = loginUrl(req("http://localhost:3000/dashboard"), "/dashboard");
    expect(url.origin).toBe("http://localhost:3000");
  });
});

describe("dashboardUrl", () => {
  it("points at the dashboard with no attacker-influenced query", () => {
    const url = dashboardUrl(req("http://localhost:3000/?next=https://evil.example"));
    expect(url.pathname).toBe(DASHBOARD_PATH);
    expect(url.search).toBe("");
    expect(url.origin).toBe("http://localhost:3000");
  });

  it("references the documented unavailable path", () => {
    expect(UNAVAILABLE_PATH).toBe("/unavailable");
  });
});
