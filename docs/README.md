# PromptVault

Bibliothèque de prompts IA freemium, projet portfolio construit de A à Z sans frais.
Spécification complète : [`specs/SPEC.md`](specs/SPEC.md) ; plan : [`../tasks/`](../tasks/plan.md).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript strict
- Tailwind CSS 4 (couleurs en variables CSS, thème clair/sombre)
- Vitest + Testing Library (unitaire), Playwright (e2e)
- Sentry (`@sentry/nextjs`, erreurs uniquement), hébergement Vercel (plan Hobby)
- Supabase (Postgres + Auth, `@supabase/ssr`), projet `dev` en eu-west-1
- À venir : Stripe (mode test)

## Installation

```bash
cd promptvault
npm install
npx playwright install chromium
```

Node 24 requis (`@types/node` aligné sur cette version).

## Scripts npm

| Script              | Rôle                                                                         |
| ------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`       | Serveur de dev sur <http://localhost:3000>                                   |
| `npm run build`     | Build de production                                                          |
| `npm run start`     | Sert le build                                                                |
| `npm run lint`      | ESLint (config `eslint-config-next`)                                         |
| `npm run typecheck` | `next typegen` puis `tsc --noEmit`                                           |
| `npm test`          | Tests unitaires Vitest                                                       |
| `npm run test:e2e`  | Tests Playwright (desktop 1280 px et mobile 375 px), lance le serveur de dev |

## Variables d'environnement

Modèle : `promptvault/.env.example`. En local, dans `promptvault/.env.local` (ignoré par git).

| Variable                               | Secret                                                  | Où                   | Rôle                                            |
| -------------------------------------- | ------------------------------------------------------- | -------------------- | ----------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN`               | Non (envoyée au navigateur)                             | `.env.local`, Vercel | Destination des erreurs Sentry                  |
| `SENTRY_AUTH_TOKEN`                    | **Oui**                                                 | Vercel uniquement    | Envoi des source maps à Sentry pendant le build |
| `NEXT_PUBLIC_SUPABASE_URL`             | Non (envoyée au navigateur)                             | `.env.local`, Vercel | URL de l'API du projet Supabase                 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Non (envoyée au navigateur, la RLS protège les données) | `.env.local`, Vercel | Clé publique Supabase (`sb_publishable_…`)      |

## Liens

- Production : <https://promptvault-topaz.vercel.app/>
- Dépôt : <https://github.com/RomainChe/promptvault>
- Sentry : <https://frozzen.sentry.io/projects/promptvault/> (organisation `frozzen`, région UE)
- Supabase dev : <https://supabase.com/dashboard/project/rflhtfnbbsamvevuntet> (organisation Frozzen). Mis en pause après 7 jours sans activité : le relancer depuis le tableau de bord.

## Design

Maquettes Figma : <https://www.figma.com/design/qRtuvfqLA79H5nk1CN77aC> (page « Directions »).
Thème clair = direction A, thème sombre = palette de la direction B.
