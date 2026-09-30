import Link from "next/link";
import { SiteHeader } from "./site-header";

// ponytail: placeholder so live links don't 404; each route is replaced by its real page (tasks 6, 11, 18).
export function ComingSoon({ title }: { title: string }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted">This page is coming soon.</p>
        <Link href="/" className="font-semibold text-accent hover:underline">
          Back to home
        </Link>
      </main>
    </>
  );
}
