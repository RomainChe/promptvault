import { expect, test } from "vitest";
import { buildCsp } from "./csp";

const directive = (csp: string, name: string) => csp.split("; ").find((d) => d.startsWith(`${name} `));

test("production policy allows only nonce scripts, no eval or inline", () => {
  const csp = buildCsp("abc", false);
  expect(directive(csp, "script-src")).toBe("script-src 'self' 'nonce-abc' 'strict-dynamic'");
  expect(directive(csp, "style-src")).toBe("style-src 'self' 'nonce-abc'");
  expect(csp).not.toContain("unsafe");
  expect(directive(csp, "frame-ancestors")).toBe("frame-ancestors 'none'");
  expect(directive(csp, "connect-src")).toBe("connect-src 'self'");
});

test("development adds eval for React debugging", () => {
  expect(directive(buildCsp("abc", true), "script-src")).toContain("'unsafe-eval'");
});
