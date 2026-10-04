# PromptVault

@AGENTS.md

Bibliothèque de prompts IA freemium : sauvegarder, organiser et partager ses prompts, avec recherche sémantique. Projet portfolio construit sans frais, en production sur Vercel.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript strict, Tailwind CSS 4.
- Supabase (Postgres + Auth via `@supabase/ssr`), Sentry (erreurs), Stripe en mode test (à venir).
- Vitest + Testing Library (unitaire), Playwright (e2e). Node 24, npm.

## Commandes

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de dev sur <http://localhost:3000> |
| `npm run lint` | ESLint (`eslint-config-next`) |
| `npm run typecheck` | `next typegen` puis `tsc --noEmit` |
| `npm test` | Tests unitaires Vitest |
| `npm run test:e2e` | Playwright en 375 px et 1280 px (lance le serveur de dev) |
| `npm run build` | Build de production |

Terminé = `lint`, `typecheck`, `test` et `build` passent (comme la CI `.github/workflows/ci.yml`). Si un parcours critique est touché, `test:e2e` doit passer aussi.

Déploiement : Vercel, à partir du dépôt GitHub.

## Dossiers

```text
src/app/              routes App Router (pages, layout, styles globaux)
src/components/       composants partagés
src/lib/<module>/     logique par module (identity, security, supabase…)
src/proxy.ts          proxy Next.js : pose la CSP
supabase/migrations/  migrations SQL versionnées
e2e/                  tests Playwright
docs/                 doc technique et spécifications
tasks/                plan et liste des tâches
```

Les tests unitaires sont à côté du code testé (`*.test.ts(x)`).

## Règles critiques

- Next.js 16 diffère de tes connaissances : lis le guide concerné dans `node_modules/next/dist/docs/` avant d'écrire du code (voir `AGENTS.md`).
- `supabase/migrations/` : ne modifie jamais une migration existante, ajoute un fichier numéroté. Avant un changement de schéma, lis les tables avec le MCP Supabase. Après un changement, lance `get_advisors`.
- Les règles métier (quota gratuit, collections Pro, propriété) sont dans la base, en RLS et triggers, pas seulement dans l'UI.
- Sécurité HTTP : la CSP est dans `src/lib/security/csp.ts` (appliquée par `src/proxy.ts`), les autres en-têtes dans `next.config.ts`.
- Thème : les couleurs sont des variables CSS. Aucune classe `dark:` dans les composants.
- `SENTRY_AUTH_TOKEN` est un secret, uniquement sur Vercel. Les variables sont listées dans `.env.example`.
- Parcours critiques (connexion, paiement, formulaire principal) : chacun a son test e2e Playwright.

## Connecteurs

- Vercel : après un déploiement, lis l'état du build, les logs et les erreurs runtime. Vérifie les URL de preview avec `playwright-cli`.
- Sentry : avant de corriger un bug, cherche l'issue. Après correction et déploiement, vérifie qu'elle ne se reproduit plus.
- Stripe : documentation et objets en lecture seule.
- Figma : compare le rendu `playwright-cli` à `get_screenshot` de la maquette.

## Où c'est

- `docs/README.md` : installation, scripts, variables d'environnement, liens (prod, Sentry, Supabase, Figma).
- `docs/architecture.md` : structure, choix techniques (thème, polices, CSP…).
- `.claude/skills/` : `migration-supabase` (nouvelle migration), `verif-terminee` (contrôles avant de rendre une tâche).
- `docs/specs/SPEC.md` : spécification générale, et `docs/specs/SPEC-<module>.md` par module.
- `tasks/plan.md` et `tasks/todo.md` : plan d'implémentation et tâches. Exception à la règle commune : ce projet n'a pas de `docs/PLAN.md`, ces deux fichiers en tiennent lieu (skill `branche-tache` comprise). Mets-les à jour en fin de session.
