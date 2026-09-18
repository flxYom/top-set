# Design system Top Set

Ce fichier sert à prendre des décisions cohérentes, pas à décrire l'interface
pour le plaisir. Chaque règle dit **ce qu'on fait**, **pourquoi**, et d'où vient
la décision. Ce qui n'est pas encore tranché est marqué **À décider**.

Point de départ mesuré : [`docs/design/audit-identite-2026-09-13.md`](audit-identite-2026-09-13.md).
Implémentation : les styles d'origine dans `index.html`, puis la couche
`<style id="refonte">` qui les surcharge. Toute retouche visuelle va dans la
couche de refonte, jamais dans les règles d'origine.

## 1. Priorités

Dans cet ordre, toujours :

1. rapidité de saisie pendant une séance ;
2. lisibilité des performances (charges, répétitions, RPE, records) ;
3. compréhension immédiate de la progression ;
4. ergonomie mobile ;
5. fiabilité ;
6. esthétique et effets, seulement ensuite.

Question à se poser avant chaque changement : *est-ce que ça fait davantage
penser à une application de musculation professionnelle utilisée tous les
jours, ou seulement à une interface plus décorée ?* Si c'est seulement plus
décoré, on ne le fait pas.

## 2. Couleurs

### Base de marque

| Jeton | Valeur | Rôle |
|---|---|---|
| `--bg` | `#0c0b0a` | fond, noir chaud |
| `--s1` / `--s2` / `--s3` | `#151412` / `#1d1b19` / `#27241f` | trois niveaux de surface |
| `--trait` / `--trait2` | `rgba(255,244,230,.08)` / `.15` | filets et contours |
| `--ink` | `#f5f2ec` | texte principal, blanc cassé |
| `--dim` | `#a39b8f` | texte secondaire |
| `--ink3` | `#8d867b` | texte tertiaire (4,8:1 sur `--s2` ; `#7c756b` avant le 16/09, 3,8:1) |

### Couleurs de sens — un rôle chacune

| Couleur | Valeur | Sert à | Ne sert jamais à |
|---|---|---|---|
| Orange Top Set | `#ff5c38` | la marque, l'action principale, l'onglet actif sur ordinateur, le collier du chargement | décorer, désigner un groupe musculaire |
| Jaune | `#ffd23f` | le record | une alerte, un groupe, un nom qui défile |
| Vert | `#2bd08a` (`#12c07a` dans les styles d'origine) | série faite, réussite, progression | un groupe musculaire |
| Bleu | `#4d7cff` | l'information, le commentaire | un groupe musculaire |

**À décider (phase 2)** :
- une couleur d'erreur à part (aujourd'hui l'erreur est orange, comme l'action) ;
- le jaune des alertes ;
- la pastille TOP set.

### Groupes musculaires — validés le 13/09/2026

Les groupes ne reprennent **jamais** une couleur de sens.

| Groupe | Couleur |
|---|---|
| Pectoraux | `#ff7aa2` rose vif |
| Dos | `#22b8a8` turquoise |
| Épaules | `#a99bff` violet |
| Bras | `#d45fc4` magenta |
| Jambes | `#b3d236` citron vert |
| Abdos | `#c99a6b` cuivre |
| Cardio | `#6fd6f5` bleu ciel |
| Autre | `#8f887d` gris chaud |

Source unique : `GROUP_COLORS` dans `app.js`.

Pour changer une teinte, lancer `node scripts/palette-groupes.mjs`. Le script
vérifie trois choses :
- chaque groupe reste loin de chaque couleur de sens (écart ≥ 10 en ΔE2000) ;
- les groupes restent distincts entre eux, en vision normale et pour les
  trois daltonismes courants (écart ≥ 7 ; l'ancienne palette tombait à 6,7,
  la nouvelle à 7,5 pour la paire Pectoraux/Bras en tritanopie) ;
- le contraste sur la surface des cartes est d'au moins 4,5:1.

Une garde de `test/gabarits.test.mjs` refuse aussi qu'un groupe reprenne une
couleur de sens.

Historique :
- une palette pastel a été écartée : « trop pastel » ;
- l'ancienne palette réutilisait l'orange, le jaune, le vert et le bleu.

## 3. Typographie

État actuel :
- **Bricolage Grotesque** pour la marque, les titres et les grands chiffres ;
- la **police du système** pour le reste (SF Pro sur iPhone).

