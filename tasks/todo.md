# PromptVault — Tasks

Definition of done for **every** task (from the workspace CLAUDE.md), not repeated below:
`npm run lint`, `npm run typecheck`, `npm test`, `npm run build` pass; UI checked with
`playwright-cli` at 375 px and 1280 px, keyboard included, console and network clean;
`docs/promptvault/` updated when behaviour or setup changes.

⚠️ = needs your approval or a manual step from you.

---

## Phase 0 — Foundation

### Task 1: Figma mockup of the six key screens ⚠️

**Description:** Design landing, pricing, sign-in, dashboard (prompt list), prompt form and public
prompt page, mobile and desktop, with a small token set (colors, type scale, spacing, radius).

**Acceptance criteria:**
- [ ] 6 screens × 2 widths in one Figma file, tokens defined as Figma variables.
- [ ] Text contrast ≥ 4.5:1 on all tokens used for text.

**Verification:** `get_screenshot` of each frame reviewed with you.

**Dependencies:** None · **Files:** none (Figma) · **Scope:** M

### Task 2: Next.js scaffold, tooling and static landing page ⚠️

**Description:** `create-next-app` (TS, Tailwind, ESLint, App Router, `src/`), add Vitest +
Testing Library + Playwright, scripts from SPEC.md, `.env.example`, `git init`. Build the landing
page from the mockup (static). Create `docs/promptvault/README.md`, `architecture.md`, index line.

**Acceptance criteria:**
- [ ] All SPEC.md commands run; one component test and one Playwright smoke test pass.
- [ ] Landing matches the mockup at 375 and 1280 px, one `<h1>`, `lang="en"`, meta tags.

**Verification:** `npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e`.

**Dependencies:** 1 · **Files:** `package.json`, `src/app/(marketing)/page.tsx`, `src/app/layout.tsx`,
`vitest.config.ts`, `playwright.config.ts`, `.env.example` · **Scope:** M

### Task 3: GitHub repo, CI and first Vercel preview ⚠️

**Description:** Public GitHub repo, GitHub Actions running lint, typecheck, unit tests and build
on push/PR. Import into Vercel (Hobby), preview deploys on each branch.

**Acceptance criteria:**
- [ ] CI green on the first PR.
- [ ] Preview URL serves the landing page.

**Verification:** Vercel MCP build status and logs; `playwright-cli` on the preview URL.

**Dependencies:** 2 · **Files:** `.github/workflows/ci.yml` · **Scope:** S

### Task 4: Sentry wired and security headers

**Description:** `@sentry/nextjs` (client, server, edge), source maps upload in CI build.
Security headers in `next.config.ts`: CSP, HSTS, nosniff, Referrer-Policy.

**Acceptance criteria:**
- [ ] A thrown error on a temporary route appears in Sentry with a readable stack; route removed after.
- [ ] Headers present on the preview (checked with `curl -I`); no CSP violation in console.

**Verification:** Sentry MCP `search_issues`; `curl -I <preview>`.

**Dependencies:** 3 · **Files:** `sentry.*.config.ts`, `instrumentation.ts`, `next.config.ts`, `.env.example` · **Scope:** M

### Checkpoint A
- [ ] Preview live, CI green, Sentry receives errors, headers set. Review with you.

---

## Phase 1 — identity (see SPEC-identity.md)

### Task 5: Supabase clients, `profiles` table, protected `/app` ⚠️

**Description:** Create `dev` Supabase project. Server/browser/admin clients with `@supabase/ssr`,
middleware refreshing the session and redirecting `/app/**` when signed out. Migration: `profiles`
+ RLS + trigger on `auth.users`. `safeNextPath()` helper.

**Acceptance criteria:**
- [x] `/app` signed out → `/sign-in?next=/app`.
- [x] `safeNextPath` rejects `https://evil.com` and `//evil.com`.
- [x] Migration applied to `dev`; `get_advisors` clean.

**Verification:** unit tests; `curl -I localhost:3000/app` shows the redirect.

**Dependencies:** 2 · **Files:** `src/lib/supabase/{server,browser,admin}.ts`, `src/middleware.ts`,
`src/lib/identity/safe-next-path.ts`, `supabase/migrations/0001_profiles.sql` · **Scope:** M

