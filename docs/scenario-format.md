# Format d'un scénario — Référence complète

Ce document décrit le format JSON attendu par le moteur pour un scénario
d'escape game / enquête. Il est destiné à être lu par une IA (ou un humain)
chargée de **créer un nouveau scénario dans `scenarios/<id>/`**, sans jamais
modifier le moteur (`engine/`).

Le schéma est validé au runtime via Zod
(`engine/src/core/schema/*.schema.ts`). Si le JSON ne respecte pas ce
format, le moteur affichera une erreur explicite au chargement plutôt que
de planter silencieusement.

## Arborescence attendue pour un scénario

```
scenarios/<id-du-scenario>/
├── scenario.json      # obligatoire — structure complète du scénario
├── theme.css           # optionnel — style visuel custom
└── assets/
    ├── images/
    ├── audio/
    └── documents/
```

Le `<id-du-scenario>` (nom de dossier) doit être un slug simple en
minuscules avec des tirets (ex: `manoir-hante`, `bureau-disparu`).

Il faut aussi ajouter une entrée dans `scenarios/manifest.json` (voir plus
bas) pour que le scénario apparaisse dans l'écran de sélection.

## `manifest.json`

```json
{
  "scenarios": [
    {
      "id": "mon-scenario",
      "title": "Titre affiché",
      "description": "Résumé court affiché sur la carte de sélection",
      "difficulty": "easy | medium | hard",
      "estimatedDurationMinutes": 15,
      "thumbnail": "assets/images/thumbnail.png",
      "path": "mon-scenario"
    }
  ]
}
```

- `path` = nom du dossier dans `scenarios/`.
- `thumbnail` est un chemin **relatif** au dossier du scénario.
- Ajouter une nouvelle entrée = ajouter un objet dans le tableau, jamais
  supprimer/modifier les entrées des autres scénarios.

## `scenario.json`

```jsonc
{
  "schemaVersion": 1,               // toujours 1 actuellement, ne pas changer
  "id": "mon-scenario",              // doit correspondre au manifest.json
  "title": "Titre de l'enquête",
  "description": "Texte d'introduction affiché avant de démarrer",
  "author": "optionnel",
  "difficulty": "easy | medium | hard",
  "estimatedDurationMinutes": 15,
  "thumbnail": "assets/images/thumbnail.png",
  "theme": "theme.css",              // optionnel, nom du fichier CSS custom
  "timer": {                           // optionnel : rend la partie chronométrée
    "durationSeconds": 3600,
    "victorySceneId": "scene-finale"
  },
  "introSceneId": "scene-1",         // id de la première scène jouée
  "items": [ /* voir Objets d'inventaire */ ],
  "scenes": [ /* voir Scènes, au moins une */ ]
}
```

Quand `timer` est présent, le compte à rebours démarre au clic sur
« Commencer l'enquête » et continue même si l'onglet ou le navigateur est
fermé. Le joueur peut le mettre explicitement en pause ; la scène est alors
masquée et la partie reste en pause jusqu'à une reprise explicite, y compris
après un rechargement. Atteindre zéro fait perdre la partie. Entrer dans
`victorySceneId` arrête définitivement le minuteur et marque la victoire.

`estimatedDurationMinutes` reste une estimation éditoriale et n'active jamais
le minuteur.

## Scènes

Une scène = un lieu/écran avec une image de fond et des zones interactives
(hotspots).

```jsonc
{
  "id": "scene-1",
  "title": "Le salon",
  "narrative": "Texte d'ambiance affiché en bas de l'écran à l'arrivée",
  "background": "assets/images/salon.png",   // relatif au dossier du scénario
  "ambientSound": "assets/audio/ambiance.mp3", // optionnel, boucle
  "hotspots": [ /* voir Hotspots */ ],
  "clues": [ /* voir Indices */ ],
  "puzzles": [ /* voir Énigmes */ ],
  "exitConditions": {
    "requiresSolvedPuzzleIds": ["puzzle-1"]   // optionnel : bloque la sortie tant que non résolu
  }
}
```

### Hotspots (zones interactives)

Positionnés en **pourcentage** (0-100) de la scène (`x`, `y` = coin
haut-gauche, `width`/`height` = taille), pour rester responsive sur
mobile/tablette/desktop. Éviter les zones trop petites (`width`/`height`)
sur des scènes destinées à être jouées sur smartphone : le moteur applique
une taille tactile minimale au rendu, mais gardez des hotspots larges (au
moins équivalents à ~44px sur un écran de 375px de large, soit environ
12 % de largeur).

