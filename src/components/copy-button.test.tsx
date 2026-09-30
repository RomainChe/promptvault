import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton } from "./copy-button";

test("copies the text and announces it", async () => {
  const user = userEvent.setup();
  render(<CopyButton text="Hello {{name}}" name="Greeting" />);

  await user.click(screen.getByRole("button", { name: /copy prompt “Greeting”/i }));

  expect(await navigator.clipboard.readText()).toBe("Hello {{name}}");
  expect(screen.getByRole("status").textContent).toBe("Copied");
});

test("announces a failure when the clipboard is unavailable", async () => {
  const user = userEvent.setup();
  vi.spyOn(navigator.clipboard, "writeText").mockRejectedValueOnce(new Error("denied"));
  render(<CopyButton text="x" name="X" />);

  await user.click(screen.getByRole("button"));

  expect(screen.getByRole("status").textContent).toBe("Copy failed");
});
