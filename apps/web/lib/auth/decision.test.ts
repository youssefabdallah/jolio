import { describe, expect, it } from "vitest";
import { decideAuth } from "./decision";
import type { AuthResult } from "./result";

const USER = {
  id: "01J0000000000000000000000",
  display_name: "Alex Chen",
  email: "alex@example.com",
  provider: "credentials",
  avatar_url: null,
};
const AUTHENTICATED: AuthResult = { status: "authenticated", user: USER };
const INVALID: AuthResult = { status: "unauthenticated" };
const DOWN: AuthResult = { status: "unavailable" };

describe("decideAuth", () => {
  it("passes auth pages without a cookie", () => {
    for (const path of ["/", "/register", "/auth/callback"]) {
      expect(decideAuth(path, null, null)).toEqual({ kind: "pass", clearCookie: false });
    }
  });

  it("redirects protected routes without a cookie, preserving the destination", () => {
    expect(decideAuth("/dashboard", null, null)).toEqual({
      kind: "redirect-login",
      clearCookie: false,
      next: "/dashboard",
    });
  });

  it("treats unknown routes as protected (fail closed)", () => {
    const decision = decideAuth("/some/future/page", null, null);
    expect(decision.kind).toBe("redirect-login");
  });

  it("passes public routes without verification, even with a cookie", () => {
    expect(decideAuth("/unavailable", "token", null)).toEqual({ kind: "pass", clearCookie: false });
    expect(decideAuth("/unavailable", null, null)).toEqual({ kind: "pass", clearCookie: false });
  });

  it("sends verified sessions from auth pages to the dashboard", () => {
    expect(decideAuth("/", "token", AUTHENTICATED)).toEqual({ kind: "redirect-dashboard" });
    expect(decideAuth("/dashboard", "token", AUTHENTICATED)).toEqual({
      kind: "pass",
      clearCookie: false,
    });
  });

  it("clears confirmed-invalid sessions and redirects protected pages to login", () => {
    expect(decideAuth("/dashboard", "token", INVALID)).toEqual({
      kind: "redirect-login",
      clearCookie: true,
      next: "/dashboard",
    });
  });

  it("clears confirmed-invalid sessions on auth pages too, without redirecting", () => {
    expect(decideAuth("/", "token", INVALID)).toEqual({ kind: "pass", clearCookie: true });
  });

  it("never clears the cookie and never grants access during outages", () => {
    expect(decideAuth("/dashboard", "token", DOWN)).toEqual({ kind: "rewrite-unavailable" });
    expect(decideAuth("/", "token", DOWN)).toEqual({ kind: "pass", clearCookie: false });
  });

  it("fails closed when a present cookie was never verified", () => {
    expect(decideAuth("/dashboard", "token", null)).toEqual({ kind: "rewrite-unavailable" });
  });
});
