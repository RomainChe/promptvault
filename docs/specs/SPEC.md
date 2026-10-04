# Spec: PromptVault

## Objective

PromptVault is a freemium web app where users store, organize and share AI prompts.
It is a **portfolio and learning project**: built end to end (Figma mockup → code →
deployment) at **zero cost**, with no real revenue. Payments run in Stripe **test mode only**.

**Users**

- Visitor: browses and copies public prompts, found through search engines.
- Free user: creates up to 10 private prompts and unlimited public prompts, full-text search.
- Pro user (test subscription): unlimited private prompts, collections, prompt variables,
  semantic search.

**Success looks like**

- A public GitHub repository with clean history, CI green, README with live demo link.
- Live on `*.vercel.app`, with a full subscription flow payable with test card `4242 4242 4242 4242`.
- Every connector used for real: Figma (mockup), Supabase (auth, DB, Edge Function),
  Stripe (Billing, webhooks, portal), Sentry (errors), Vercel (hosting), GitHub (CI).

UI language: **English**. Docs and commit messages: French is fine.

## Capability Map

| Module id | Responsibility | Depends on | Spec |
|---|---|---|---|
| identity | Magic link + GitHub OAuth, sessions, `profiles` | — | [SPEC-identity.md](SPEC-identity.md) |
| billing | Stripe Checkout, webhooks, customer portal, `getPlan(userId)` | identity | [SPEC-billing.md](SPEC-billing.md) |
| prompts | CRUD, private/public, public SEO pages, `{{variables}}`, free quota | identity, billing | [SPEC-prompts.md](SPEC-prompts.md) |
| collections | Pro folders of prompts | prompts, billing | [SPEC-collections.md](SPEC-collections.md) |
| search | Full-text for all, semantic (gte-small + pgvector) for Pro | prompts, billing | [SPEC-search.md](SPEC-search.md) |

Build order: **foundation → identity → billing → prompts → collections ∥ search**.

Foundation (not a module): Figma mockup, Next.js scaffold, Tailwind, Sentry, CI, first Vercel deploy.

## Design

Figma file: <https://www.figma.com/design/qRtuvfqLA79H5nk1CN77aC> (page "Directions").

- **Layout and light theme = direction A** (Clean SaaS): Inter, centered hero, indigo accent.
- **Dark theme = direction B palette** (Dev terminal): near-black surfaces, lime accent;
  JetBrains Mono for prompt bodies and code in both themes.
- **Theme switch** button in the nav (sun/moon icon, `aria-label`, `aria-pressed`).
  First visit follows `prefers-color-scheme`; the choice is saved in `localStorage` and applied
  before first paint (no flash). Tokens are CSS variables consumed by Tailwind.

| Token | Light (A) | Dark (B) |
|---|---|---|
| `bg` | `#FFFFFF` | `#0B0F14` |
| `surface` | `#FFFFFF` | `#131A22` |
| `surface-2` | `#F1F5F9` | `#1A2330` |
| `border` | `#E2E8F0` | `#2A3544` |
| `text` | `#0F172A` | `#E6EDF3` |
| `muted` | `#475569` | `#9AA7B4` |
| `accent` | `#4F46E5` | `#A3E635` |
| `on-accent` | `#FFFFFF` | `#0B0F14` |

## Tech Stack

All free tiers. Versions: latest stable at install time, pinned in `package-lock.json`.

| Concern | Choice | Free tier note |
|---|---|---|
| Framework | Next.js (App Router) + React + TypeScript (strict) | — |
| Styling | Tailwind CSS | — |
| Auth, DB, storage, functions | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) | 2 free projects: `dev` and `prod`; paused after 7 days idle |
| Embeddings | Supabase Edge Function with built-in `gte-small` (384 dims) + `pgvector` | No paid AI API |
| Payments | Stripe (`stripe` SDK), **test mode only** | Free forever in test mode |
| Validation | `zod` at every trust boundary (server actions, route handlers) | — |
| Errors | Sentry (`@sentry/nextjs`) | Developer plan |
| Hosting | Vercel Hobby, `promptvault-<x>.vercel.app` | Non-commercial use only — fits |
| Design | Figma Starter | MCP call quota is limited |
| CI | GitHub Actions | Free for public repos |

## Commands

```bash
npm run dev          # next dev on http://localhost:3000
npm run build        # next build
npm run start        # serve the production build
npm run lint         # eslint .
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run test:e2e     # playwright test
npx supabase db push --db-url "$SUPABASE_DB_URL"        # apply migrations to a remote project
stripe listen --forward-to localhost:3000/api/stripe/webhook   # local webhooks (Stripe CLI)
```

## Project Structure

