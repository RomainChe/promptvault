---
name: migration-supabase
description: Crée une migration SQL Supabase pour PromptVault (table, colonne, policy RLS, trigger, fonction). Utiliser quand on demande d'« ajouter une table », « ajouter une colonne », « changer une policy », « écrire la migration » ou qu'une tâche de tasks/todo.md liste un fichier supabase/migrations/. Pas pour lire des données ni pour appliquer une migration existante.
---

# migration-supabase

Les règles métier (quota, Pro, propriété) vivent dans la base : chaque migration porte sa RLS et ses droits, pas seulement la table.

## Étapes

1. **Contexte** : lis la tâche dans `tasks/todo.md` et la spec du module dans `docs/specs/SPEC-<module>.md`. Lis le schéma actuel avec le MCP Supabase (`list_tables`), puis les migrations existantes de `supabase/migrations/`.
2. **Numéro** : prends le numéro libre suivant d'après `ls supabase/migrations/`, et non celui prévu dans `tasks/todo.md` (il peut être déjà pris). Nom : `000N_<slug>.sql`, slug en anglais snake_case.
3. **Écris la migration**, dans le style des existantes :
   - commentaire d'en-tête d'une ligne qui renvoie à la spec ;
   - `enable row level security` sur chaque nouvelle table ;
   - `revoke all … from anon, authenticated`, puis des `grant` colonne par colonne, au plus juste ;
   - policies nommées en anglais, avec `(select auth.uid())` plutôt que `auth.uid()` ;
   - fonctions `security definer` avec `set search_path = ''` et des noms qualifiés (`public.…`).
4. **Ne modifie jamais une migration existante.** Pour corriger, crée-en une nouvelle (exemple : `0002_profiles_hardening.sql`).
5. **Tests** : si `supabase/tests/` existe, ajoute-y le test SQL de la tâche. Sinon, signale-le. Couvre aussi le code TypeScript qui utilise la table avec un test Vitest à côté du fichier.
6. **Application** : n'applique rien sur le projet distant. Propose `apply_migration` et attends l'accord de l'utilisateur. Après application, lance `get_advisors` (security et performance) et corrige chaque alerte par une nouvelle migration.
7. **Doc** : mets à jour `docs/architecture.md` si le modèle de données change.

## Cas d'échec

- MCP Supabase non connecté : dis-le, écris la migration à partir des fichiers seuls et signale que le schéma distant n'a pas été vérifié.
- Projet Supabase en pause (après 7 jours sans activité) : demande à l'utilisateur de le relancer depuis le tableau de bord.
