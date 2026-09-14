# AGENTS.md — Moteur de jeu (`engine/`)

Ce dossier contient uniquement le **moteur générique**. Il ne doit jamais
contenir de logique, de texte, d'image ou de son propre à un scénario
particulier. Tout contenu spécifique va dans `../scenarios/<id>/`.

## Contrat avec les scénarios

Le format des scénarios est défini par les schémas Zod dans
`src/core/schema/*.schema.ts` et documenté dans
`../docs/scenario-format.md`. Ce contrat est versionné via le champ
`schemaVersion` du scénario.

- Étendre le format (ex: nouveau type de puzzle, nouveau champ optionnel)
  est possible **sans casser les scénarios existants** : privilégier des
  champs optionnels, garder la rétro-compatibilité.
- Si un changement est réellement incompatible, incrémenter
  `schemaVersion` et gérer la migration/l'ancien format explicitement dans
  le loader (`src/core/loader/scenarioLoader.ts`).
- Ne jamais coder en dur du contenu narratif, des id de scène/puzzle, ou
  toute logique propre à un scénario particulier dans le moteur.

## Structure du code

- `src/core/schema/` — schémas Zod (source de vérité du format scénario)
- `src/core/loader/` — chargement + validation runtime des fichiers JSON
  (`fetch` relatif à `import.meta.env.BASE_URL`, jamais d'import statique
  d'un scénario)
- `src/core/state/gameStore.ts` — état de jeu Zustand, persistance
  localStorage par scénario (`progressByScenario`)
- `src/core/engine/` — logique pure et testée : résolution des énigmes
  (`puzzleEngine.ts`), conditions de déblocage de scène/hotspot/indice
  (`sceneEngine.ts`). Ajouter un test unitaire (`__tests__/`) pour toute
  nouvelle règle.
- `src/core/audio/audioManager.ts` — wrapper Howler ; ne jamais déclencher
  de son automatiquement sans interaction utilisateur préalable
  (`unlockAudioContext()`)
- `src/components/` — composants génériques (SceneView, PuzzleModal,
  Inventory, ClueViewer, ScenarioSelector, ProgressBar, PlayScreen).
  Toute UI ajoutée ici doit rester paramétrable par les données JSON d'un
  scénario, jamais spécifique à un scénario donné.
- `src/theming/ThemeInjector.tsx` — injection/retrait du CSS custom d'un
  scénario, scopé via une classe racine `.scenario-<id>`

## Ajouter un nouveau type de puzzle (exemple d'évolution du moteur)

1. Ajouter le schéma Zod dans `puzzle.schema.ts` (nouveau membre de
   `PuzzleSchema` discriminated union).
2. Ajouter le validateur correspondant dans `puzzleEngine.ts`
   (`checkPuzzleAnswer`).
3. Ajouter le rendu du formulaire dans `PuzzleModal.tsx`.
4. Documenter le nouveau type dans `../docs/scenario-format.md`.
5. Ajouter des tests unitaires dans
   `src/core/engine/__tests__/puzzleEngine.test.ts`.
6. Vérifier que les scénarios existants (n'utilisant pas ce nouveau type)
   continuent de fonctionner sans modification.

## Contraintes non négociables

- **Responsive et tactile** : mobile-first, breakpoints 600px/1024px (voir
  `src/styles/global.css`). Toute nouvelle zone interactive doit respecter
  la taille tactile minimale (`--eg-tap-min`, ~44px) et fonctionner au tap
  comme au clic.
- **Pas d'autoplay audio.**
- **Pas de backend** : toute donnée vient de `fetch` sur des fichiers
  statiques (`scenarios/`) ou de `localStorage`.

## Check-list avant de considérer une modification du moteur terminée

1. `npm run build` passe sans erreur.
2. `npm run test` passe.
3. `npm run lint` ne remonte pas de nouvelle erreur.
4. Le scénario d'exemple (`scenarios/exemple-scenario-1/`) reste jouable de
   bout en bout (`npm run dev`, tester sur ~375px de large en plus du
   desktop).
5. Aucune régression du format : les schémas Zod restent rétro-compatibles
   ou `schemaVersion` a été géré explicitement.
