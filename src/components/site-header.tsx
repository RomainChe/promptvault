import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <nav aria-label="Main" className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold">
          <span aria-hidden="true" className="size-6 rounded-md bg-accent" />
          PromptVault
        </Link>
        <div className="flex items-center gap-3 sm:gap-7">
          <Link href="/explore" className="hidden text-sm font-medium text-muted hover:text-fg sm:inline">
            Explore
          </Link>
          <Link href="/pricing" className="hidden text-sm font-medium text-muted hover:text-fg sm:inline">
            Pricing
          </Link>
          <ThemeToggle />
          <Link href="/sign-in" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">
            Sign in
          </Link>
        </div>
      </nav>
    </header>
  );
}
