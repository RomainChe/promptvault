"use client";

import { useState } from "react";

const labels = { idle: "Copy", copied: "Copied", error: "Copy failed" } as const;

export function CopyButton({ text, name }: { text: string; name: string }) {
  const [status, setStatus] = useState<keyof typeof labels>("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
    } catch {
      setStatus("error");
    }
    setTimeout(() => setStatus("idle"), 2000);
  }

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy prompt “${name}”`}
        className="text-sm font-semibold text-accent hover:underline"
      >
        {labels[status]}
      </button>
      <span role="status" className="sr-only">
        {status === "idle" ? "" : labels[status]}
      </span>
    </>
  );
}
