---
name: create-scenario
description: Use when the user wants to create, edit, or generate a new escape game / investigation scenario (scenario.json, theme.css, assets, manifest.json entry) under scenarios/. Trigger on requests like "crée un scénario", "nouveau scénario", "génère une enquête", "ajoute une énigme". Do NOT use this skill to modify the game engine (engine/) — that is a separate concern.
---

# Créer un scénario d'escape game

Ce skill sert à créer ou modifier un **scénario** (contenu de jeu) pour le
moteur d'escape game de ce projet. Il ne sert **jamais** à modifier le
moteur (`engine/`).

## Règle absolue

> Ne jamais créer, modifier ou supprimer de fichier en dehors de
> `scenarios/<id-du-scenario>/` et de l'entrée correspondante dans
> `scenarios/manifest.json`.

Si l'énigme ou la fonctionnalité demandée nécessite un type de puzzle, un
type d'action de hotspot, ou un composant qui n'existe pas dans le moteur,
**ne pas contourner cette limite en écrivant du code dans `engine/`**.
Arrêtez-vous et signalez clairement à l'utilisateur que cela nécessite une
évolution du moteur (hors périmètre de ce skill).

## Étapes

1. **Lire le format de référence** : `docs/scenario-format.md` à la racine
   du projet. Il décrit exhaustivement :
   - la structure de `scenario.json` (scènes, hotspots, indices, énigmes,
     objets d'inventaire)
   - les 5 types d'énigmes supportés nativement par le moteur :
     `text-match`, `multiple-choice`, `code-pad`, `sequence`,
     `combination-lock`
   - les 4 types d'action de hotspot : `open-puzzle`, `show-clue`,
     `go-to-scene`, `collect-item`

2. **Regarder l'exemple existant** : `scenarios/exemple-scenario-1/` est un
   scénario minimal fonctionnel à utiliser comme référence de structure
   (deux scènes, un item, plusieurs types d'énigmes, un thème CSS custom).

3. **Créer le dossier du scénario** : `scenarios/<slug-du-scenario>/` avec
   un `id` en kebab-case, unique parmi les scénarios existants. Ne jamais
   réutiliser ou modifier le dossier d'un autre scénario sans demande
   explicite.

4. **Écrire `scenario.json`** conforme au schéma :
   - `schemaVersion: 1`
   - `introSceneId` doit pointer vers une scène existante du tableau
     `scenes`
   - Tous les `id` (scènes, hotspots, indices, énigmes, items) doivent être
     uniques et cohérents avec leurs références croisées
   - Vérifier que le scénario est **jouable de bout en bout** : chaque
     `exitConditions` / hotspot conditionné doit être débloquable par une
     combinaison d'énigmes atteignables

5. **Créer `theme.css`** (optionnel mais recommandé pour l'identité
   visuelle) :
   - Scoper toutes les règles sous `.scenario-<id>` (la classe racine
     injectée automatiquement par le moteur autour de l'écran de jeu)
   - Ne jamais écrire de sélecteur CSS global non scopé (risque de fuite
     vers d'autres scénarios ou l'écran de sélection)

6. **Ajouter les assets** dans
   `scenarios/<id>/assets/{images,audio,documents}/` :
   - Chemins référencés dans `scenario.json` **relatifs** au dossier du
     scénario (ex: `assets/images/salon.png`)
   - Compresser/optimiser les images et sons pour un chargement rapide sur
     mobile/4G
   - Si aucun asset réel n'est disponible (génération from scratch sans
     accès à des images), des SVG simples (formes + texte) sont acceptables
     comme placeholders visuels

7. **Ajouter l'entrée dans `scenarios/manifest.json`** :
   - Ajouter un objet au tableau `scenarios`, sans toucher aux entrées
     existantes
   - `path` doit correspondre exactement au nom du dossier créé

8. **Contraintes responsive & tactile à respecter systématiquement** :
   - Hotspots suffisamment grands (éviter des `width`/`height` trop petits
     en %, viser l'équivalent d'au moins ~44px sur un écran de 375px de
     large, soit ~12% de largeur)
   - Textes courts et lisibles sur petit écran
   - Préférer `code-pad` à un `text-match` très strict quand une saisie
     précise est nécessaire (clavier numérique plus fiable sur mobile)

9. **Valider le travail** :
   - Depuis `engine/`, lancer `npm run dev`
   - Vérifier que le scénario apparaît sur l'écran d'accueil
     (`/#/` — liste des scénarios)
   - Jouer le scénario jusqu'au bout pour vérifier qu'aucune condition ne
     bloque la progression
   - Vérifier le rendu à une largeur mobile (~375px) en plus du desktop
   - Si le JSON est invalide, le moteur affichera une erreur de validation
     Zod explicite au chargement : corriger le `scenario.json` en
     conséquence

## Résumé du format (voir `docs/scenario-format.md` pour le détail complet)

```jsonc
{
  "schemaVersion": 1,
  "id": "mon-scenario",
  "title": "...",
  "introSceneId": "scene-1",
  "items": [{ "id": "...", "name": "..." }],
  "scenes": [
    {
      "id": "scene-1",
      "title": "...",
      "background": "assets/images/xxx.png",
      "hotspots": [
        {
          "id": "...", "x": 0, "y": 0, "width": 10, "height": 10,
          "action": { "kind": "open-puzzle", "puzzleId": "..." }
        }
      ],
      "clues": [{ "id": "...", "type": "text", "title": "...", "content": "..." }],
      "puzzles": [
        { "id": "...", "type": "text-match", "prompt": "...", "answers": ["..."] }
      ]
    }
  ]
}
```
