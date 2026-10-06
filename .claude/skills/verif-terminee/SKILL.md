---
name: verif-terminee
description: Vérifie qu'une tâche PromptVault est terminée avant de la rendre (lint, typecheck, tests, build, contrôle navigateur). Utiliser avant d'annoncer « c'est fait », quand on demande « vérifie », « tout passe ? », « prêt pour la PR ? », ou à la fin d'une tâche de docs/PLAN.md.
---

# verif-terminee

Rejoue la CI (`.github/workflows/ci.yml`) en local, puis contrôle l'interface si la tâche en touche une.

## Étapes

1. **Contrôles automatiques**, dans l'ordre de la CI, en t'arrêtant au premier échec pour en corriger la cause :
   1. `npm run lint`
   2. `npm run typecheck`
   3. `npm test`
   4. `npm run build`
2. **e2e** : si la tâche touche un parcours critique (connexion, paiement, formulaire principal), lance `npm run test:e2e`.
3. **Interface** : si un fichier de `src/app/` ou `src/components/` a changé, vérifie avec `playwright-cli` sur <http://localhost:3000>. Si le serveur de dev ne tourne pas, demande à l'utilisateur de lancer `npm run dev`.
   - En 375 px puis en 1280 px.
   - Console sans erreur JS, réseau sans 4xx/5xx ni erreur CSP.
   - Navigation au clavier (Tab, Shift+Tab, Entrée, Échap) et snapshot d'accessibilité.
   - Pour un écran qui charge des données : les états chargement, vide, erreur et succès.
4. **Doc et suivi** : si le comportement ou l'installation change, vérifie que `docs/` est à jour. Coche la tâche dans `docs/PLAN.md`.
5. **Bilan** : rends un tableau « vérification → résultat ». Liste aussi ce qui n'a pas pu être vérifié et pourquoi (serveur arrêté, MCP absent…). N'omets rien en silence.

## Interdits

Ne désactive pas une règle ESLint, n'ajoute pas de `@ts-ignore` et ne saute pas un test pour obtenir du vert : corrige la cause. Ne commite pas et ne pousse pas.
