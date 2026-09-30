import * as Sentry from "@sentry/nextjs";

// @sentry/nextjs resolves the right SDK for the Node.js and Edge runtimes.
export function register() {
  Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN });
}

export const onRequestError = Sentry.captureRequestError;
