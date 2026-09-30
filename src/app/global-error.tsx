"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-2xl font-bold">Something went wrong</h1>
        <p className="text-muted">The error has been reported. You can try again.</p>
        <button type="button" onClick={reset} className="rounded-lg bg-accent px-5 py-3 font-semibold text-on-accent">
          Try again
        </button>
      </body>
    </html>
  );
}
