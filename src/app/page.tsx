import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { SiteHeader } from "@/components/site-header";

// ponytail: static sample until the prompts module exists (task 18 replaces it with real public prompts).
const trending = [
  {
    tag: "Writing",
    title: "Job application email",
    body: "Write a concise cover email for the {{role}} position at {{company}}, highlighting {{skill}} and ending with a clear call to action.",
    author: "marie",
  },
  {
    tag: "Code",
    title: "Explain this stack trace",
    body: "You are a senior {{language}} engineer. Explain the root cause of the error below, then propose the smallest fix.",
    author: "dev_tom",
  },
  {
    tag: "Marketing",
    title: "Landing page hero copy",
    body: "Generate 5 headline options for {{product}} aimed at {{audience}}. Max 8 words each, no buzzwords.",
    author: "lea",
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-8">
        <section className="flex flex-col items-center gap-6 pt-16 pb-12 text-center sm:pt-24">
          <p className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted">
            Free &amp; open source · Semantic search
          </p>
          <h1 className="max-w-4xl text-4xl leading-tight font-bold tracking-tight text-balance sm:text-6xl">
            Your AI prompts, organized and shareable.
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-muted sm:text-xl">
            Save, organize and share your AI prompts. Find any of them by meaning with semantic search — free to start.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/sign-in" className="rounded-lg bg-accent px-5 py-3 font-semibold text-on-accent">
              Get started free
            </Link>
            <Link href="/explore" className="rounded-lg border border-border px-5 py-3 font-semibold">
              Explore prompts
            </Link>
          </div>
          <form action="/explore" role="search" className="mt-2 flex w-full max-w-xl items-center gap-2 rounded-lg border border-border bg-surface p-2 pl-4">
            <label htmlFor="q" className="sr-only">
              Search prompts
            </label>
            <input
              id="q"
              name="q"
              type="search"
              placeholder="Search prompts… e.g. “write a cover letter”"
              className="min-w-0 flex-1 bg-transparent py-1 placeholder:text-muted"
            />
            <span className="shrink-0 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-semibold text-accent">
              Semantic · Pro
            </span>
          </form>
        </section>

        <section aria-labelledby="trending" className="pb-24">
          <h2 id="trending" className="mb-5 text-xl font-semibold">
            Trending public prompts
          </h2>
          <ul className="grid gap-6 md:grid-cols-3">
            {trending.map((p) => (
              <li key={p.title}>
                <article className="flex h-full flex-col gap-3 rounded-xl border border-border bg-surface p-6">
                  <p className="w-fit rounded-full border border-border bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
                    {p.tag}
                  </p>
                  <h3 className="text-lg font-semibold">{p.title}</h3>
                  <p className="flex-1 font-mono text-sm leading-relaxed text-muted">{p.body}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-muted">@{p.author}</span>
                    <CopyButton text={p.body} name={p.title} />
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
