import type { NextConfig } from "next";
import { buildSecurityHeaders } from "./src/lib/security/headers";

const isDev = process.env.NODE_ENV !== "production";
const { headers: securityHeaders } = buildSecurityHeaders(isDev);

const nextConfig: NextConfig = {
  // Enable Turbopack with empty config to allow default behavior
  turbopack: {},

  // Apply a single, auditable set of security headers to every route.
  // The header values are built in src/lib/security/headers.ts; any new
  // header (or change to an existing one) should be made there.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: Object.entries(securityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
    ];
  },
};

export default nextConfig;
