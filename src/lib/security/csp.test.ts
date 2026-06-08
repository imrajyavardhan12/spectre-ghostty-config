import { describe, it, expect } from "vitest";
import { buildCsp, parseCsp } from "@/lib/security/csp";

describe("buildCsp", () => {
  it("includes the baseline directives in production mode", () => {
    const csp = buildCsp(false);
    const parsed = parseCsp(csp);

    expect(parsed["default-src"]).toEqual(["'self'"]);
    expect(parsed["frame-ancestors"]).toEqual(["'none'"]);
    expect(parsed["base-uri"]).toEqual(["'self'"]);
    expect(parsed["form-action"]).toEqual(["'self'"]);
    expect(parsed["object-src"]).toEqual(["'none'"]);
    expect(parsed["media-src"]).toEqual(["'none'"]);
    expect(parsed["manifest-src"]).toEqual(["'self'"]);
  });

  it("lists every external origin the app actually uses in production", () => {
    const parsed = parseCsp(buildCsp(false));

    const scriptSrc = parsed["script-src"].join(" ");
    expect(scriptSrc).toContain("https://*.vercel-insights.com");
    expect(scriptSrc).toContain("https://*.vercel.com");
    expect(scriptSrc).toContain("blob:");

    const connectSrc = parsed["connect-src"].join(" ");
    expect(connectSrc).toContain("https://api.github.com");
    expect(connectSrc).toContain("https://raw.githubusercontent.com");

    const imgSrc = parsed["img-src"].join(" ");
    expect(imgSrc).toContain("https://cdn.buymeacoffee.com");
    expect(imgSrc).toContain("data:");
  });

  it("sets upgrade-insecure-requests in production", () => {
    const parsed = parseCsp(buildCsp(false));
    expect(parsed["upgrade-insecure-requests"]).toBeDefined();
  });

  it("does not include upgrade-insecure-requests in development", () => {
    const parsed = parseCsp(buildCsp(true));
    expect(parsed["upgrade-insecure-requests"]).toBeUndefined();
  });

  it("allows HMR primitives only in development", () => {
    const prod = parseCsp(buildCsp(false));
    const dev = parseCsp(buildCsp(true));

    expect(prod["script-src"]).not.toContain("'unsafe-eval'");
    expect(dev["script-src"]).toContain("'unsafe-eval'");

    expect(prod["connect-src"]).not.toContain("ws:");
    expect(dev["connect-src"]).toContain("ws:");
    expect(dev["connect-src"]).toContain("wss:");

    expect(prod["connect-src"]).not.toContain("http://localhost:*");
    expect(dev["connect-src"]).toContain("http://localhost:*");
  });

  it("does not require the Google Fonts hosts (next/font self-hosts)", () => {
    const parsed = parseCsp(buildCsp(false));
    const fontSrc = parsed["font-src"].join(" ");
    const styleSrc = parsed["style-src"].join(" ");

    expect(fontSrc).not.toContain("fonts.gstatic.com");
    expect(styleSrc).not.toContain("fonts.googleapis.com");
  });

  it("allows WASM helpers via blob: in script-src and worker-src", () => {
    const parsed = parseCsp(buildCsp(false));
    expect(parsed["script-src"]).toContain("blob:");
    expect(parsed["worker-src"]).toContain("blob:");
  });
});

describe("parseCsp", () => {
  it("round-trips a real CSP value", () => {
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' blob:; object-src 'none'";
    const parsed = parseCsp(csp);
    expect(parsed["default-src"]).toEqual(["'self'"]);
    expect(parsed["script-src"]).toEqual(["'self'", "'unsafe-inline'", "blob:"]);
    expect(parsed["object-src"]).toEqual(["'none'"]);
  });

  it("ignores empty directive segments", () => {
    const parsed = parseCsp("default-src 'self';;; object-src 'none'");
    expect(parsed["default-src"]).toEqual(["'self'"]);
    expect(parsed["object-src"]).toEqual(["'none'"]);
  });
});