### Task 6: Magic link sign-in and sign-out

**Acceptance criteria:**
- [ ] Form states: idle, invalid email (text error), sending, "Check your inbox", error.
- [ ] Clicking the e-mailed link lands on `/app` with a `profiles` row created.
- [ ] Sign-out returns to `/` and `/app` redirects again.

**Verification:** component test of the form; manual magic link on localhost.

**Dependencies:** 5 · **Files:** `src/app/sign-in/page.tsx`, `src/app/sign-in/sign-in-form.tsx`,
`src/app/auth/callback/route.ts`, `src/lib/identity/actions.ts` · **Scope:** M

### Task 7: GitHub OAuth sign-in ⚠️

**Description:** You create a GitHub OAuth App (callback = Supabase auth URL); enable the provider
in Supabase; add "Continue with GitHub".

**Acceptance criteria:**
- [ ] GitHub sign-in lands on `/app`; username derived from the GitHub login.

**Verification:** manual sign-in on localhost and on the preview.

**Dependencies:** 6 · **Files:** `src/app/sign-in/sign-in-form.tsx`, `src/lib/identity/actions.ts` · **Scope:** S

### Task 8: Settings: username and account deletion

**Acceptance criteria:**
- [ ] Username change validated (regex, uniqueness error in text).
- [ ] "Delete my account" with confirmation dialog deletes the auth user and signs out.

**Verification:** component tests; manual deletion of a throwaway account; row gone in `dev`.

**Dependencies:** 6 · **Files:** `src/app/app/settings/page.tsx`, `src/app/app/settings/*.tsx`,
`src/lib/identity/actions.ts` · **Scope:** M

### Task 9: Playwright authenticated setup

**Description:** Setup project creating a password test user in `dev` via admin API and saving
`storageState`; e2e for protected redirect and sign-out.

**Acceptance criteria:**
- [ ] `npm run test:e2e` runs signed-in specs without e-mail.

**Verification:** `npm run test:e2e`.

**Dependencies:** 5 · **Files:** `e2e/auth.setup.ts`, `e2e/identity.spec.ts`, `playwright.config.ts` · **Scope:** S

### Checkpoint B
- [ ] Both sign-in methods work on the preview; advisors clean; e2e green. Review with you.

---

## Phase 2 — billing (see SPEC-billing.md)

### Task 10: `subscriptions` table, `is_pro()`, `getPlan()` ⚠️

**Acceptance criteria:**
- [ ] Migration with RLS (owner select only, no write policy) and `is_pro(uid)`.
- [ ] `planFromStatus` and test-key guard (`sk_test_` only) unit-tested.
- [ ] A user cannot insert into `subscriptions` with the anon key (DB test).

**Verification:** unit tests; SQL test against `dev`.

**Dependencies:** 5 · **Files:** `supabase/migrations/0002_subscriptions.sql`, `src/lib/billing/plan.ts`,
`src/lib/billing/stripe.ts`, `supabase/tests/subscriptions.sql` · **Scope:** M

### Task 11: Pricing page and Stripe Checkout ⚠️

**Description:** Create Product "Pro" + monthly Price in Stripe test mode (your approval).
Pricing page (Free vs Pro), "Upgrade" server action creating customer + Checkout Session.

**Acceptance criteria:**
- [ ] Signed out "Upgrade" → sign-in; signed in → Stripe hosted Checkout.
- [ ] Customer reused on a second attempt (no duplicate customer).

**Verification:** manual Checkout redirect; Stripe MCP read of customers.

**Dependencies:** 10 · **Files:** `src/app/(marketing)/pricing/page.tsx`, `src/lib/billing/actions.ts` · **Scope:** S

### Task 12: Stripe webhook and success page ⚠️

**Description:** You install Stripe CLI. `POST /api/stripe/webhook` verifying signature,
`mapSubscriptionEvent`, upsert with admin client. `/app/billing/success` polls plan until Pro.

**Acceptance criteria:**
- [ ] Card `4242…` → Pro within seconds; card `4000 0000 0000 0341` → stays free, error shown.
- [ ] Bad signature → 400, no write; unknown event → 200, no write; replayed event idempotent.

