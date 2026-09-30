# Spec: collections

Depends on: prompts, billing · Consumed by: —

## Objective

Pro users group their prompts into named collections (a prompt can be in several).

## Data

```sql
collections (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users on delete cascade default auth.uid(),
  name       text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now(),
  unique (owner_id, name)
)

collection_prompts (
  collection_id uuid references collections on delete cascade,
  prompt_id     uuid references prompts on delete cascade,
  primary key (collection_id, prompt_id)
)
```

- RLS: owner only, on both tables; `collection_prompts` insert also checks the prompt belongs
  to the same owner.
- `insert` on `collections` requires `is_pro(auth.uid())`. After downgrade, existing collections
  stay readable but cannot be created or modified.

## Acceptance Criteria

- [ ] Pro: create, rename, delete a collection (delete keeps the prompts).
- [ ] Pro: add/remove a prompt to/from collections from the prompt page.
- [ ] `/app/collections/[id]` lists its prompts with the four states.
- [ ] Free: the Collections nav item shows a Pro badge and an upgrade page; direct insert rejected by RLS.
- [ ] Duplicate name shows a text error.
- [ ] Cannot add another user's prompt to my collection (RLS test).

## Tests

- Component: collection form, add-to-collection picker.
- DB: RLS isolation, pro-only insert, cross-owner insert rejected.