```jsonc
{
  "id": "hotspot-tiroir",
  "x": 42, "y": 60, "width": 16, "height": 12,
  "label": "Tiroir du bureau",         // optionnel, affiché sous la zone
  "action": {
    "kind": "open-puzzle",             // ou "show-clue" | "go-to-scene" | "collect-item"
    "puzzleId": "puzzle-1"
  },
  "requiresItemIds": ["cle-armoire"],           // optionnel
  "requiresSolvedPuzzleIds": ["puzzle-0"],      // optionnel
  "useItemId": "pied-de-biche"                  // optionnel : objet à sélectionner et consommer
}
```

Types d'action possibles :
- `{ "kind": "open-puzzle", "puzzleId": "..." }`
- `{ "kind": "show-clue", "clueId": "..." }`
- `{ "kind": "go-to-scene", "sceneId": "..." }`
- `{ "kind": "collect-item", "itemId": "..." }`

`requiresItemIds` est uniquement une condition d'affichage : le hotspot
apparaît lorsque les objets concernés ont été trouvés, même s'ils ont ensuite
été consommés. `useItemId` décrit une interaction explicite : le joueur doit
sélectionner cet objet dans l'inventaire puis toucher le hotspot. L'objet
disparaît alors de l'inventaire et le hotspot reste durablement activé. Lors
des interactions suivantes, son action peut être déclenchée sans posséder à
nouveau l'objet.

Un objet consommable étant unique, un même `useItemId` ne peut apparaître que
sur un seul hotspot. Les identifiants des hotspots utilisant un objet doivent
également être uniques dans tout le scénario. Le schéma rejette ces
configurations ambiguës.

### Indices (clues)

```jsonc
{
  "id": "clue-note",
  "type": "text | image | audio | document",
  "title": "Note manuscrite",
  "content": "Texte de l'indice, ou chemin relatif vers l'asset selon le type",
  "alt": "Texte alternatif pour l'accessibilité (image/document)",
  "documentStyle": "letter | typed | scan",  // optionnel, voir ci-dessous
  "unlockedByPuzzleIds": ["puzzle-1"],   // optionnel
  "unlockedByItemIds": ["cle-armoire"]   // optionnel
}
```

Rendu par type :
- `text` et `document` sont affichés dans un cadre "papier" stylisé
  (texture, ombre, bords irréguliers) plutôt qu'un simple paragraphe ou
  lien. Le champ optionnel `documentStyle` permet de choisir le rendu :
  - `letter` (défaut pour `text`) : lettre manuscrite, police cursive.
  - `typed` : rapport tapé à la machine, police monospace.
  - `scan` (défaut pour `document`) : scan/photo posée sur un fond papier ;
    si `content` pointe vers une image (png/jpg/webp/gif/svg/avif), elle
    s'affiche directement dans le cadre ;
    sinon (ex: PDF), un bouton "Ouvrir le document" ouvre le fichier dans
    un nouvel onglet.
- `image` s'affiche directement dans la modale d'indice.
- `audio` utilise le lecteur natif du navigateur (`<audio controls>`),
  jamais de lecture automatique.

### Énigmes (puzzles)

Chaque énigme a un `type` parmi les 5 supportés nativement par le moteur.
**Ne jamais inventer un nouveau type** dans un scénario : cela nécessiterait
une évolution du moteur. Si aucun type existant ne convient, utilisez le
type le plus proche (souvent `text-match` suffit).

Champs communs à tous les puzzles :
```jsonc
{
  "id": "puzzle-1",
  "type": "...",
  "prompt": "Texte de l'énigme affiché à l'utilisateur",
  "hint": "Indice optionnel affiché en cas d'échec",
  "maxAttempts": 3,              // optionnel
  "failurePenaltySeconds": 30,   // optionnel : temps retiré à chaque mauvaise réponse
  "rewards": {                    // optionnel, débloque des éléments en cas de succès
    "unlockClues": ["clue-x"],
    "unlockItems": ["item-x"],
    "unlockScenes": ["scene-x"]
  }
}
```

`failurePenaltySeconds` est réservé aux scénarios qui déclarent un `timer`.
La pénalité est appliquée à chaque réponse incorrecte et peut provoquer une
défaite immédiate si elle consomme tout le temps restant.

**1. `text-match`** — réponse texte libre, comparaison insensible à la
casse et aux accents par défaut :
```jsonc
{ "type": "text-match", "answers": ["elephant", "éléphant"], "caseSensitive": false }
```

**2. `multiple-choice`** — sélection d'une ou plusieurs bonnes réponses :
```jsonc
{
  "type": "multiple-choice",
  "options": [{ "id": "a", "label": "Option A" }, { "id": "b", "label": "Option B" }],
  "correctOptionIds": ["a"]
}
```

**3. `code-pad`** — code numérique (clavier tactile adapté mobile) :
```jsonc
{ "type": "code-pad", "code": "1234" }
```

**4. `sequence`** — remettre des éléments dans le bon ordre :
```jsonc
{
  "type": "sequence",
  "items": [{ "id": "x", "label": "X" }, { "id": "y", "label": "Y" }],
  "correctOrder": ["y", "x"]
}
```

