import { beforeEach, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggle } from "./theme-toggle";

beforeEach(() => {
  document.documentElement.dataset.theme = "light";
  localStorage.clear();
});

test("switches to dark, saves the choice, and back to light", async () => {
  const user = userEvent.setup();
  render(<ThemeToggle />);
  const button = screen.getByRole("button", { name: "Dark theme" });
  expect(button.getAttribute("aria-pressed")).toBe("false");

  await user.click(button);
  expect(document.documentElement.dataset.theme).toBe("dark");
  expect(localStorage.getItem("theme")).toBe("dark");
  expect(button.getAttribute("aria-pressed")).toBe("true");

  await user.click(button);
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(localStorage.getItem("theme")).toBe("light");
});

test("reflects a theme already applied before render", () => {
  document.documentElement.dataset.theme = "dark";
  render(<ThemeToggle />);
  expect(screen.getByRole("button", { name: "Dark theme" }).getAttribute("aria-pressed")).toBe("true");
});
