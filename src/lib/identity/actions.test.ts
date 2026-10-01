import { beforeEach, expect, test, vi } from "vitest";

const signInWithOtp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { signInWithOtp } }) }));
vi.mock("next/headers", () => ({ headers: async () => new Headers({ origin: "https://pv.test" }) }));

const { sendMagicLink } = await import("./actions");

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  Object.entries(fields).forEach(([k, v]) => data.set(k, v));
  return data;
};

beforeEach(() => signInWithOtp.mockReset().mockResolvedValue({ error: null }));

test.each(["", "jane", "jane@", "jane@example", "a b@example.com"])("rejects %j without calling Supabase", async (email) => {
  expect(await sendMagicLink({ status: "idle" }, form({ email }))).toEqual({ status: "invalid", email });
  expect(signInWithOtp).not.toHaveBeenCalled();
});

test("sends the link back to the callback with a safe next path", async () => {
  const state = await sendMagicLink({ status: "idle" }, form({ email: " jane@example.com ", next: "//evil.com" }));
  expect(state).toEqual({ status: "sent", email: "jane@example.com" });
  expect(signInWithOtp).toHaveBeenCalledWith({
    email: "jane@example.com",
    options: { emailRedirectTo: "https://pv.test/auth/callback?next=%2Fapp" },
  });
});

test("reports a Supabase failure as an error", async () => {
  signInWithOtp.mockResolvedValue({ error: new Error("rate limit") });
  expect(await sendMagicLink({ status: "idle" }, form({ email: "jane@example.com" }))).toEqual({
    status: "error",
    email: "jane@example.com",
  });
});
