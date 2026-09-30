import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  // The parent WebstormProject folder has its own package-lock.json; pin the root here.
  turbopack: { root: __dirname },
  // CSP is per-request (nonce) and set in src/proxy.ts; the static headers live here.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "frozzen",
  project: "promptvault",
  // Source maps upload only when SENTRY_AUTH_TOKEN is set (Vercel env).
  silent: !process.env.CI,
  // Events go through our own domain: keeps CSP connect-src 'self' and avoids ad blockers.
  tunnelRoute: "/monitoring",
});
