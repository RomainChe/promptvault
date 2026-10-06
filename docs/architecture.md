# PromptVault — Architecture

## Structure

```text
promptvault/
  src/app/              routes App Router (layout, page d'accueil)
  src/components/       composants partagés (en-tête, bouton de thème, bouton copier)
  src/lib/<module>/     logique par module (identity : session, safeNextPath)
  src/lib/supabase/     client Supabase côté serveur
  supabase/migrations/  migrations SQL versionnées
  e2e/                  tests Playwright
  docs/                 doc technique ; docs/specs/ : spécification par module
  docs/PLAN.md          plan et suivi des tâches
```

Les tests unitaires sont à côté du code testé (`*.test.tsx`).

## Découpage en modules

identity → billing → prompts → collections ∥ search (détail dans `specs/SPEC.md`).
Le code de chaque module ira dans `src/lib/<module>/`.

## Choix techniques

### Thème clair / sombre

- Les couleurs sont des variables CSS sur `:root` et `:root[data-theme="dark"]`, exposées à
  Tailwind via `@theme inline` (`bg-surface`, `text-muted`, `bg-accent`…). Aucun `dark:` dans
  les composants : changer de thème ne fait que changer l'attribut.
- Un script inline dans `<head>` (`src/app/layout.tsx`) applique le thème avant le premier rendu :
  choix sauvegardé dans `localStorage`, sinon `prefers-color-scheme`. Il évite le flash de thème.
  Il faudra autoriser son hash dans la CSP (tâche 4).
- `ThemeToggle` lit l'attribut avec `useSyncExternalStore` (pas d'état dupliqué, pas d'erreur
  d'hydratation) et le met à jour au clic.

### Polices

Inter (texte) et JetBrains Mono (corps des prompts) via `next/font/google` : hébergées par le site,
aucune requête vers Google côté visiteur.

### Racine Turbopack

`turbopack.root` est fixé dans `next.config.ts`, car le dossier parent WebstormProject contient
son propre `package-lock.json` et Next.js le prenait pour la racine.

### Sécurité : en-têtes HTTP

- **CSP stricte avec nonce**, générée à chaque requête par `src/proxy.ts` (politique dans
  `src/lib/security/csp.ts`) : `script-src 'self' 'nonce-…' 'strict-dynamic'`, sans `unsafe-inline`
  ni `unsafe-eval` en production. Next.js applique le nonce à ses propres scripts ; le layout le
  lit dans l'en-tête `x-nonce` pour le script de thème.
- Contrepartie : toutes les pages sont rendues à la requête (plus de pages statiques). Choisi car
  les pages connectées seront dynamiques de toute façon, et une CSP avec `unsafe-inline` ne
  protège presque pas contre le XSS.
- En-têtes fixes dans `next.config.ts` : HSTS (2 ans, preload), `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (caméra, micro,
  géolocalisation désactivés). `frame-ancestors 'none'` dans la CSP remplace `X-Frame-Options`.

### Suivi des erreurs : Sentry

- Initialisé dans `src/instrumentation-client.ts` (navigateur) et `src/instrumentation.ts`
  (serveur et edge, plus `onRequestError` pour les erreurs de rendu serveur).
  `src/app/global-error.tsx` capture les erreurs qui cassent le layout racine.
- Erreurs uniquement : ni traces de performance ni Session Replay, pour rester dans le plan gratuit.
- Les événements passent par le tunnel `/monitoring` (même domaine) : la CSP garde
  `connect-src 'self'` et les bloqueurs de publicité ne les suppriment pas.
- Poids : environ +65 Ko gzip de JavaScript client au total ; la page d'accueil charge 198,7 Ko
  de JS. L'option `treeshake` de Sentry ne fonctionne qu'avec webpack, et
  `compiler.define` (`__SENTRY_TRACING__`) n'a rien fait gagner sous Turbopack (mesuré).
- En v11, `withSentryConfig` s'importe depuis `@sentry/nextjs/config`.

### Identité : session Supabase

- `src/proxy.ts` rafraîchit la session Supabase à chaque requête (`getClaims()`) et écrit les
  nouveaux cookies dans la requête (pour les Server Components) et dans la réponse. Sans session,
  `/app/**` redirige vers `/sign-in?next=…`.
- Les pages appellent `requireUser()` (`src/lib/identity/session.ts`), qui s'appuie sur
  `getUser()` et donc sur le serveur Auth : un cookie forgé ou révoqué n'est jamais accepté.
  La redirection du proxy n'est qu'un raccourci, pas la protection.
- `safeNextPath()` n'accepte que des chemins du même domaine (analyse avec `URL`), ce qui
  empêche toute redirection ouverte via `next`.
- La table `profiles` est créée par `supabase/migrations/0001_profiles.sql`, puis renforcée par
  `0002_profiles_hardening.sql`. Un trigger `security definer` sur `auth.users` crée la ligne et
  dérive le nom d'utilisateur : login GitHub, ou partie avant le @ de l'email, avec un suffixe
  numérique s'il est déjà pris. Si deux inscriptions simultanées visent le même nom, la
  seconde passe au suffixe suivant au lieu d'échouer.
- Lecture publique limitée aux colonnes `id` et `username`, grâce à un `GRANT` par colonne.
  Une requête doit donc nommer ses colonnes (`select=id,username`) : `select=*` est refusé.
  La modification est réservée au propriétaire, et seulement sur `username`.
- RGPD : pour une inscription par email, le nom par défaut révèle la partie avant le @ et il est
  public. C'est un choix assumé ; l'utilisateur peut le changer dans les réglages (tâche 8).
- Les migrations s'appliquent avec l'outil `apply_migration` du MCP Supabase, ce qui évite de
  fournir le mot de passe de la base au CLI. Le fichier SQL reste la source de vérité.
- Connexion par lien magique : le formulaire (`src/app/sign-in/sign-in-form.tsx`, avec
  `useActionState`) appelle la Server Action `sendMagicLink` (`src/lib/identity/actions.ts`).
  Elle valide l'email côté serveur, puis appelle `signInWithOtp` avec un retour vers
  `/auth/callback?next=…`. La réponse est identique, que le compte existe ou non.
- `/auth/callback` échange le code à usage unique (PKCE) contre une session, puis redirige vers
  `safeNextPath(next)`. Si le lien est invalide ou expiré, il renvoie vers `/sign-in?error=link`.
  Le lien doit être ouvert dans le navigateur qui l'a demandé, car le vérificateur PKCE est
  stocké dans un cookie.
- Connexion GitHub : la Server Action `signInWithGitHub` demande l'URL d'autorisation à Supabase
  (`signInWithOAuth`) et y redirige le navigateur. GitHub renvoie vers Supabase
  (`https://rflhtfnbbsamvevuntet.supabase.co/auth/v1/callback`), qui renvoie vers notre
  `/auth/callback` : c'est le même échange de code que pour le lien magique. L'OAuth App
  GitHub et ses identifiants sont configurés dans Supabase, pas dans l'application.
- La déconnexion est une Server Action (`signOut`) qui redirige vers `/`.
- Tout passe par le serveur : pas encore de client Supabase dans le navigateur, et la CSP garde
  `connect-src 'self'`. Le client admin arrivera avec la suppression de compte (tâche 8).
- Supabase, Authentication > URL Configuration : Site URL = l'URL de production. Les Redirect
  URLs doivent couvrir `http://localhost:3000/auth/callback**`, l'URL de production et les
  previews (`https://*-frozzen.vercel.app/auth/callback**`).
- Le SMTP intégré de Supabase limite fortement le nombre d'emails par heure. Pour le dev
  quotidien, on utilise GitHub.
