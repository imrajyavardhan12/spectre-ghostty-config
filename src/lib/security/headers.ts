// Security header construction for Spectre.
//
// All HTTP security headers are centralised here so the policy lives in one
// auditable place. The set follows the OWASP Secure Headers Project
// recommendations (https://owasp.org/www-project-secure-headers/) and is
// tailored to Spectre's specific threat model.

import { buildCsp } from "./csp";

export interface SecurityHeaderSet {
  /** Header name -> header value */
  headers: Record<string, string>;
}

/**
 * Build the full set of security headers for a request.
 *
 * @param isDev `true` relaxes the CSP to allow HMR and dev-only origins.
 *   All other headers are identical in dev and prod.
 */
export function buildSecurityHeaders(isDev: boolean): SecurityHeaderSet {
  const headers: Record<string, string> = {
    // Defence-in-depth against clickjacking. Modern browsers honour
    // CSP frame-ancestors; X-Frame-Options covers older ones.
    "X-Frame-Options": "DENY",

    // Block MIME-type sniffing - critical for any user-uploaded content
    // (in our case: imported config files and the shared URL payload).
    "X-Content-Type-Options": "nosniff",

    // Don't expose the full URL (which can include sensitive path/query
    // parameters) to third parties.
    "Referrer-Policy": "strict-origin-when-cross-origin",

    // Disable browser features Spectre has no business using. Locking
    // these down shrinks the attack surface if a future XSS slips through.
    "Permissions-Policy": [
      "accelerometer=()",
      "autoplay=()",
      "browsing-topics=()",
      "camera=()",
      "cross-origin-isolated=()",
      "display-capture=()",
      "encrypted-media=()",
      "fullscreen=(self)",
      "geolocation=()",
      "gyroscope=()",
      "keyboard-map=()",
      "magnetometer=()",
      "microphone=()",
      "midi=()",
      "payment=()",
      "picture-in-picture=()",
      "publickey-credentials-get=()",
      "screen-wake-lock=()",
      "sync-xhr=()",
      "usb=()",
      "xr-spatial-tracking=()",
    ].join(", "),

    // Prevent the page from being opened in a pop-up by another origin and
    // then having window.opener hijacked. Required for full isolation.
    "Cross-Origin-Opener-Policy": "same-origin",

    // Block no-cors cross-origin embeds of our resources. We don't need
    // to be embeddable from third-party origins.
    "Cross-Origin-Resource-Policy": "same-origin",

    // HSTS: 2 years, include subdomains, eligible for preload. Vercel
    // already sets HSTS by default, but we set it explicitly so the
    // policy is auditable in this file. Safe to ship in dev as well -
    // browsers ignore HSTS over plain HTTP.
    "Strict-Transport-Security":
      "max-age=63072000; includeSubDomains; preload",

    // Content-Security-Policy. See csp.ts for the directive-level
    // rationale.
    "Content-Security-Policy": buildCsp(isDev),
  };

  // Cross-Origin-Embedder-Policy: credentialless is the right pick for an
  // app that loads a same-origin WASM module alongside user-driven
  // cross-origin images. The strict `require-corp` value would force us
  // to add CORP/CORS headers to every external image.
  //
  // We do NOT set this in dev because the local Turbopack dev server
  // doesn't always emit the right CORP headers, and `credentialless`
  // has historically had inconsistent behaviour with localhost.
  if (!isDev) {
    headers["Cross-Origin-Embedder-Policy"] = "credentialless";
  }

  return { headers };
}