```text
promptvault/                  → own git repo (ignored by WebstormProject)
  src/app/                    → routes (App Router)
    (marketing)/              → landing, pricing (public, SEO)
    p/[slug]/                 → public prompt page (SEO)
    app/                      → authenticated area (dashboard, prompts, collections, settings)
    api/stripe/webhook/       → Stripe webhook route handler
    auth/callback/            → Supabase OAuth / magic link callback
  src/components/             → shared UI components
  src/lib/<module>/           → module logic: identity, billing, prompts, collections, search
  src/lib/supabase/           → server / browser / admin clients
  supabase/migrations/        → SQL migrations (schema + RLS), source of truth for the DB
  supabase/functions/embed/   → Edge Function computing gte-small embeddings
  e2e/                        → Playwright specs
  *.test.ts(x)                → unit tests next to the code they test
docs/promptvault/             → README.md, architecture.md (in the WebstormProject repo)
```

## Code Style

- TypeScript strict, no `any`. Server Components by default; `"use client"` only where needed.
- Mutations are Server Actions that validate with zod, then rely on RLS — never trust the client.
- Business rules that protect data live in the database (RLS, constraints, triggers), not only in the UI.
- Named exports, kebab-case file names, `camelCase` functions, `PascalCase` components.
- Existing workspace Prettier and ESLint configs apply.

```ts
// src/lib/prompts/actions.ts
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

const PromptInput = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(10_000),
  visibility: z.enum(["private", "public"]),
});

export async function createPrompt(input: unknown) {
  const parsed = PromptInput.safeParse(input);
  if (!parsed.success) return { error: "Invalid prompt." } as const;

  const supabase = await createServerClient();
  const { error } = await supabase.from("prompts").insert(parsed.data);
  if (error) return { error: "Could not save the prompt." } as const;

  revalidatePath("/app/prompts");
  return { ok: true } as const;
}
```

## Testing Strategy

| Level | Tool | Covers | Location |
|---|---|---|---|
| Unit | Vitest | Pure logic: variable parsing, plan resolution, slug generation, webhook event mapping | `*.test.ts` next to code |
| Component | Vitest + Testing Library | Forms, empty/loading/error/success states, Pro gating UI | `*.test.tsx` next to code |
| Database | SQL checks run against the `dev` project | RLS: a user cannot read/update another user's private prompt; quota trigger | `supabase/tests/` |
| E2E | Playwright | Critical paths: sign-in, create prompt, upgrade to Pro with test card, public page | `e2e/` |

- Every new function, hook or component with logic ships with its test in the same task.
- Bugs: failing test first, then fix.
- No coverage percentage target; every acceptance criterion in module specs maps to at least one test.

## Boundaries

**Always**

- Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` before declaring a task done.
- Enable RLS on every table in the same migration that creates it.
- Validate all inputs server side with zod; verify the Stripe webhook signature.
- Handle and show loading, empty, error and success states on every data screen.
- Update `docs/promptvault/` in the same task as the code it describes.
- Check UI with `playwright-cli` at 375 px and 1280 px, keyboard navigation included.

**Ask first**

- Installing any dependency (including Supabase CLI, Stripe CLI).
- Applying a migration to a remote Supabase project; any write to Vercel, Stripe or Supabase.
- `git commit`, `git push`, creating the GitHub repository.
- Deploying to production (Vercel promote).
- Adding a new table, column or personal data field.

**Never**

- Use Stripe live keys or a paid API or plan.
- Commit `.env*` (except `.env.example`), expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` to the client.
- Use `innerHTML` / `dangerouslySetInnerHTML` with user content.
- Load tracking scripts or non-essential cookies.
- Weaken a test, lint rule or RLS policy to make something pass.

## Success Criteria

- [ ] All module specs' acceptance criteria pass their tests.
- [ ] CI (lint, typecheck, unit, build) green on `main`.
- [ ] Production URL live; a new user can sign up, create a prompt, subscribe with a test card,
      become Pro, and cancel through the customer portal.
- [ ] Lighthouse on landing and a public prompt page: LCP < 2.5 s, CLS < 0.1, accessibility ≥ 95.
- [ ] Supabase `get_advisors` (security, performance): no errors.
- [ ] No unhandled error in Sentry after a full e2e run against production.
- [ ] `docs/promptvault/README.md` and `architecture.md` written, `docs/README.md` index updated.

## Decisions

1. **Stripe CLI** installed by the user with `scoop install stripe` for local webhooks.
2. **Supabase CLI** used through `npx supabase`, no global install. No Docker, so no local
   stack: we develop against the `dev` project.
3. **GitHub OAuth**: the user creates a free OAuth App on GitHub (manual step).
4. Accounts already exist: Figma, Supabase, Stripe, Sentry, Vercel.
