import { describe, expect, it } from "vitest";
import { parseSessionUser } from "./user";

const VALID = {
  id: "01J0000000000000000000000",
  display_name: "Alex Chen",
  email: "alex@example.com",
  provider: "credentials",
  avatar_url: null,
};

describe("parseSessionUser", () => {
  it("accepts a complete backend user and strips extra attributes", () => {
    const parsed = parseSessionUser({
      ...VALID,
      password: "must-never-surface",
      provider_id: "secret",
      created_at: "2026-01-01",
      remember_token: "secret",
    });
    expect(parsed).toEqual(VALID);
    expect(parsed).not.toHaveProperty("password");
    expect(parsed).not.toHaveProperty("provider_id");
  });

  it("accepts a string avatar_url", () => {
    expect(parseSessionUser({ ...VALID, avatar_url: "https://example.com/a.png" })).toEqual({
      ...VALID,
      avatar_url: "https://example.com/a.png",
    });
  });

  it.each([
    ["missing id", { ...VALID, id: undefined }],
    ["empty id", { ...VALID, id: "" }],
    ["missing display_name", { ...VALID, display_name: undefined }],
    ["missing email", { ...VALID, email: undefined }],
    ["malformed email", { ...VALID, email: "not-an-email" }],
    ["missing provider", { ...VALID, provider: undefined }],
    ["missing avatar_url", { ...VALID, avatar_url: undefined }],
    ["numeric avatar_url", { ...VALID, avatar_url: 42 }],
    ["numeric id", { ...VALID, id: 7 }],
  ])("rejects a payload with %s", (_label, payload) => {
    expect(parseSessionUser(payload)).toBeNull();
  });

  it.each([["null"], ["a string"], ["an array"], ["a number"]])("rejects %s as a whole", (label) => {
    const input: unknown =
      label === "null" ? null : label === "a string" ? "x" : label === "an array" ? [] : 1;
    expect(parseSessionUser(input)).toBeNull();
  });

  it("does not treat the mere presence of id as sufficient", () => {
    expect(parseSessionUser({ id: "01J0000000000000000000000" })).toBeNull();
  });
});
