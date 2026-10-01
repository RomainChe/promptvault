import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { safeNextPath } from "@/lib/identity/safe-next-path";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in — PromptVault", robots: { index: false } };

export default async function Page({ searchParams }: PageProps<"/sign-in">) {
  const { next, error } = await searchParams;
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col gap-6 px-4 py-16 sm:py-24">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold">Sign in</h1>
          <p className="text-muted">No password: we email you a sign-in link.</p>
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            That sign-in link is invalid or has expired. Request a new one.
          </p>
        )}
        <SignInForm next={safeNextPath(typeof next === "string" ? next : null)} />
      </main>
    </>
  );
}
