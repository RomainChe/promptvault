# Spec: identity

Depends on: — · Consumed by: every other module.

## Objective

Let people sign in without a password (email magic link) or with GitHub, keep a session
across server and client, and give each user a public profile row.

## Interface (provided to other modules)

```ts
// src/lib/identity/session.ts
getUser(): Promise<User | null>          // current user from the server session
requireUser(): Promise<User>             // redirects to /sign-in when signed out
```

Middleware refreshes the Supabase session cookie on every request and protects `/app/**`.

## Data

```sql
profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique not null check (username ~ '^[a-z0-9_]{3,30}$'),
  created_at  timestamptz not null default now()
)
```

- Row created by a trigger on `auth.users` insert; username derived from the GitHub login or the
  email local part, de-duplicated with a numeric suffix.
- RLS: anyone can `select` (usernames appear on public prompts); only the owner can `update`.
- Personal data stored: email (in `auth.users`, managed by Supabase), username. Nothing else.

## Acceptance Criteria

- [ ] `/sign-in` offers "Continue with GitHub" and an email field "Send magic link".
- [ ] Invalid email shows a text error next to the field; submit is disabled while sending.
- [ ] After sending, the page shows "Check your inbox" without revealing whether the account exists.
- [ ] `/auth/callback` exchanges the code, then redirects to `/app` (or the `next` param if it is a
      relative path — no open redirect).
- [ ] Visiting `/app/**` signed out redirects to `/sign-in?next=…`.
- [ ] Sign-out button clears the session and returns to `/`.
- [ ] A `profiles` row exists after first sign-in by either method.
- [ ] Settings page lets the user change username (same regex, uniqueness error shown in text).
- [ ] Settings page has "Delete my account": confirmation dialog, then deletes the auth user
      (cascade removes profile and prompts). Required for GDPR.

## Tests

- Unit: `safeNextPath()` rejects absolute and protocol-relative URLs; username derivation.
- Component: sign-in form states (idle, invalid, sending, sent, error).
- E2E: sign-in via magic link is not automatable for free → e2e uses a test user signed in
  with a password through the Supabase admin API in a Playwright setup project (dev project only).
