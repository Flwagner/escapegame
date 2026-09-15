---
name: create-scenario
description: Use when the user wants to create, edit, or generate an escape game or investigation scenario under scenarios/, including scenario.json, theme.css, images, audio, documents, and its manifest entry. Trigger on requests such as "cree un scenario", "nouveau jeu", "genere une enquete", or "ajoute une enigme". Never use this skill to modify the game engine under engine/.
---

# Creer un scenario d'escape game

Ce skill produit un scenario complet et jouable pour le moteur d'escape game
de ce projet. Il couvre la conception, l'enchainement des etapes, les donnees,
le theme et tous les medias necessaires au jeu.

## Perimetre absolu

Pendant une creation ou une modification de scenario, les seuls fichiers qui
peuvent etre crees, modifies ou supprimes sont :

- `scenarios/<id-du-scenario>/**` pour le scenario concerne ;
- l'objet correspondant dans `scenarios/manifest.json`.

Ne jamais modifier un fichier sous `engine/`, meme pour faire fonctionner une
idee de scenario. Ne jamais ajouter de logique specifique au scenario dans le
moteur. Les commandes de verification peuvent etre lancees depuis `engine/`,
mais leurs eventuels artefacts de build ne doivent pas etre versionnes.

Si une fonctionnalite demandee n'existe pas dans le moteur, l'indiquer
clairement a l'utilisateur et proposer une adaptation utilisant les capacites
existantes. Ne modifier le moteur sous aucun pretexte dans le cadre de ce
skill.

## Informations requises

Avant de creer le scenario, disposer obligatoirement de ces quatre donnees :

1. **Difficulte** : `easy`, `medium` ou `hard`.
2. **Duree estimee** : nombre entier positif de minutes.
3. **Ambiance** : direction visuelle, ton narratif et ambiance sonore voulue.
4. **Contexte** : lieu, epoque, situation initiale et objectif du joueur.

Ne demander a l'utilisateur que les informations manquantes. Ne pas lui faire
revalider des informations deja explicites dans sa demande. La difficulte et
la duree sont des objectifs de conception et des metadonnees affichees ; le
moteur ne les applique pas automatiquement.

Les informations suivantes sont optionnelles et ne doivent etre demandees que
si elles sont necessaires : langue, public ou age cible, themes a eviter,
nombre de joueurs et nom d'auteur.

## Sources de verite a consulter

Avant toute generation :

1. Lire `docs/scenario-format.md`.
2. Lire les schemas actuels dans `engine/src/core/schema/*.schema.ts`.
3. Inspecter `scenarios/manifest.json` et les dossiers deja presents afin
   d'eviter tout conflit d'identifiant ou de chemin.
4. Consulter un scenario existant uniquement s'il en existe un. Ne jamais
   supposer que `scenarios/exemple-scenario-1/` est present.
5. En cas de divergence, les schemas definissent la forme des donnees, mais le
   comportement reel des composants et du store determine ce qui fonctionne.
   Respecter les limitations ci-dessous.

## Capacites utilisables du moteur

### Enigmes

Utiliser exclusivement les cinq types natifs :

- `text-match` ;
- `multiple-choice` ;
- `code-pad` ;
- `sequence` ;
- `combination-lock`.

Ne jamais inventer un type. `maxAttempts` ne limite actuellement pas les
tentatives et ne retarde pas l'affichage de l'indice : ne pas construire une
mecanique qui depend de ce comportement.

### Actions de hotspot

Utiliser exclusivement :

- `open-puzzle` ;
- `show-clue` ;
- `go-to-scene` ;
- `collect-item`.

Un `open-puzzle` doit cibler une enigme de la meme scene. Un `show-clue` doit
cibler un indice de la meme scene. Un `go-to-scene` peut cibler toute scene
existante. Un `collect-item` doit cibler un objet declare au niveau du
scenario.

La navigation se fait uniquement par un hotspot `go-to-scene`. Le champ
`exitConditions.nextSceneId` ne declenche aucune navigation automatique et ne
doit pas etre utilise. Preferer les conditions du hotspot pour verrouiller une
sortie precise. Les `exitConditions` d'une scene bloquent toutes ses sorties,
y compris un eventuel retour en arriere.

Un hotspot conditionnel est invisible tant que ses conditions ne sont pas
remplies. La mise en scene doit rendre son apparition comprehensible sans
compter sur un message de verrouillage du moteur.

Pour demander l'utilisation explicite d'un objet, ajouter `useItemId` au
hotspot. Le joueur selectionne l'objet dans l'inventaire puis active ce
hotspot. L'objet est consomme et disparait de l'inventaire ; le hotspot reste
ensuite durablement active et son action peut etre repetee sans l'objet. Le
schema refuse qu'un meme objet soit utilise par plusieurs hotspots et exige
des identifiants uniques pour les hotspots utilisant un objet. Ne pas
confondre `useItemId` avec `requiresItemIds`, qui controle seulement
l'apparition du hotspot a partir de l'historique des objets trouves.

