# Implementation Plan: PromptVault

## Overview

Build PromptVault (see [SPEC.md](../SPEC.md)) from Figma mockup to production on Vercel, at
zero cost. Work follows the approved capability map: foundation → identity → billing →
prompts → collections ∥ search → launch. Every task is a vertical slice (migration + server
logic + UI + tests) that leaves the app deployable. Detailed tasks: [todo.md](todo.md).

## Architecture Decisions

- **Deploy early.** A preview on Vercel exists from task 3 on; each later task is checked on a
  preview, so "works locally, breaks on Vercel" surfaces immediately.
- **Database enforces the business rules.** Free quota, Pro-only collections and ownership are
  RLS policies and triggers, so a crafted API call cannot bypass the UI.
- **Billing before prompts.** `is_pro()` must exist before the quota trigger; billing stays
  ignorant of prompts (no cycle).
- **Webhook is the only writer of `subscriptions`.** The redirect after Checkout never grants Pro;
  the success page waits for the webhook. Prevents faking Pro via URL.
- **Remote `dev` Supabase project, no local stack** (no Docker). Migrations are files in
  `supabase/migrations/`, applied with `npx supabase db push` after your approval. `prod` is a
  second free project, touched only in phase 6.
- **E2E auth bypasses email.** A Playwright setup project creates a password test user in `dev`
  through the admin API; magic link and GitHub are verified manually.
- **Embedding failure never blocks a save.** `embedding` stays null and a re-index action retries.

## Task List

### Phase 0 — Foundation

- [x] 1. Figma mockup — 3 directions, A + dark B chosen (other screens designed in code: Figma Starter MCP quota)
- [x] 2. Next.js scaffold, tooling and static landing page
- [x] 3. GitHub repo, CI and first Vercel deploy — https://promptvault-topaz.vercel.app
- [x] 4. Sentry wired and security headers (nonce CSP)

**Checkpoint A** — preview URL live, CI green, one test error visible in Sentry.

### Phase 1 — identity

- [x] 5. Supabase clients, `profiles` table, protected `/app` (dev project `rflhtfnbbsamvevuntet`, eu-west-1)
- [x] 6. Magic link sign-in and sign-out
- [ ] 7. GitHub OAuth sign-in
- [ ] 8. Settings: username and account deletion
- [ ] 9. Playwright authenticated setup

**Checkpoint B** — both sign-in methods work on the preview; advisors clean.

### Phase 2 — billing

- [ ] 10. `subscriptions` table, `is_pro()`, `getPlan()`
- [ ] 11. Pricing page and Stripe Checkout
- [ ] 12. Stripe webhook and success page
- [ ] 13. Customer portal and plan in settings

**Checkpoint C** — test card makes a user Pro; cancel in the portal works; e2e upgrade passes.

### Phase 3 — prompts

- [ ] 14. `prompts` table, RLS and free quota trigger
- [ ] 15. Create and list private prompts
- [ ] 16. Edit and delete a prompt
- [ ] 17. Publish a prompt: public page with SEO
- [ ] 18. Explore page, sitemap and robots
- [ ] 19. Prompt variables (Pro)

**Checkpoint D** — full prompt lifecycle e2e passes; public page Lighthouse ≥ targets.

### Phase 4 — collections ∥ search (independent, any order)

- [ ] 20. Collections: table, RLS, CRUD page
- [ ] 21. Add prompts to collections, collection page
- [ ] 22. Full-text search
- [ ] 23. `embed` Edge Function and embeddings on save
- [ ] 24. Semantic search (Pro)

**Checkpoint E** — all module acceptance criteria covered by tests.

### Phase 5 — launch

- [ ] 25. Production environment
- [ ] 26. Final audits and portfolio README

**Checkpoint F** — SPEC.md success criteria all checked.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Stripe webhook not reaching localhost | High | Stripe CLI `stripe listen`; fallback: test on Vercel preview with a test-mode endpoint |
| RLS mistake leaks private prompts | High | Dedicated two-user DB tests in tasks 14, 20, 22; `get_advisors` at each checkpoint |
| `gte-small` Edge Function cold start / CPU limit on free tier | Med | Embed after save, never blocking; re-index action; measured in task 23 |
| Supabase free project paused after 7 idle days | Low | Resume from dashboard; README mentions it for demo visitors |
| Figma Starter MCP quota exhausted | Low | Keep mockup to 6 screens; fall back to manual Figma edits |
| Vercel Hobby limits on server actions duration | Low | No long work in actions; embedding is a separate Edge Function |
| Magic link e-mail rate limit (Supabase free SMTP) | Low | GitHub OAuth for daily dev; e2e uses password test user |

## Open Questions

- None blocking. Stripe CLI to be installed by you before task 12 (`scoop install stripe`).
