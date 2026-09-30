import { expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import Home from "./page";

test("landing page shows one h1, the search form and trending prompts", () => {
  render(<Home />);
  expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  expect(screen.getByRole("searchbox", { name: "Search prompts" })).toBeTruthy();
  expect(screen.getAllByRole("article")).toHaveLength(3);
});
