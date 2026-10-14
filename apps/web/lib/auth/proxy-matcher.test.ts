import { describe, expect, it } from "vitest";
import { config } from "@/proxy";

/**
 * Matcher behavior tests against the REAL proxy matcher literal.
 *
 * The pattern is evaluated here as a native RegExp (^literal$). For
 * this shape of pattern (leading slash + negative lookahead + .*) the
 * native evaluation agrees with path-to-regexp on every path below;
 * the point under test is the intent — which paths reach the gate —
 * including the /apiary boundary trap.
 */
describe("proxy matcher", () => {
  const [matcher] = config.matcher;
  const matches = (path: string): boolean => new RegExp(`^${matcher}$`).test(path);

  it("gates pages: root, auth, protected, nested, unknown, trailing slashes", () => {
    for (const path of [
      "/",
      "/register",
      "/register/",
      "/auth/callback",
      "/dashboard",
      "/dashboard/settings",
      "/apiary",
      "/apiary/",
      "/apineapple",
      "/unknown-route",
      "/unavailable",
    ]) {
      expect(matches(path), path).toBe(true);
    }
  });

  it("bypasses API routes with an intentional path boundary", () => {
    for (const path of ["/api/auth/me", "/api/auth/login", "/api/v1/auth/google/redirect", "/api"]) {
      expect(matches(path), path).toBe(false);
    }
  });

  it("does NOT bypass /apiary-like page paths (regression: bare `api` prefix)", () => {
    expect(matches("/apiary")).toBe(true);
    expect(matches("/apiv2")).toBe(true);
  });

  it("bypasses framework and public assets", () => {
    for (const path of ["/_next/static/chunks/app.js", "/_next/image/cdn", "/favicon.ico", "/icon.svg"]) {
      expect(matches(path), path).toBe(false);
    }
  });

  it("still gates non-excluded lookalikes", () => {
    expect(matches("/_next")).toBe(true);
    expect(matches("/favicon.ico.evil")).toBe(true);
  });

  it("stays statically analyzable (a single string literal entry)", () => {
    expect(config.matcher).toHaveLength(1);
    expect(typeof matcher).toBe("string");
  });
});
