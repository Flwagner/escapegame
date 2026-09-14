# AGENTS.md — Escape Game

Ce projet est un moteur de jeu type escape game / enquête, 100 % front-end,
sans backend, hébergé sur GitHub Pages. Il se compose de deux parties
strictement séparées :

- **`engine/`** — le moteur de jeu générique (React + TypeScript + Vite).
  C'est le code de l'application, réutilisable par n'importe quel scénario.
- **`scenarios/`** — le contenu jouable (un dossier par scénario : données,
  style visuel, assets). Généré/édité principalement par IA.

## Règle d'or

> **Un scénario ne modifie jamais `engine/`. Une évolution du moteur ne
> casse jamais la compatibilité avec les scénarios existants.**

Le contrat entre les deux est le schéma décrit dans
`docs/scenario-format.md` et implémenté dans
`engine/src/core/schema/*.schema.ts` (Zod). Toute évolution de ce schéma
doit rester rétro-compatible ou passer par un changement de
`schemaVersion`.

## Où trouver quoi

| Besoin | Voir |
|---|---|
| Créer/modifier un scénario | `scenarios/AGENTS.md` + skill `create-scenario` + `docs/scenario-format.md` |
| Travailler sur le moteur (composants, state, engine) | `engine/AGENTS.md` + `docs/architecture.md` |
| Comprendre l'archi globale | `docs/architecture.md` |

## Contraintes transverses (valables partout dans le projet)

- **Pas de backend** : tout doit fonctionner en statique, servi tel quel
  par GitHub Pages (pas d'API, pas de base de données).
- **Responsive et tactile obligatoires** : le jeu doit être jouable sur
  PC, tablette et smartphone. Voir la section "Responsive & tactile" de
  `docs/architecture.md` avant d'ajouter un composant ou un scénario.
- **Pas d'autoplay audio** : les navigateurs mobiles le bloquent, l'audio
  ne doit démarrer qu'après une interaction utilisateur explicite.

## Commandes utiles (depuis `engine/`)

```bash
npm run dev       # serveur de développement
npm run build     # build de production (tsc -b && vite build)
npm run test      # tests unitaires (vitest)
npm run lint      # lint du code du moteur
npm run preview   # sert le build de production en local
```

## Avant de considérer une tâche terminée

1. `npm run build` passe sans erreur.
2. `npm run test` passe (si la logique du moteur a été modifiée).
3. Vérification visuelle rapide en `npm run dev` à une largeur mobile
   (~375px) en plus du desktop.
