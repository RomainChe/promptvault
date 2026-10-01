import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { signInWithGitHub } from "@/lib/identity/actions";
import { safeNextPath } from "@/lib/identity/safe-next-path";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in — PromptVault", robots: { index: false } };

export default async function Page({ searchParams }: PageProps<"/sign-in">) {
  const { next, error } = await searchParams;
  const nextPath = safeNextPath(typeof next === "string" ? next : null);
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-16 sm:py-24">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Sign in</h1>
          <p className="text-muted">No password needed: use GitHub or a link sent by email.</p>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            Sign-in didn’t complete: the link may have expired or GitHub access was refused. Try again.
          </p>
        )}
        <form action={signInWithGitHub}>
          <input type="hidden" name="next" value={nextPath} />
          <button
            type="submit"
            className="w-full rounded-lg border border-border bg-surface px-5 py-3 font-semibold hover:bg-surface-2"
          >
            Continue with GitHub
          </button>
        </form>
        <p className="flex items-center gap-3 text-sm text-muted before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
          or
        </p>
        <SignInForm next={nextPath} />
      </main>
    </>
  );
}
