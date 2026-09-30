import * as Sentry from "@sentry/nextjs";

// Errors only: no tracing or replay, to keep the client bundle small and stay within the free plan.
Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
