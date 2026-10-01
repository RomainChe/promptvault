import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { signOut } from "@/lib/identity/actions";
import { requireUser } from "@/lib/identity/session";

export const metadata: Metadata = { title: "My prompts — PromptVault", robots: { index: false } };

export default async function Page() {
  const user = await requireUser();
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-start gap-4 px-4 py-16 sm:px-8">
        <h1 className="text-3xl font-bold">My prompts</h1>
        <p className="text-muted">
          Signed in as <span className="font-semibold text-fg">{user.email}</span>. Your prompts arrive in a later
          release.
        </p>
        <form action={signOut}>
          <button type="submit" className="rounded-lg border border-border px-4 py-2 text-sm font-semibold">
            Sign out
          </button>
        </form>
      </main>
    </>
  );
}
