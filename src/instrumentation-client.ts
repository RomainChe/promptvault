import * as Sentry from "@sentry/nextjs";

// Errors only: no tracing or replay, to keep the client bundle small and stay within the free plan.
Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });

// Required by the SDK to hook App Router navigations (no-op without tracing, silences the build warning).
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
