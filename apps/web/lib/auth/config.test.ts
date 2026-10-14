import { afterEach, describe, expect, it } from "vitest";
import { getApiBaseUrl, getVerifyTimeoutMs } from "./config";

const BASELINE_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...BASELINE_ENV };
});

describe("getApiBaseUrl", () => {
  it("defaults to the compose service URL", () => {
    delete process.env.API_BASE_URL;
    expect(getApiBaseUrl()).toBe("http://api:8000");
  });

  it("normalizes to the origin so endpoint paths cannot smuggle input", () => {
    process.env.API_BASE_URL = "http://api:8000/some/prefix/";
    expect(getApiBaseUrl()).toBe("http://api:8000");
  });

  it.each(["not-a-url", "ftp://files.example", "http://user:pass@api:8000"])(
    "rejects misconfiguration %s",
    (value) => {
      process.env.API_BASE_URL = value;
      expect(() => getApiBaseUrl()).toThrow();
    },
  );
});

describe("getVerifyTimeoutMs", () => {
  it("defaults to a bounded timeout", () => {
    delete process.env.AUTH_VERIFY_TIMEOUT_MS;
    const timeout = getVerifyTimeoutMs();
    expect(timeout).toBeGreaterThanOrEqual(500);
    expect(timeout).toBeLessThanOrEqual(10_000);
  });

  it("clamps absurd values instead of hanging or failing instantly", () => {
    process.env.AUTH_VERIFY_TIMEOUT_MS = "99999999";
    expect(getVerifyTimeoutMs()).toBe(10_000);
    process.env.AUTH_VERIFY_TIMEOUT_MS = "1";
    expect(getVerifyTimeoutMs()).toBe(500);
    process.env.AUTH_VERIFY_TIMEOUT_MS = "garbage";
    expect(getVerifyTimeoutMs()).toBe(2500);
  });
});
