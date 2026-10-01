import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { MagicLinkState } from "@/lib/identity/actions";

let resolve: (state: MagicLinkState) => void = () => {};
const sendMagicLink = vi.fn(() => new Promise<MagicLinkState>((r) => (resolve = r)));
vi.mock("@/lib/identity/actions", () => ({ sendMagicLink: (...args: unknown[]) => sendMagicLink(...(args as [])) }));

const { SignInForm } = await import("./sign-in-form");

async function submit(email: string) {
  render(<SignInForm next="/app" />);
  await userEvent.type(screen.getByLabelText("Email"), email);
  await userEvent.click(screen.getByRole("button", { name: "Send magic link" }));
}

test("disables submit while sending, then says to check the inbox", async () => {
  await submit("jane@example.com");
  expect(screen.getByRole("button", { name: "Sending…" })).toHaveProperty("disabled", true);
  resolve({ status: "sent", email: "jane@example.com" });
  expect(await screen.findByText(/Check your inbox/)).toBeTruthy();
});

test("shows a text error next to the field for an invalid email", async () => {
  await submit("jane");
  resolve({ status: "invalid", email: "jane" });
  const error = await screen.findByText("Enter a valid email address.");
  expect(screen.getByLabelText("Email").getAttribute("aria-describedby")).toBe(error.id);
  expect(screen.getByLabelText("Email")).toHaveProperty("value", "jane");
});

test("shows a retry message when sending fails", async () => {
  await submit("jane@example.com");
  resolve({ status: "error", email: "jane@example.com" });
  expect((await screen.findByRole("alert")).textContent).toMatch(/couldn’t send/i);
});
