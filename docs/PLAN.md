# PromptVault — Plan

## 1. Plan général

- **Objectif** : bibliothèque de prompts IA freemium, de la maquette Figma à la production sur Vercel, sans frais. Spécification : [`specs/SPEC.md`](specs/SPEC.md) et `specs/SPEC-<module>.md`.
- **Périmètre** : identité → facturation → prompts → collections ∥ recherche → lancement. Chaque tâche est une tranche verticale (migration + logique serveur + UI + tests) qui laisse l'app déployable.
- **Stack** : Next.js 16 + TypeScript + Tailwind 4, Supabase (Postgres, Auth, Edge Functions), Stripe en mode test, Sentry, Vercel. Vitest + Testing Library, Playwright.
- **Décisions** :
  - Déployer tôt : chaque tâche est vérifiée sur une preview Vercel.
  - La base porte les règles métier (quota gratuit, collections Pro, propriété) en RLS et triggers.
  - Facturation avant prompts : `is_pro()` doit exister avant le trigger de quota.
  - Le webhook Stripe est le seul à écrire dans `subscriptions` ; la page de succès attend le webhook.
  - Projet Supabase `dev` distant (`rflhtfnbbsamvevuntet`, eu-west-1), pas de stack locale ; migrations appliquées avec `npx supabase db push` après accord. `prod` est créé en phase 5.
  - E2E sans e-mail : un utilisateur de test à mot de passe créé par l'API admin ; magic link et GitHub vérifiés à la main.
  - Un échec d'embedding ne bloque jamais l'enregistrement (`embedding` null, action de réindexation).
- **Risques** : webhook Stripe en local (Stripe CLI `stripe listen`, à installer avant la tâche 12 : `scoop install stripe`) ; fuite RLS (tests SQL à deux utilisateurs en 14, 20, 22 et `get_advisors` à chaque checkpoint) ; démarrage à froid de `gte-small` (embedding après l'enregistrement).

⚠️ = demande ton accord ou une action manuelle. « Terminé » : voir `CLAUDE.md` et la skill `verif-terminee`.

## 2. Implémentation par étapes

| Phase | Critère de fin (checkpoint) |
| --- | --- |
| 0. Fondations | ✅ Preview en ligne, CI verte, Sentry reçoit les erreurs, en-têtes posés. |
| 1. Identité | Les deux connexions marchent sur la preview, advisors propres, e2e vert. |
| 2. Facturation | Parcours upgrade / annulation complet sur la preview (webhook en mode test). |
| 3. Prompts | E2E créer → publier → voir déconnecté → copier ; page publique conforme aux CWV. |
| 4. Collections ∥ recherche | Chaque critère d'acceptation des specs de module a un test qui passe. |
| 5. Lancement | Tous les critères de succès de SPEC.md cochés. |

## 3. Checklist

- [x] Phase 0 : maquette Figma (1), scaffold Next.js et landing (2), dépôt + CI + Vercel <https://promptvault-topaz.vercel.app> (3), Sentry et CSP à nonce (4).
- [x] 5–7 : clients Supabase, `profiles`, `/app` protégé ; magic link ; GitHub OAuth.
- [ ] 8. Réglages : changement de pseudo (regex, erreur d'unicité en texte), « Supprimer mon compte » avec dialogue de confirmation (supprime l'utilisateur auth et déconnecte).
- [ ] 9. Setup Playwright authentifié : utilisateur de test créé par l'API admin, `storageState` ; e2e redirection protégée et déconnexion.
- [ ] 10. ⚠️ Table `subscriptions` (RLS : lecture propriétaire seulement, aucune écriture), `is_pro(uid)`, `getPlan()` ; `planFromStatus` et garde `sk_test_` testés ; test SQL : insertion refusée avec la clé anon.
- [ ] 11. ⚠️ Produit « Pro » mensuel dans Stripe test ; page Pricing ; action « Upgrade » (déconnecté → connexion, connecté → Checkout) ; customer réutilisé.
- [ ] 12. ⚠️ `POST /api/stripe/webhook` (signature vérifiée, `mapSubscriptionEvent`, upsert admin) ; `/app/billing/success` attend Pro. Carte `4242…` → Pro, `4000 0000 0000 0341` → reste gratuit ; mauvaise signature → 400 ; événement inconnu → 200 sans écriture ; rejeu idempotent.
- [ ] 13. Portail client et plan dans les réglages ; annulation en fin de période garde Pro jusqu'à `current_period_end` ; e2e upgrade avec carte de test.
- [ ] 14. ⚠️ Table `prompts`, RLS, trigger de quota : B ne voit pas les prompts privés de A ; gratuit : 11e prompt privé refusé par la base, Pro accepté.
- [ ] 15. Créer et lister les prompts privés : validation zod, erreurs en texte, quatre états, bandeau « n / 10 privés ».
- [ ] 16. Modifier et supprimer un prompt (dialogue de confirmation accessible au clavier).
- [ ] 17. Publier : slug stable, retour en privé → `/p/[slug]` en 404 ; page avec title, description, canonical, OG, un `<h1>`, JSON-LD, bouton Copier.
- [ ] 18. `/explore` paginé (20 par page, quatre états), `sitemap.xml` des prompts publics, `robots.txt` interdit `/app`.
- [ ] 19. Variables de prompt (Pro) : `extractVariables` / `fillVariables` testés ; Pro : formulaire « Utiliser » avec aperçu ; gratuit : copie brute + incitation.
- [ ] 20. ⚠️ Collections : table, RLS (insertion Pro seulement, isolation, lien inter-propriétaire refusé), page CRUD ; gratuit voit la page d'upgrade.
- [ ] 21. Ajout de prompts aux collections (sélecteur), page `/app/collections/[id]` à quatre états.
- [ ] 22. ⚠️ Recherche plein texte : colonne `fts` + index GIN + `search_prompts` (security invoker) ; champ étiqueté, debounce, `?q=` sur `/explore` et `/app/prompts` ; test RLS.
- [ ] 23. ⚠️ Edge Function `embed` (401 sans JWT, 384 flottants avec) ; embedding à l'enregistrement, échec signalé à Sentry sans bloquer ; réindexation.
- [ ] 24. Recherche sémantique (Pro) : `match_prompts` (seuil 0.75) trouve « Job application email » pour « write a cover letter » ; gratuit : bascule désactivée, refus côté serveur.
- [ ] 25. ⚠️ Production : projet Supabase `prod`, migrations, Edge Function, URL de redirection, webhook Stripe test, variables Vercel ; promotion seulement avec ton accord.
- [ ] 26. Audits finaux (perf, sécurité, code-reviewer, `get_advisors`, `npm audit`) ; Lighthouse : LCP < 2,5 s, CLS < 0,1, accessibilité ≥ 95 ; README portfolio.

## 4. Progression

7 / 26 tâches terminées : **27 %**.

## 5. Prochaines actions

1. Tâche 8 : réglages (pseudo et suppression du compte).
2. Tâche 9 : setup Playwright authentifié.
3. Checkpoint B : vérifier les deux connexions sur la preview et lancer `get_advisors`.
4. Installer Stripe CLI (`scoop install stripe`) avant la tâche 12.
5. Tâche 10 : table `subscriptions` et `is_pro()`.