### Indices, objets et recompenses

Les indices peuvent etre de type `text`, `image`, `audio` ou `document`.

- Un indice audio est lance manuellement avec les controles du navigateur.
- Un document image est affiche dans le jeu avec agrandissement.
- Un PDF ou autre document non image s'ouvre dans un nouvel onglet.
- Un indice `text` contient son texte directement dans le JSON ; il ne charge
  pas le contenu d'un fichier `.txt`.

Les objets d'inventaire peuvent etre collectes par `collect-item` ou
`rewards.unlockItems`, selectionnes dans l'inventaire et consommes par un
hotspot portant le meme `useItemId`. Un objet consomme ne peut pas etre
collecte une seconde fois. Ne pas reutiliser un meme objet consommable sur
plusieurs hotspots concurrents. Le moteur ne gere pas la combinaison de
plusieurs objets ni le glisser-deposer.

Les recompenses `unlockClues` et `unlockItems` fonctionnent. Ne jamais utiliser
`rewards.unlockScenes`, qui est accepte par le schema mais n'est pas applique
par le moteur. Debloquer un passage avec les conditions d'un hotspot
`go-to-scene`.

### Audio et fin de partie

Une scene peut posseder une seule ambiance sonore en boucle via
`ambientSound`. Elle ne demarre qu'apres l'action explicite permettant de
commencer le jeu. Les indices audio restent controles manuellement. Ne pas
promettre de playlist, de fondu, de narration automatique ou d'effet sonore
personnalise declenche par un evenement.

Conclure le scenario avec une scene terminale contenant une conclusion
narrative explicite et aucune sortie obligatoire. Pour une partie limitee dans
le temps, declarer `timer.durationSeconds` et faire pointer
`timer.victorySceneId` vers cette scene terminale. Le minuteur continue hors du
jeu, mais le joueur peut le mettre explicitement en pause. Il s'arrete a
l'entree dans la scene finale et atteindre zero fait perdre la partie.

Dans un scenario chronometre, `failurePenaltySeconds` peut etre ajoute aux
enigmes dont chaque mauvaise reponse doit retirer du temps. Utiliser ces
penalites avec parcimonie, principalement en difficulte elevee, et annoncer
clairement leur application au joueur. `estimatedDurationMinutes` reste une
estimation et n'active jamais le minuteur.

## Preproduction obligatoire

Avant d'ecrire les fichiers finaux, etablir un plan interne comprenant :

- titre, slug, synopsis et objectif final ;
- direction visuelle, palette, style des documents et direction sonore ;
- liste des scenes et duree cible de chacune ;
- liste des enigmes, solutions, indices et objets ;
- graphe des transitions et des dependances ;
- scene terminale et conclusion ;
- inventaire exhaustif des images, pistes audio et documents a produire.

Adapter la densite au temps demande. Utiliser comme ordre de grandeur trois a
huit minutes par enigme, puis ajuster selon la difficulte, la lecture et
l'exploration. La somme des budgets d'etapes doit rester coherente avec la
duree annoncee.

- `easy` : deductions directes, peu de dependances et indices explicites.
- `medium` : recoupements entre plusieurs elements et dependances moderees.
- `hard` : recoupements en plusieurs etapes et fausses pistes equitables,
  sans reponse arbitraire ni information absente.

Chaque solution doit etre deduisible a partir d'elements accessibles avant
l'enigme. Ne jamais utiliser une connaissance externe indispensable sauf si le
contexte demande explicitement une culture generale.

## Audit du graphe de progression

Pour chaque element, verifier avant generation :

- comment chaque scene est atteinte pour la premiere fois ;
- quel hotspot ouvre chaque enigme ;
- quels elements permettent de deduire chaque solution ;
- quel hotspot affiche chaque indice ;
- comment chaque objet est obtenu ;
- quels predecesseurs satisfont chaque condition ;
- quelles transitions permettent d'avancer et, si necessaire, de revenir ;
- comment le joueur atteint la scene terminale.

Refuser toute dependance circulaire sans chemin alternatif. Aucun objet,
indice ou enigme obligatoire ne doit dependre d'un element qu'il debloque lui-
meme. Eviter les `exitConditions` lorsqu'elles risquent de bloquer le retour
vers une scene necessaire.

## Production des assets

Determiner avant la creation si les outils disponibles permettent reellement
de produire les images, sons et documents prevus. Si un generateur adapte ou
une source d'assets exploitable n'est pas disponible, s'arreter et demander a
l'utilisateur comment proceder. Ne pas finaliser un scenario incomplet et ne
pas remplacer silencieusement les medias par des placeholders.