**Verification:** unit tests of mapper; route handler tests; `stripe trigger` + manual Checkout.

**Dependencies:** 11 · **Files:** `src/app/api/stripe/webhook/route.ts`, `src/lib/billing/webhook.ts`,
`src/app/app/billing/success/page.tsx` · **Scope:** M

### Task 13: Customer portal and plan in settings

**Acceptance criteria:**
- [ ] Settings shows plan and renewal/end date; "Manage subscription" opens the portal.
- [ ] Cancel at period end keeps Pro until `current_period_end`.
- [ ] E2E: upgrade with test card on hosted Checkout.

**Verification:** `npm run test:e2e`; manual cancel in portal.

**Dependencies:** 12, 9 · **Files:** `src/app/app/settings/plan-section.tsx`, `src/lib/billing/actions.ts`,
`e2e/billing.spec.ts` · **Scope:** M

### Checkpoint C
- [ ] Full upgrade/cancel flow on the preview (test-mode webhook endpoint). Review with you.

---

## Phase 3 — prompts (see SPEC-prompts.md)

### Task 14: `prompts` table, RLS and free quota trigger ⚠️

**Acceptance criteria:**
- [ ] Two-user test: B cannot select/update/delete A's private prompt.
- [ ] Free user: 11th private insert rejected by the DB; Pro user: accepted.

**Verification:** `supabase/tests/prompts.sql` against `dev`; `get_advisors`.

**Dependencies:** 10 · **Files:** `supabase/migrations/0003_prompts.sql`, `supabase/tests/prompts.sql` · **Scope:** S

### Task 15: Create and list private prompts

**Acceptance criteria:**
- [ ] Form with zod validation, field errors in text.
- [ ] List with loading, empty, error, success states and "n / 10 private" banner for free.

**Verification:** component tests (form, list states, banner).

**Dependencies:** 14 · **Files:** `src/lib/prompts/actions.ts`, `src/app/app/prompts/page.tsx`,
`src/app/app/prompts/new/page.tsx`, `src/components/prompt-form.tsx` · **Scope:** M

### Task 16: Edit and delete a prompt

**Acceptance criteria:**
- [ ] Edit pre-fills the form; delete asks for confirmation (keyboard-accessible dialog).

**Verification:** component tests; manual keyboard check.

**Dependencies:** 15 · **Files:** `src/app/app/prompts/[id]/page.tsx`, `src/lib/prompts/actions.ts`,
`src/components/confirm-dialog.tsx` · **Scope:** S

### Task 17: Publish a prompt: public page with SEO

**Acceptance criteria:**
- [ ] Public → stable slug; back to private → `/p/[slug]` 404.
- [ ] `/p/[slug]`: title, description, canonical, OG, one `<h1>`, JSON-LD, body as text, Copy with live feedback.

**Verification:** `slugify` unit test; `playwright-cli` signed out; Lighthouse on preview.

**Dependencies:** 16 · **Files:** `src/app/p/[slug]/page.tsx`, `src/lib/prompts/slug.ts`,
`src/components/copy-button.tsx` · **Scope:** M

### Task 18: Explore page, sitemap and robots

**Acceptance criteria:**
- [ ] `/explore` paginates public prompts (20 / page) with four states.
- [ ] `sitemap.xml` lists public prompts; `robots.txt` disallows `/app`.

**Verification:** component test; `curl` on both files.

**Dependencies:** 17 · **Files:** `src/app/explore/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts` · **Scope:** S

### Task 19: Prompt variables (Pro)

**Acceptance criteria:**
- [ ] `extractVariables` / `fillVariables` behave as in the spec (unit tests incl. edge cases).
- [ ] Pro: "Use" form with preview then copy; Free: raw copy + upgrade hint.

**Verification:** unit + component tests.

**Dependencies:** 17, 13 · **Files:** `src/lib/prompts/variables.ts`, `src/components/use-prompt-form.tsx` · **Scope:** S

### Checkpoint D
- [ ] E2E create → publish → view signed out → copy passes; public page meets CWV. Review with you.

---

## Phase 4 — collections ∥ search

