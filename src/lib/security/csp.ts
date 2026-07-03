// Content Security Policy builder.
//
// Spectre loads resources from a small, fixed set of origins. The policy below
// reflects exactly what the app needs - nothing more. Any new external
// dependency MUST be added here with a justification comment, otherwise it
// will be blocked in production.
//
// References:
//   - https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
//   - https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy

/**
 * Build a Content-Security-Policy header value.
 *
 * @param isDev `true` relaxes the policy for local development (HMR, eval,
 *   inline styles, the Vercel CLI inspector). Production builds use the
 *   strict policy regardless of `process.env.NODE_ENV`, so callers can also
 *   use this to preview the prod policy.
 *
 * Notes on each directive:
 *
 *   - default-src 'self': baseline; everything not explicitly allowed is
 *     blocked.
 *   - script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'
 *     https://*.vercel-insights.com https://*.vercel.com blob::
 *     - 'unsafe-inline' is currently required by Next.js' inline hydration
 *       scripts and by dynamically-injected styles for the WASM-backed
 *       terminal preview. Upgrading to nonce-based scripts is a known
 *       follow-up; left as a future task because it requires middleware
 *       changes.
 *     - 'wasm-unsafe-eval' allows libghostty's same-origin WebAssembly
 *       module to compile without reopening broad JavaScript eval.
 *     - blob: is required for the libghostty WASM module which loads its
 *       helpers via blob URLs.
 *     - Vercel Analytics + Speed Insights ship tiny inline scripts that
 *       phone home; we allow only the official Vercel domains.
 *   - style-src 'self' 'unsafe-inline':
 *     - 'unsafe-inline' is required for Tailwind's emitted styles and
 *       shadcn/ui's Radix primitives that set inline styles.
 *   - img-src 'self' data: https://cdn.buymeacoffee.com:
 *     - `data:` is required for the Ghostty preview's binary image data
 *       and for several SVG icons.
 *     - The only external image Spectre loads is the Buy Me a Coffee
 *       button, so the allowlist is explicit rather than `https:`.
 *   - font-src 'self' data::
 *     - `next/font/google` self-hosts Inter at build time, so Google
 *       Fonts domains are NOT required.
 *     - `data:` is needed for inlined icon fonts.
 *   - connect-src 'self' https://api.github.com https://raw.githubusercontent.com
 *     https://*.vercel-insights.com:
 *     - The themes feature fetches the iTerm2-Color-Schemes repository
 *       over the GitHub API and raw content hosts.
 *   - worker-src 'self' blob::
 *     - The libghostty WASM terminal spawns a Web Worker that uses
 *       blob: URLs for its helpers.
 *   - frame-ancestors 'none': disable embedding (anti-clickjacking).
 *     This is also reinforced by X-Frame-Options for older browsers.
 *   - base-uri 'self': prevent <base> tag injection which could
 *     re-anchor all relative URLs to an attacker-controlled origin.
 *   - form-action 'self': any future forms can only POST to our origin.
 *   - object-src 'none': no Flash, no <object>/<embed> content.
 *   - media-src 'none': the app has no audio/video.
 *   - manifest-src 'self': PWA manifest (if/when added) must be same-origin.
 *   - upgrade-insecure-requests: in prod, silently upgrade any stray
 *     http:// subresource to https://.
 */
export function buildCsp(isDev: boolean): string {
  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "'wasm-unsafe-eval'",
      "https://*.vercel-insights.com",
      "https://*.vercel.com",
      "blob:",
    ],
    "style-src": ["'self'", "'unsafe-inline'"],
    "img-src": [
      "'self'",
      "data:",
      "https://cdn.buymeacoffee.com",
    ],
    "font-src": ["'self'", "data:"],
    "connect-src": [
      "'self'",
      "https://api.github.com",
      "https://raw.githubusercontent.com",
      "https://*.vercel-insights.com",
      "https://*.vercel.com",
    ],
    "worker-src": ["'self'", "blob:"],
    "frame-ancestors": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "object-src": ["'none'"],
    "media-src": ["'none'"],
    "manifest-src": ["'self'"],
  };

  if (isDev) {
    // Development needs:
    //   - 'unsafe-eval' for webpack/turbopack HMR
    //   - ws: / wss: for the HMR WebSocket
    //   - http: localhost and 127.0.0.1 (Next.js dev server)
    directives["script-src"] = [
      ...directives["script-src"],
      "'unsafe-eval'",
    ];
    directives["connect-src"] = [
      ...directives["connect-src"],
      "ws:",
      "wss:",
      "http://localhost:*",
      "http://127.0.0.1:*",
    ];
  } else {
    // Production: force any accidentally-included http:// subresource to
    // upgrade to https. Browsers ignore this directive over HTTP itself,
    // so it's harmless on localhost.
    directives["upgrade-insecure-requests"] = [];
  }

  return Object.entries(directives)
    .map(([key, values]) =>
      values.length === 0 ? key : `${key} ${values.join(" ")}`
    )
    .join("; ");
}

/**
 * Parse a CSP header value back into a structured form. Useful for tests
 * and for tooling that wants to assert the presence of a directive.
 */
export function parseCsp(header: string): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const directive of header.split(";").map((d) => d.trim())) {
    if (!directive) continue;
    const [key, ...valueParts] = directive.split(/\s+/);
    result[key] = valueParts;
  }

  return result;
}