Pour les images decoratives, les fonds de scene et les ambiances sonores,
chercher d'abord des medias existants de qualite dans des banques libres. Ne
produire un media original que lorsqu'aucun media libre coherent n'existe ou
qu'il doit transmettre une information precise propre a une enigme (document,
symbole, portrait annote, narration, etc.). Ne jamais utiliser une creation
generique de moindre qualite uniquement pour eviter la recherche de sources.

Accepter uniquement, dans cet ordre de preference :

1. domaine public ou CC0 ;
2. CC BY, avec attribution complete.

Refuser les licences NC, ND et SA, les licences gratuites propres aux banques
d'images, les contenus dont l'auteur ou la licence ne peuvent pas etre
verifies et les resultats fournis uniquement par un moteur de recherche. Pour
chaque media, verifier la licence sur sa page source canonique. Un agregateur
comme Openverse peut servir a la recherche, mais pas de preuve de licence.

Telecharger le fichier dans le scenario : ne jamais utiliser de hotlink ni
d'URL distante dans `scenario.json` ou `theme.css`. Adapter le cadrage, la
colorimetrie, la duree ou le format si la licence le permet, puis optimiser la
copie pour le Web sans degrader visiblement le media.

Creer systematiquement `ASSET-SOURCES.md` des qu'un media externe est utilise.
Pour chaque fichier, indiquer le titre, l'auteur, la page source canonique, la
licence exacte avec son lien, la date de telechargement et les transformations
effectuees. Identifier aussi explicitement les medias produits localement.

Arborescence recommandee :

```text
scenarios/<id>/
|-- scenario.json
|-- theme.css
|-- ASSET-SOURCES.md
`-- assets/
    |-- images/
    |   |-- thumbnail.webp
    |   |-- scene-*.webp
    |   |-- clue-*.webp
    |   `-- item-*.webp
    |-- audio/
    |   |-- ambience-*.mp3
    |   `-- clue-*.mp3
    `-- documents/
        |-- document-*.webp
        `-- document-*.pdf
