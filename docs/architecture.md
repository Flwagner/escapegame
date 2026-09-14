# Architecture du projet

Vue d'ensemble technique. Pour créer un scénario, voir `scenario-format.md`
et le skill `create-scenario`. Pour contribuer au moteur, voir
`engine/AGENTS.md`.

## Principe général

Application 100 % front, sans backend, hébergée sur GitHub Pages. Le
"moteur" (`engine/`) est une SPA React générique qui sait charger et jouer
n'importe quel scénario respectant le format décrit dans
`docs/scenario-format.md`. Le contenu (`scenarios/`) est strictement séparé
du code du moteur.

## Stack

- React 18 + TypeScript + Vite
- react-router-dom (`HashRouter`, requis pour GitHub Pages sans config serveur)
- Zustand + middleware `persist` (localStorage) pour la progression de jeu
- Zod pour valider les scénarios au runtime
- Framer Motion pour les transitions/animations
- Howler.js pour la musique d'ambiance et les effets sonores
- Vitest + Testing Library pour les tests

## Dossiers clés

- `engine/src/core/schema/` — schémas Zod = contrat entre moteur et scénarios
- `engine/src/core/loader/` — chargement/validation runtime des fichiers JSON
- `engine/src/core/state/gameStore.ts` — état de jeu (Zustand), persistance
  par scénario (`progressByScenario[scenarioId]`)
- `engine/src/core/engine/` — logique pure (résolution de puzzles,
  conditions de déblocage), testée unitairement
- `engine/src/core/audio/audioManager.ts` — wrapper Howler, gère le
  déblocage audio mobile (autoplay bloqué tant qu'il n'y a pas eu
  d'interaction utilisateur)
- `engine/src/components/` — composants génériques réutilisés par tous les
  scénarios (aucune logique spécifique à un scénario ne doit y être ajoutée)
- `scenarios/<id>/` — contenu d'un scénario (JSON, CSS, assets)

## Chargement d'un scénario (runtime)

1. `scenarios/manifest.json` est chargé et affiché sur l'écran d'accueil
   (`ScenarioSelector`).
2. Au clic sur un scénario, `PlayScreen` charge
   `scenarios/<path>/scenario.json` via `fetch`, le valide avec
   `ScenarioSchema` (Zod), puis l'enregistre dans le `gameStore`.
3. Les assets (images, sons, documents) sont résolus dynamiquement via
   `resolveScenarioAssetUrl(scenarioPath, relativePath)` — jamais importés/
   bundlés par le moteur.
4. Le fichier `theme.css` du scénario (s'il existe) est injecté dans le
   `<head>` par `ThemeInjector`, puis retiré à la sortie.

Techniquement, `engine/public/scenarios` est un lien symbolique vers
`../../scenarios` à la racine du repo : cela permet à Vite de servir ces
fichiers comme des assets statiques (en dev comme en build) sans dupliquer
les données ni les inclure dans le bundle JS.

## Sauvegarde de progression

Clé localStorage unique `escapegame-save`, contenant une map
`progressByScenario: Record<scenarioId, ScenarioProgress>`. Chaque
scénario a donc sa propre sauvegarde indépendante ; recommencer un
scénario = réinitialiser uniquement son entrée dans cette map.

## Responsive & tactile

- CSS mobile-first (`engine/src/styles/global.css`), breakpoints à 600px
  (tablette) et 1024px (desktop).
- Toute zone interactive respecte une taille tactile minimale (~44px, voir
  variable CSS `--eg-tap-min`).
- Les hotspots de scène sont positionnés en pourcentage (jamais en pixels
  fixes) pour s'adapter à toutes les tailles d'écran.
- L'audio ne démarre jamais automatiquement : il attend une interaction
  utilisateur explicite (bouton "Commencer l'enquête"), condition requise
  par les navigateurs mobiles.

## Déploiement

GitHub Actions (`.github/workflows/deploy.yml`) : build de `engine/` avec
Vite (`base: '/escapegame/'`), déploiement du dossier `engine/dist` sur la
branche `gh-pages` / GitHub Pages, déclenché sur push vers `main`.
