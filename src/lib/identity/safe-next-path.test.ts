import { expect, test } from "vitest";
import { safeNextPath } from "./safe-next-path";

test("keeps a relative path with its query and hash", () => {
  expect(safeNextPath("/app/prompts?tag=sql#top")).toBe("/app/prompts?tag=sql#top");
});

test.each(["https://evil.com", "//evil.com", "/\\evil.com", "\\\\evil.com", "javascript:alert(1)", "/.//evil.com", "/app/..//evil.com", "/%2e//evil.com", "app", ""])(
  "falls back to /app for %j",
  (next) => {
    expect(safeNextPath(next)).toBe("/app");
  },
);

test("falls back to /app when missing", () => {
  expect(safeNextPath(null)).toBe("/app");
});
