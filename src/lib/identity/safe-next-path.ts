const ORIGIN = "http://internal";

// Post-sign-in redirect target: same-origin paths only, so `next` can't be an open redirect.
export function safeNextPath(next: string | null): string {
  if (!next?.startsWith("/")) return "/app";
  const url = new URL(next, ORIGIN);
  const path = url.pathname + url.search + url.hash;
  // Dot segments can normalise to "//host", which browsers read as protocol-relative.
  return url.origin === ORIGIN && !path.startsWith("//") ? path : "/app";
}