```

Exigences minimales :

- une miniature representative ;
- une image de fond reelle par scene ;
- toutes les illustrations d'indices et d'objets necessaires ;
- les pistes d'ambiance ou indices audio prevus par la direction sonore ;
- tous les documents dont depend la resolution des enigmes ;
- aucun fichier vide, aucune fausse extension et aucun placeholder non
  approuve explicitement ;
- formats lisibles par les navigateurs modernes et poids adapte au mobile/4G.

Utiliser de preference WebP ou JPEG pour les scenes, PNG/WebP pour les
documents devant rester tres lisibles, MP3 pour l'audio et PDF uniquement si
l'ouverture dans un nouvel onglet est acceptable. Tous les chemins doivent
etre locaux et relatifs au dossier du scenario.

Pour les documents produits localement, chaque element graphique doit avoir
une fonction identifiable : information d'enigme, structure du document ou
decoration clairement intentionnelle et coherente. Ne pas ajouter de forme
isolee, gribouillis, cercle, soulignement ou pictogramme generique uniquement
pour remplir un espace. Aucun element decoratif ne doit chevaucher du texte,
ressembler a une annotation porteuse d'un indice ou attirer davantage
l'attention que le contenu utile. Garder une marge visible entre textes,
illustrations et bordures.

Les images de scene sont affichees avec un cadrage de type `cover`. Conserver
les objets interactifs dans une zone sure centrale et verifier l'alignement
des hotspots sur des formats mobile et desktop. Ne pas placer une information
indispensable dans une zone susceptible d'etre rognee.

## Creation de `scenario.json`

Respecter integralement `docs/scenario-format.md` et les schemas Zod, avec les
restrictions comportementales de ce skill.

- Utiliser `schemaVersion: 1`.
- Utiliser des identifiants uniques, stables, en kebab-case ASCII.
- Faire correspondre exactement le nom du dossier, `scenario.id`,
  `manifest.id` et `manifest.path`.
- Utiliser des noms de fichiers minuscules en kebab-case, sans espace.
- Interdire dans les chemins `..`, les chemins absolus, les antislashs et les
  URL distantes.
- Faire pointer `introSceneId` vers une scene existante.
- Verifier les references de toutes les actions, conditions et recompenses.
- Si `timer` est present, faire pointer `victorySceneId` vers la scene
  terminale et calibrer `durationSeconds` par rapport au parcours complet.
- Ne declarer `failurePenaltySeconds` que sur les enigmes d'un scenario
  chronometre.
- Garder `open-puzzle` et `show-clue` strictement locaux a leur scene.
- Ne pas ajouter de champ personnalise ou inconnu au schema.
- Fournir un `alt` pertinent pour les images et documents.
- Ne pas faire dependre une enigme uniquement d'une couleur, d'un texte
  minuscule ou d'un son sans alternative accessible.

Les hotspots doivent etre decouvrables par la composition visuelle et avoir
un `label` descriptif. Viser au moins environ 12 % de largeur sur un ecran de
375 px et une hauteur tactile suffisante, les eloigner des bords et verifier
leur zone reelle au tap. Ne pas supposer que les pourcentages garantissent a
eux seuls un bon rendu responsive.

## Creation de `theme.css`

Creer un theme coherent avec l'ambiance demandee. Scoper chaque regle sous
`.scenario-<id>` et ne jamais utiliser de selecteur global non scope.

Preferer la surcharge des variables CSS publiques du moteur sous la racine du
scenario. Ne pas cibler les noms generes des CSS Modules, qui ne constituent
pas une API stable. Preserver le contraste, les etats de focus, la lisibilite
et les usages tactiles. Les URL utilisees dans `theme.css` sont relatives au
fichier CSS.

Exemple :

```css
.scenario-mon-scenario {
  --eg-color-bg: #15120f;
  --eg-color-surface: #272019;
  --eg-color-text: #f4ead7;
  --eg-color-accent: #c9984a;
}
```

## Mise a jour du manifeste

Ajouter exactement une entree a `scenarios/manifest.json` sans modifier les
autres entrees. Verifier l'unicite de `id` et `path`.

Synchroniser avec `scenario.json` :

- `id` ;
- `title` ;
- `description` ;
- `difficulty` ;
- `estimatedDurationMinutes` ;
- `thumbnail`.

Le manifeste alimente l'ecran de selection tandis que `scenario.json`
alimente l'ecran de jeu : une divergence serait visible par le joueur.

## Validation obligatoire

La validation Zod est necessaire mais insuffisante. Ne jamais conclure que le
scenario est valide uniquement parce que `npm run build` reussit.

### Structure et semantique

- Parser strictement `manifest.json` et `scenario.json`.
- Charger le scenario dans l'application pour executer Zod.
- Verifier l'unicite de tous les identifiants.
- Verifier `introSceneId` et toutes les references croisees.
- Verifier que chaque `useItemId` cible un objet declare et accessible avant
  son hotspot, sans usage concurrent du meme objet consommable.
- Verifier les contraintes locales de `open-puzzle` et `show-clue`.
- Verifier que le graphe complet est atteignable sans cycle bloquant.
- Verifier que chaque solution est deduisible avec les indices disponibles.
- Verifier que chaque enigme, indice et objet prevu est accessible.

### Assets

- Verifier que chaque chemin reference existe dans le dossier du scenario.
- Verifier que chaque fichier est non vide et possede le bon type reel.
- Ouvrir ou decoder les images, sons et documents.
- Inspecter visuellement chaque document dans son rendu final, en entier puis
  agrandi, et supprimer toute forme parasite, superposition, coupure ou marque
  ambigue qui ne transmet pas une information volontaire.
- Verifier l'absence de 404 et d'erreur de decodage dans le navigateur.
- Verifier que l'audio ne demarre jamais avant une interaction utilisateur.

### Jeu complet

- Lancer `npm run dev` depuis `engine/`.
- Verifier la carte du scenario sur
  `http://localhost:5173/escapegame/#/`.
- Verifier aussi la route directe
  `http://localhost:5173/escapegame/#/play/<id>`.
- Reinitialiser la progression locale avant le test afin qu'une ancienne
  sauvegarde ne masque pas un blocage.
- Tester les mauvaises et bonnes reponses, les deblocages, la collecte et
  l'utilisation des objets, leur disparition de l'inventaire, la reutilisation
  des hotspots actives, toutes les transitions et la scene finale.
- Pour un scenario chronometre, tester le compte a rebours, les penalites, la
  pause/reprise, la defaite a zero et l'arret dans la scene finale.
- Jouer le scenario de bout en bout sur desktop et a environ 375 px de large.
- Controler l'alignement des hotspots, les zones tactiles et les debordements
  de texte.

### Build

- Executer `npm run build` depuis `engine/`.
- Verifier que les fichiers du scenario sont copies dans le build statique.
- Ne jamais corriger un echec en modifiant `engine/` dans le cadre de ce
  skill. Signaler une incompatibilite eventuelle a l'utilisateur.

## Compte rendu final

Une fois le travail termine, indiquer clairement :

- l'identifiant et le dossier crees ;
- le nombre de scenes et d'enigmes ;
- la difficulte et la duree cible ;
- les images, pistes audio et documents produits ;
- les validations reellement effectuees ;
- toute limite restante ou verification manuelle non effectuee.

Ne jamais annoncer qu'un scenario est complet si un media manque, si une
verification n'a pas ete effectuee ou si la progression n'a pas ete testee de
bout en bout.
