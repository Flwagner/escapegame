# Escape Game

Moteur de jeu type escape game / enquête, 100 % front-end (React + TS +
Vite), sans backend, hébergé sur GitHub Pages.

- `engine/` — le moteur générique (voir `engine/AGENTS.md`)
- `scenarios/` — le contenu jouable, un dossier par scénario
  (voir `scenarios/AGENTS.md`)
- `docs/architecture.md` — vue d'ensemble technique
- `docs/scenario-format.md` — référence complète du format de scénario

Voir `AGENTS.md` à la racine pour les règles générales du projet.

## Démarrage rapide

```bash
cd engine
npm install
npm run dev
```

Ouvrir <http://localhost:5173/escapegame/>.
