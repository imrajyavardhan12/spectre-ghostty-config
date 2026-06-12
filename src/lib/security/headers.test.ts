import { describe, it, expect } from "vitest";
import { buildSecurityHeaders } from "@/lib/security/headers";

describe("buildSecurityHeaders", () => {
  it("includes the canonical header set in production", () => {
    const { headers } = buildSecurityHeaders(false);

    expect(headers["X-Frame-Options"]).toBe("DENY");
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
    expect(headers["Cross-Origin-Resource-Policy"]).toBe("same-origin");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=63072000");
    expect(headers["Content-Security-Policy"]).toBeDefined();
  });

  it("sets a strict COEP in production", () => {
    const { headers } = buildSecurityHeaders(false);
    // credentialless is the right pick for an app that loads same-origin
    // WASM alongside cross-origin user-driven images.
    expect(headers["Cross-Origin-Embedder-Policy"]).toBe("credentialless");
  });

  it("omits COEP in development to avoid breaking Turbopack", () => {
    const { headers } = buildSecurityHeaders(true);
    expect(headers["Cross-Origin-Embedder-Policy"]).toBeUndefined();
  });

  it("disables browser features Spectre does not need", () => {
    const { headers } = buildSecurityHeaders(false);
    const policy = headers["Permissions-Policy"];

    expect(policy).toBeDefined();
    for (const feature of [
      "camera",
      "microphone",
      "geolocation",
      "payment",
      "usb",
    ]) {
      expect(policy).toContain(`${feature}=()`);
    }
  });

  it("still sets HSTS in development (browsers ignore it over HTTP)", () => {
    const { headers } = buildSecurityHeaders(true);
    expect(headers["Strict-Transport-Security"]).toContain("max-age=63072000");
  });

  it("CSP is stricter in production than in development", () => {
    const { headers: prod } = buildSecurityHeaders(false);
    const { headers: dev } = buildSecurityHeaders(true);

    expect(dev["Content-Security-Policy"]).toContain("'unsafe-eval'");
    expect(prod["Content-Security-Policy"]).not.toContain("'unsafe-eval'");
  });
});