**5. `combination-lock`** — cadenas à molettes (1 à 6 roues, chiffres 0-9) :
```jsonc
{ "type": "combination-lock", "wheels": 3, "combination": [8, 9, 2] }
```

## Objets d'inventaire (items)

Déclarés au niveau du scénario (pas de la scène), car un objet peut être
utilisé dans n'importe quelle scène :

```jsonc
{
  "id": "cle-armoire",
  "name": "Clé de l'armoire",
  "description": "Une petite clé rouillée",
  "icon": "assets/images/cle.png"   // optionnel
}
```

Un objet rejoint l'inventaire grâce à une action de hotspot `collect-item` ou
à une récompense d'énigme `unlockItems`. Un hotspot de collecte disparaît dès
que l'objet a été trouvé. Pour utiliser un objet, le joueur le sélectionne
dans l'inventaire puis active un hotspot dont `useItemId` correspond. Une fois
consommé, l'objet ne peut pas être collecté une seconde fois.

## Bonnes pratiques pour la génération IA

1. **Toujours** commencer par relire ce document avant de générer un
   `scenario.json`.
2. **Un dossier par scénario**, jamais de fichier créé en dehors de
   `scenarios/<id>/` (sauf l'entrée `manifest.json`).
3. Utiliser des `id` **uniques et stables** (kebab-case) pour scènes,
   hotspots, indices, énigmes, items — ils sont référencés entre eux.
4. Vérifier la cohérence des références : chaque `puzzleId`, `clueId`,
   `sceneId`, `itemId` utilisé dans une action ou condition doit exister
   quelque part dans le scénario.
5. Chaque scénario doit rester jouable **du début à la fin** sans blocage :
   toute condition de sortie (`exitConditions`) ou hotspot conditionné doit
   être atteignable via une combinaison d'énigmes résolues dans le
   scénario.
6. Penser mobile : hotspots suffisamment grands, textes courts et lisibles,
   pas de dépendance à un clavier physique (préférer `code-pad` à un texte
   très précis quand c'est pertinent).
7. Ne pas dépasser des assets trop lourds (compresser images/sons) pour un
   chargement rapide sur mobile/4G.
8. Toujours fournir une image de fond (`background`) par scène pour une
   bonne expérience visuelle.
9. Valider le JSON généré face au schéma avant de considérer le travail
   terminé (voir README du moteur pour lancer `npm run dev` et tester en
   conditions réelles).
10. Pour les décors et ambiances, privilégier des médias téléchargés sous
    domaine public/CC0, puis CC BY. Exclure NC, ND, SA et les licences
    propriétaires de banques gratuites. Vérifier la licence sur la page
    canonique, conserver le fichier dans le scénario et consigner titre,
    auteur, source, licence, date et transformations dans
    `ASSET-SOURCES.md`.
11. Réserver les créations originales aux médias qui doivent porter une
    information spécifique au scénario, notamment les documents et indices
    d'énigme pour lesquels aucun contenu libre adapté n'existe.

## Production et calibration des scènes

Une photo de scène n'est pas seulement une illustration d'ambiance : elle
constitue le repère spatial de toutes les interactions. Chaque hotspot doit
donc correspondre à un objet ou à un passage réellement identifiable dans
l'image finale.

Ordre de production recommandé :

1. Lister les objets interactifs indispensables et leur rôle narratif.
2. Chercher une image qui contient déjà la majorité de ces objets, puis
   adapter les interactions aux éléments réellement visibles.
3. Réserver le photomontage aux accessoires indispensables absents de la
   source. Harmoniser perspective, lumière, ombres, grain et colorimétrie.
4. Exporter le décor final en WebP ou JPEG. Les SVG restent adaptés aux
   documents et aux indices examinés séparément, pas aux décors
   photoréalistes complets.
5. Calibrer les hotspots uniquement sur le fichier final.
6. Vérifier le résultat au format desktop et à environ 375 px de large.

Le moteur affiche l'image complète sans la rogner et place les hotspots dans
le même canevas. Le joueur peut zoomer et déplacer ce canevas : l'image et les
zones interactives restent ainsi alignées à toutes les tailles d'écran.

En développement, ajouter `?hotspots=1` à la route du jeu affiche une grille,
tous les hotspots (même verrouillés) et leurs identifiants. Faire glisser le
pointeur sur un objet mesure un rectangle et fournit les coordonnées JSON en
pourcentage. Par exemple :

`#/play/mon-scenario?hotspots=1`

Conserver les objets obligatoires loin des bords, éviter les zones qui se
chevauchent et viser au minimum une cible tactile d'environ 44 px. Le moteur
agrandit la surface tactile autour d'une petite zone sans modifier ses
coordonnées visuelles.