### Task 20: Collections: table, RLS, CRUD page ⚠️

**Acceptance criteria:**
- [ ] Pro creates/renames/deletes; duplicate name error in text; Free sees upgrade page.
- [ ] DB: Pro-only insert, owner isolation, cross-owner link rejected.

**Verification:** SQL tests; component tests.

**Dependencies:** 14 · **Files:** `supabase/migrations/0004_collections.sql`, `supabase/tests/collections.sql`,
`src/app/app/collections/page.tsx`, `src/lib/collections/actions.ts` · **Scope:** M

### Task 21: Add prompts to collections, collection page

**Acceptance criteria:**
- [ ] Picker on the prompt page adds/removes; `/app/collections/[id]` lists with four states.

**Verification:** component tests; manual keyboard check.

**Dependencies:** 20, 16 · **Files:** `src/components/collection-picker.tsx`,
`src/app/app/collections/[id]/page.tsx`, `src/lib/collections/actions.ts` · **Scope:** S

### Task 22: Full-text search ⚠️

**Acceptance criteria:**
- [ ] `fts` column + GIN index + `search_prompts` (security invoker).
- [ ] Labelled, debounced search input syncing `?q=` on `/explore` and `/app/prompts`.
- [ ] RLS test: never returns another user's private prompt.

**Verification:** SQL test; unit test of debounce hook; component test.

**Dependencies:** 18 · **Files:** `supabase/migrations/0005_search.sql`, `src/components/search-input.tsx`,
`src/lib/search/use-debounce.ts`, `supabase/tests/search.sql` · **Scope:** M

### Task 23: `embed` Edge Function and embeddings on save ⚠️

**Acceptance criteria:**
- [ ] Deployed function: 401 without JWT, 384 floats with one.
- [ ] Saving a prompt fills `embedding`; failure keeps the save and reports to Sentry; re-index action works.

**Verification:** `curl` on the function; manual save; row check in `dev`.

**Dependencies:** 22 · **Files:** `supabase/functions/embed/index.ts`, `supabase/migrations/0006_embeddings.sql`,
`src/lib/search/embed.ts`, `src/lib/prompts/actions.ts` · **Scope:** M

### Task 24: Semantic search (Pro)

**Acceptance criteria:**
- [ ] `match_prompts` (security invoker, threshold 0.75); seeded fixture finds "Job application email"
      for "write a cover letter".
- [ ] Free: toggle disabled with explanation; server rejects semantic request.

**Verification:** SQL test; e2e `e2e/search.spec.ts` with Pro test user.

**Dependencies:** 23, 13 · **Files:** `supabase/migrations/0007_match_prompts.sql`, `src/lib/search/actions.ts`,
`src/components/search-input.tsx`, `e2e/search.spec.ts` · **Scope:** M

### Checkpoint E
- [ ] Every acceptance criterion of the 5 module specs maps to a passing test. Review with you.

---

## Phase 5 — launch

### Task 25: Production environment ⚠️

**Description:** Second Supabase project `prod`, migrations pushed, Edge Function deployed, auth
redirect URLs, Stripe test-mode webhook endpoint on the production URL, Vercel production env vars.
Promote to production only with your go.

**Acceptance criteria:**
- [ ] Production URL: sign-up → prompt → upgrade → cancel works with test cards.

**Verification:** `playwright-cli` on production; Vercel runtime logs; Sentry issues.

**Dependencies:** Checkpoint E · **Files:** `docs/promptvault/README.md` · **Scope:** S

### Task 26: Final audits and portfolio README

**Description:** `agent-skills:web-performance-auditor`, `agent-skills:security-auditor`,
`agent-skills:code-reviewer`; `get_advisors`; fix findings. Repo README: demo link, screenshots,
architecture diagram, "how it's free".

**Acceptance criteria:**
- [ ] Lighthouse landing + public page: LCP < 2.5 s, CLS < 0.1, accessibility ≥ 95.
- [ ] No high/critical finding left; `npm audit` no high/critical.

**Verification:** audit reports; Lighthouse output.

**Dependencies:** 25 · **Files:** `README.md`, fixes as found · **Scope:** M

### Checkpoint F
- [ ] All SPEC.md success criteria checked.
