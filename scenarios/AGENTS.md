# AGENTS.md — Scénarios (`scenarios/`)

Ce dossier contient uniquement du **contenu de jeu** (scénarios), jamais de
code du moteur.

## Règle d'or

> **Un scénario ne modifie jamais `engine/`.**

Toute création ou modification de scénario doit rester confinée à :
- son propre dossier `scenarios/<id-du-scenario>/`
- son entrée correspondante dans `scenarios/manifest.json`

Si une IA ou un contributeur pense avoir besoin de modifier `engine/` pour
faire fonctionner un scénario (ex: un type d'énigme qui n'existe pas), il
faut le signaler explicitement plutôt que de le faire silencieusement :
c'est potentiellement une évolution du moteur, à traiter séparément (voir
`../engine/AGENTS.md`).

## Comment créer un scénario

Utiliser le skill **`create-scenario`**, qui décrit pas à pas la marche à
suivre. En résumé :

1. Lire `../docs/scenario-format.md` (format JSON complet, types d'énigmes
   disponibles).
2. Créer `scenarios/<id>/scenario.json`, `theme.css` (optionnel),
   `assets/{images,audio,documents}/`.
3. Ajouter l'entrée dans `scenarios/manifest.json`.
4. Valider avec `npm run dev` (depuis `engine/`) : le scénario doit
   apparaître sur l'écran d'accueil et être jouable jusqu'au bout.
5. Vérifier le rendu en largeur mobile (~375px) en plus du desktop.

## Médias

Pour les fonds, illustrations décoratives et ambiances sonores, privilégier
des médias téléchargés depuis des banques libres plutôt que des générations
approximatives. Utiliser d'abord le domaine public ou CC0, puis CC BY avec
attribution ; exclure NC, ND, SA et les licences propriétaires de banques
gratuites. Conserver les fichiers localement et documenter chaque source dans
`scenarios/<id>/ASSET-SOURCES.md` selon le skill `create-scenario`.

Une création originale reste adaptée aux documents et indices qui doivent
contenir une information précise propre à l'énigme.

## Format de référence

Voir `../docs/scenario-format.md` pour le détail exhaustif des scènes,
hotspots, indices et types d'énigmes supportés
(`text-match`, `multiple-choice`, `code-pad`, `sequence`,
`combination-lock`).

## Bon exemple à consulter

`scenarios/exemple-scenario-1/` est un scénario minimal fonctionnel
couvrant : deux scènes, un item d'inventaire, une énigme texte, une énigme
cadenas, un indice image, un thème CSS custom. À utiliser comme référence
de structure.