Les chiffres des compteurs du chargement sont en `tabular-nums`.

**Appliqué le 16/09/2026 (audit UI/UX mesuré à 375 px)** :
- plancher de 11 px pour tout libellé de l'app (24 étaient en dessous,
  jusqu'à 8,5 px) ;
- `tabular-nums` sur les chiffres de performance (séries, récap, tuiles,
  records, bilan, calendrier) ;
- graphique : virgule française et espace avant l'unité (`101,5 kg`),
  5 graduations au plus ;
- 1RM estimé arrondi au demi-kilo ;
- un `»` ne part plus seul à la ligne (espace insécable).

**À décider (phase 2)** :
- une échelle de six tailles au plus (il y en a 29 aujourd'hui), avec
  11 px minimum pour un libellé ;
- trois graisses ;
- `tabular-nums` sur tous les chiffres de performance ;
- des libellés et des boutons en minuscules, les capitales réservées à
  quelques étiquettes courtes.

Contrainte existante : aucune règle ne change la taille des champs de saisie
listés dans la garde iOS. En dessous de 16 px, Safari zoome.

## 4. Surfaces, profondeur, verre

La profondeur vient des surfaces (`--s1` → `--s3`), pas des bordures épaisses
ni des ombres décalées.

**Salle noire, en plus sobre (décision du 13/09/2026).** On garde la refonte,
mais on réduit ce qui est devenu systématique :
- les dégradés ;
- les lueurs ;
- le flou ;
- les boutons en pointillés ;
- les points de fond.

Le détail sera tranché en phase 2.

**Le verre : une seule exception, la loupe des onglets** (décision du
13/09/2026). Aucun nouvel élément en verre ailleurs.

## 5. Mouvement

Une animation sert une interaction, une hiérarchie ou l'identité. Jamais un
simple décor. Toutes s'arrêtent quand l'appareil demande moins d'animations
(`prefers-reduced-motion`).

| Élément | Comportement | Durée |
|---|---|---|
| Loupe des onglets (`#ongletLoupe`) | glisse sous l'onglet choisi, s'étire dans le sens du mouvement comme une goutte, un seul reflet chaud fait le tour du liseré pendant le trajet (l'arc-en-ciel a été retiré le 13/09 : « trop RGB »), reflet en haut au repos ; se fait glisser du doigt (se soulève, suit le doigt, l'onglet le plus proche s'ouvre au lâcher) ; **sur téléphone** (14/09, à la demande : « copie tout » d'après la barre d'iOS 26) : capsule grise flottante, pastille grise au repos, libellés en minuscules, icône active blanche, et au toucher une bulle de verre ×1,3 qui grossit une copie des onglets, avec franges de prisme cyan / jaune / magenta près du bord ; ne bouge pas au chargement ni au redimensionnement ; cachée dans les vues sans onglet | 0,46 s |
| Braise (`.braise`, 18/09) | fond WebGL de l'accueil et du bilan seulement : noir chaud, une lueur braise → orange qui dérive lentement depuis le haut ; demi-résolution, 30 images/s au plus, arrêtée quand l'écran se cache ; une image fixe avec « réduire les animations » ; sans WebGL, le dégradé CSS d'origine | boucle lente |
| Changement de vue | la vue glisse de 6 px en apparaissant | 0,24 s |
| Appui | le bouton s'enfonce | instantané |

## 6. Chargement — une seule langue : la barre qu'on charge

On n'affiche jamais un « Chargement… » tout seul.

| Moment | Variante | Détail |
|---|---|---|
| « OUI, C'EST PLIÉ » | scène complète, 3,2 s (ralentie le 13/09 : « impression de vrai chargement ») | un disque par exercice, à la couleur de son groupe, hauteur selon le volume ; les colliers orange claquent ; la barre décolle, les disques suivent avec un temps de retard, l'ombre au sol se resserre ; les compteurs montent jusqu'aux chiffres du bilan ; un appui passe au bilan |
| « REVOIR LE BILAN » | scène rapide, 2 s | la même, plus vite |
| Compte, synchronisation (`#loader`) | boucle de 3,6 s | charger, clic des colliers, lever, reposer, décharger ; disques neutres, seul le collier est orange |
| Listes, graphique, fil, admin | `attente()` en petit | quatre disques qui glissent sur une barre de 30 px, puis le texte |

Un essai en vidéo générée a été écarté le 13/09/2026 (Higgsfield, Veo 3.1 Lite,
4 crédits). Le prompt n'a pas été respecté :
- disques présents dès la première image ;
- caméra qui bouge ;
- reflet façon démo IA ;
- pas de boucle.

La vidéo pesait aussi 857 Ko, ne se teinte pas selon les données et reste floue
en petit.

## 7. États

**À décider (phase 2).**

Principe : un état ne se distingue jamais par la seule couleur. Il faut aussi
une icône, un texte, une position ou un mouvement.

| État | Aujourd'hui | Problème relevé à l'audit |
|---|---|---|
| Neutre | surface + filet | — |
| Fait | ligne teintée verte + coche verte | lisible |
| Cible / suggéré | bloc bordé orange au-dessus de la grille | prend ~100 px, couleur de la marque |
| Record | petite étoile jaune dans le coin de la coche | quasi invisible en séance |
| Alerte | trait gauche jaune | même jaune que le record |
| Erreur | texte orange | même orange que l'action |

## 8. Icônes

**À décider (phase 3).**

Aujourd'hui, 13 SVG sur une grille de 24 px, avec 10 épaisseurs de trait
différentes, mêlés à des caractères (⇄ ↺ ◷ ✎ ✕). Les emoji du signal d'un
exercice (🟢 🟠 🔴 ⚪) sont remplacés le 16/09 par un point dessiné en CSS, à
côté du mot : la couleur n'est jamais seule.

Cible :
- un seul jeu, grille de 24 px ;
- un seul trait, 1,9 comme les onglets ;
- extrémités rondes ;
- aucun caractère de texte ni emoji utilisé comme icône.

## 9. Images et assets générés par IA

- Top Set n'est pas une galerie d'images IA. Une image doit être éditoriale et
  servir la force, la précision, la progression ou la discipline.
- **Higgsfield** sert d'abord au mouvement. Il faut peu de générations, avec
  des prompts précis :
  - composition ;
  - mouvement ;
  - durée ;
  - caméra ;
  - lumière ;
  - matériaux ;
  - point de départ et d'arrivée ;
  - ce qu'il faut éviter.
- On annonce le coût réel avant de dépenser : une vidéo coûte au moins
  4 crédits.
- En cas de doute sur un résultat : une ressource libre de droits, ou on
  demande. On n'intègre jamais une génération médiocre.
- Les pages de contenu gardent leurs schémas SVG et de vraies captures de
  l'app, sans photos (décision du 11/09/2026).
- Poids : une image d'interface doit rester sous 25 Ko en WebP, et partir dans
  le cache hors ligne (`A_PRECHARGER` dans `sw.js`).

## 10. Responsive et ergonomie en séance

- **Téléphone d'abord.** Sous 900 px, les onglets sont en bas, sous le pouce.
  Ils se rangent quand le clavier sort (`body.clavier`), dans une conversation
  et sur l'écran de bilan.
- **Cibles tactiles de 44 px** partout dans l'app depuis l'audit du 16/09
  (onglets segmentés, crayon de la fiche, périodes du graphique, lignes de
  l'historique d'un exercice, REVOIR LE BILAN). La date de la dernière fois
  garde son cadre de 32 px, mais sa zone d'appui déborde jusqu'à 44 px.
- **Barre du bas toujours récupérable** (18/09, demande : « il faut qu'elle
  soit toujours là ») : elle ne se range que pendant qu'un clavier est
  réellement à l'écran ; tout état périmé est effacé au changement de vue et
  au retour sur la page.
- **Logo** (18/09) : toucher TOPSET ramène à SÉANCES › DU JOUR.
- **À 320 px**, la semaine du planning tient entière : l'année en cours est
  retirée du libellé, et AUJOURD'HUI resserre ses lettres sous 360 px.
- **Fiche d'une séance** : blocs espacés de 10 px ; les quatre chiffres
  (exos, séries, volume, fois) en deux lignes égales.
- **Zones sûres de l'iPhone** (`env(safe-area-inset-*)`) sur toutes les barres
  fixes.
- **Vérifier à 320, 360, 375 et 430 px**, et dans un superset.
- **Chrono du gainage** (14/09) : `▶ CHRONO` neutre à côté de `+ SÉRIE` ; en
  marche, il passe orange (l'action en cours) avec des chiffres à chasse fixe.
  Une pause = une série cochée.
- **Repos** (14/09) : pastille en bas à gauche, en face de « revenir en haut »,
  chiffres verts à chasse fixe (le vert = fait, on récupère). Le message monte
  au-dessus d'elle. Cachée avec le clavier, en conversation et au bilan.
- **Calendrier** (14/09) : jour fait = couleur du groupe en plein (liseré gauche
  en semaine, pastille dans le mois), prévu = pointillé ou contour, aujourd'hui
  = bord orange. Cases du mois ≥ 44 px.
- **Ligne cardio** (14/09) : `MIN · KM/H · INCL. %`, sans colonne de
  difficulté, avec `−1′` / `+1′`. Tient à 360 px sans déborder.
- **Reprendre la dernière fois** (14/09) : jamais depuis la colonne de la
  dernière fois (elle se lit). `↺ DERNIÈRE FOIS` en pointillé neutre à côté de
  `+ SÉRIE` ; `+ AJOUTER À MA SÉANCE DU JOUR` sous chaque exercice d'une séance
  faite ; sur un jour vide, `↺ REFAIRE…` en carte, libellé orange et titre gris.
- **Suggestions d'exercices** (14/09) : sous `+ AJOUTER UN EXERCICE`, un
  sur-titre gris et des pastilles en pointillé neutre, 44 px, quatre au plus.
- **Bilan** (14/09) : plus de tonnage. Le grand chiffre = les exercices en
  hausse par rapport à la même séance la semaine d'avant ; une ligne par
  exercice, pastille `▲ +3 %` verte, `▼ −2 %` orange, `= STABLE` grise.
- **Outils sous le planning** (14/09) : trois liens compacts sur une ligne,
  accent jaune (celui des outils dans Apprendre).

## 11. Méthode avant un changement important

1. Lire le code concerné.
2. Chercher le composant ou le motif qui existe déjà, et le réutiliser.
3. Relire ce fichier.
4. Ne pas créer un nouveau motif sans nécessité.
5. Vérifier le responsive et l'accessibilité.
6. Vérifier les interactions existantes : focus iOS, clavier, retours en
   arrière.
7. Vérifier que les données et le comportement métier n'ont pas bougé :
   `localStorage`, formats JSON et CSV, mode sans compte, hors ligne.

Si le changement rouvre une décision déjà clôturée, le signaler et demander
avant de le faire.

### Décisions clôturées à ne pas rouvrir en silence

- **Carte d'exercice** (11–12/09) :
  - une ligne par série ;
  - outils seulement sur la série ouverte ;
  - commentaire par série ;
  - superset sous « + SÉRIE ».
- **Colonne de la dernière fois** (13/09) : elle se lit, ne recopie pas, et sa
  date ouvre la séance d'avant.
- **Pages de contenu** (11/09) : sans photos.
- **Salle noire** (13/09) : on la garde, en plus sobre.
- **Loupe Liquid Glass** (13/09) : sur les onglets uniquement.
- **Barre du bas façon iOS 26** (14/09) : sur téléphone, capsule grise, pastille grise, bulle à franges de prisme ; reprise d'après Tinder le même jour : verre de la couleur de la barre, filet fin et reflet blanc, arc-en-ciel seulement aux bouts arrondis, coupure nette entre centre et bord. Écart assumé avec la charte : l'onglet actif n'y est plus orange.
- **Palette des groupes** (13/09) : section 2.
- **Loader** (13/09) : en code, pas en vidéo générée.
- **Navigation** (14/09) : on note dans SÉANCES › DU JOUR, où l'app s'ouvre ;
  PLANNING est un calendrier qu'on regarde (semaine par défaut, mois, jour), et
  toucher une séance montre sa fiche sous MES SÉANCES (RETOUR ramène au
  calendrier), un jour vide s'ouvre dans DU JOUR. Plus de pastilles de semaine.
- **En-tête d'Apprendre** (14/09) : le logo, OUVRIR LE CARNET et la barre des
  rubriques restent collés en haut des pages de contenu ; les ancres s'arrêtent
  dessous.
- **Pas de React** (18/09) : la question a été reposée, la réponse reste non ;
  le fond animé se fait en WebGL dans le code actuel.
- **Braise** (18/09) : un fond animé aux moments forts seulement (accueil,
  bilan), jamais pendant la saisie.
- **Description de l'interface** : [`DESIGN.md`](DESIGN.md), extrait du code le
  18/09. Ce fichier-ci garde les décisions et fait foi en cas d'écart.
