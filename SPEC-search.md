# Spec: search

Depends on: prompts, billing · Consumed by: —

## Objective

Find prompts by keywords (everyone) or by meaning (Pro). The semantic search is the "AI" part
of the project and costs nothing: embeddings come from Supabase's built-in `gte-small` model.

## Data

```sql
alter table prompts
  add column fts tsvector generated always as
    (to_tsvector('english', title || ' ' || coalesce(description, '') || ' ' || body)) stored,
  add column embedding vector(384);

create index on prompts using gin (fts);
create index on prompts using hnsw (embedding vector_cosine_ops);
```

- `search_prompts(q text, scope text)`: full-text, `security invoker` so RLS applies.
- `match_prompts(query_embedding vector(384), match_count int)`: cosine similarity,
  `security invoker`, similarity threshold 0.75 (tunable).

## Embedding pipeline

- Edge Function `embed` (Deno, `Supabase.ai.Session('gte-small')`, mean pooling, normalized):
  input `{ text }`, output `{ embedding: number[384] }`. Requires a valid user JWT.
- Prompt save (create/update of title, description or body) → server action calls `embed` →
  updates `embedding`. If `embed` fails, the prompt is saved anyway, `embedding` stays null and
  Sentry records the error; a "Re-index" action in settings retries null embeddings.
- Query: Pro search → `embed(query)` → `match_prompts`.

## Scopes

- `/explore?q=` : public prompts.
- `/app/prompts?q=` : my prompts. Toggle "Semantic" visible to everyone, enabled for Pro only.

## Acceptance Criteria

- [ ] Keyword search matches title, description and body; results in < 500 ms on the dev dataset.
- [ ] Pro semantic search: "write a cover letter" finds a prompt titled "Job application email"
      (seeded fixture).
- [ ] Free user: the Semantic toggle is disabled with an explanation; the server rejects a
      semantic request from a free user.
- [ ] Search never returns another user's private prompt (RLS test on both functions).
- [ ] Empty query shows the normal list; no result shows an empty state with a suggestion.
- [ ] Search input has a label, updates the URL (`?q=`), and is debounced (300 ms).

## Tests

- Unit: query param parsing, debounce hook.
- DB: `search_prompts` and `match_prompts` respect RLS.
- Edge Function: returns 401 without JWT, 384 numbers with one.
- E2E: Pro user semantic search on seeded fixtures.
