# Spec: prompts

Depends on: identity, billing · Consumed by: collections, search.

## Objective

The core of the app: users write prompts, keep them private or publish them. Public prompts
are indexable pages that bring visitors from search engines. Pro users get `{{variables}}`.

## Data

```sql
prompts (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users on delete cascade default auth.uid(),
  title       text not null check (char_length(title) between 1 and 120),
  description text check (char_length(description) <= 300),
  body        text not null check (char_length(body) between 1 and 10000),
  tags        text[] not null default '{}' check (cardinality(tags) <= 5),
  visibility  text not null check (visibility in ('private', 'public')),
  slug        text unique,        -- set when public: "<kebab-title>-<6 chars>"
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
)
```

- RLS `select`: `visibility = 'public' or owner_id = auth.uid()`.
- RLS `insert/update/delete`: `owner_id = auth.uid()`.
- **Free quota in the database**: trigger on insert/update rejects a 11th private prompt when
  `not is_pro(owner_id)`. Downgrading never deletes existing prompts; it only blocks new private ones.

## Variables

Syntax `{{name}}`, name `[a-zA-Z_][a-zA-Z0-9_]{0,31}`. Pure functions in `src/lib/prompts/variables.ts`:

```ts
extractVariables(body: string): string[]                        // unique, in order of appearance
fillVariables(body: string, values: Record<string, string>): string  // unknown vars left intact
```

Pro: "Use" opens a form with one field per variable, preview, then copy. Free: "Copy" copies the
raw body; the form shows an upgrade hint.

## Pages

| Route | Access | Content |
|---|---|---|
| `/app/prompts` | owner | List (title, visibility, tags, updated), quota "7 / 10 private" for free |
| `/app/prompts/new`, `/app/prompts/[id]` | owner | Form: title, description, body, tags, visibility |
| `/p/[slug]` | public | Title, description, body, author username, tags, Copy/Use button |
| `/explore` | public | Latest public prompts, paginated (20 / page) |

SEO on `/p/[slug]`: unique `<title>`, meta description, canonical, Open Graph, one `<h1>`,
JSON-LD `CreativeWork`. `sitemap.xml` lists public prompts; `robots.txt` disallows `/app`.

## Acceptance Criteria

- [ ] Create, edit, delete a prompt; delete asks for confirmation.
- [ ] Field errors are shown in text next to each field.
- [ ] Free user with 10 private prompts: "New private prompt" shows the limit and an upgrade link;
      a direct insert through the API is rejected by the database.
- [ ] Making a prompt public generates a stable slug; making it private again makes `/p/[slug]` 404.
- [ ] Another user cannot read, edit or delete my private prompt (RLS test).
- [ ] Prompt body is rendered as text (no HTML injection).
- [ ] Copy button gives visible and screen-reader feedback ("Copied").
- [ ] Lists handle loading, empty ("No prompts yet — create your first"), error and success states.

## Tests

- Unit: `extractVariables`, `fillVariables`, `slugify`.
- Component: prompt form validation; variable form fills and previews; quota banner.
- DB: RLS isolation between two users; quota trigger free vs pro.
- E2E: create → publish → open `/p/[slug]` signed out → copy.
