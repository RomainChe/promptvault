# Spec: billing

Depends on: identity · Consumed by: prompts, collections, search.

## Objective

Sell one fictitious **Pro** subscription (5 €/month, Stripe **test mode**) and expose the
user's plan to the rest of the app. Billing knows nothing about prompts.

## Interface (provided to other modules)

```ts
// src/lib/billing/plan.ts
type Plan = "free" | "pro";
getPlan(userId: string): Promise<Plan>
```

```sql
-- usable in RLS policies and triggers of other modules
public.is_pro(uid uuid) returns boolean  -- stable, security definer
```

Pro = subscription `status in ('active', 'trialing')`. Anything else = free.

## Data

```sql
subscriptions (
  user_id                 uuid primary key references auth.users on delete cascade,
  stripe_customer_id      text unique not null,
  stripe_subscription_id  text unique,
  status                  text not null,
  current_period_end      timestamptz,
  updated_at              timestamptz not null default now()
)
```

- RLS: owner can `select`; **no** insert/update/delete policy — only the webhook writes, with the
  service role key, server side.

## Flows

1. `/pricing` → "Upgrade" (signed in) → server action creates or reuses the Stripe customer,
   creates a Checkout Session (`mode: subscription`, price from env) → redirect to Stripe.
2. Stripe → `POST /api/stripe/webhook` → signature verified → handles
   `checkout.session.completed`, `customer.subscription.created|updated|deleted` → upsert
   `subscriptions`. Idempotent: replaying an event gives the same row.
3. `/app/settings` → "Manage subscription" → Stripe Customer Portal session (cancel, card update).

## Acceptance Criteria

- [ ] Paying with `4242 4242 4242 4242` makes the user Pro within seconds of the redirect back.
- [ ] Success page shows a pending state until the webhook has landed, then "You are Pro".
- [ ] Cancelling in the portal (at period end) keeps Pro until `current_period_end`, then free.
- [ ] Card `4000 0000 0000 0341` (payment fails) leaves the user free and shows an error state.
- [ ] A webhook with a bad signature returns 400 and writes nothing.
- [ ] An unknown event type returns 200 and writes nothing.
- [ ] Settings shows the current plan and renewal/end date.
- [ ] `STRIPE_SECRET_KEY` starts with `sk_test_`; the app refuses to start otherwise.

## Tests

- Unit: `mapSubscriptionEvent(event) → row | null`; `planFromStatus(status)`; test-key guard.
- Route handler: bad signature → 400; valid event → upsert called once.
- E2E: upgrade flow with Stripe test card on the hosted Checkout page.
