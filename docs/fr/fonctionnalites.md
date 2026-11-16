> **Français** · [English](../en/features.md)

# Fonctionnalités

Une partie de la [documentation de Top Set](../../README.fr.md#documentation).

## Ce qu'il fait

**Le premier écran.** À la toute première visite, l'app s'ouvre sur
`COMMENCER SANS COMPTE`, en tête, puis le formulaire du compte juste en dessous
— sans geste de plus pour qui en veut un. Avant, c'était l'inverse : un
formulaire d'inscription, et la sortie en petit lien souligné tout en bas, alors
que la description du site et la page produit promettent « sans compte ». Le
bouton se cache pendant un oubli ou un changement de mot de passe, où il
abandonnerait l'opération à mi-chemin.

**Quatre onglets, quatre métiers** (20/09/2026, demande : « entre le
calendrier, le récap, la séance, les séances, les séances du jour c'est trop
fouilli »). Sept endroits montraient des séances — PLANNING (jour, semaine,
mois), SÉANCES (du jour, mes séances, historique) et le RÉCAP ; quatre
affichaient la même liste sous une autre forme. Il en reste quatre, et chacun
fait une seule chose :
- **SÉANCE** : ce qu'on fait maintenant. Le bandeau du jour, les exercices, les
  séries. Plus aucun sous-onglet. C'est là que l'app s'ouvre.
- **CARNET** : chercher un exercice, un jour ou une séance. Le calendrier **et**
  la liste sur le même écran.
- **PROGRÈS** : records, volume, bilans (l'ancien RÉCAP).

**Carnet et Progrès disent maintenant à quoi ils servent** (14/10/2026, « on
comprend pas forcément la différence »). Elle existait — retrouver d'un côté,
additionner de l'autre — mais rien ne l'écrivait, et les deux onglets
affichaient le même sélecteur SEMAINE / MOIS sans dire ce qu'il commandait.
Chacun porte désormais son titre et une phrase : *Carnet — ce que tu as fait*,
*Progrès — ce que ça donne*. Et le sélecteur est nommé : **AFFICHER** dans le
carnet (ce qu'on regarde), **ADDITIONNER SUR** dans Progrès (ce qu'on totalise).
Aucun des deux n'a été supprimé : ils répondent à deux questions différentes, il
manquait seulement de les poser.
- **APPRENDRE** : les pages et les outils.

**Le carnet se regarde par jour, par semaine ou par mois** (21/09/2026, demande :
« faut que y ait juste jour semaine mois »). `JOUR`, `SEMAINE` et `MOIS` commandent
le calendrier **et** la liste en dessous : elle montre la période affichée, ni
plus ni moins, de la plus ancienne à la plus récente. `SEMAINE` dessine une rangée
de sept, une pastille à la couleur du groupe dominant ; `MOIS` déplie la grille,
pastille pleine pour une séance faite, en contour pour une prévue ; `JOUR` ne
dessine rien — le bandeau dit la date et la séance se lit en entier dans la liste,
ce qu'une case ne ferait pas mieux. Les flèches avancent d'un jour, d'une semaine
ou d'un mois ; `AUJOURD'HUI` passe en orange dès qu'on s'est éloigné. En `JOUR`,
`CRÉER MA SÉANCE` vise le jour affiché. Toucher un jour ou une séance ouvre sa
fiche, et `‹ RETOUR` ramène au carnet ; un jour vide s'ouvre dans SÉANCE, où
`AUJOURD'HUI ›` ramène à aujourd'hui.

Les filtres `TOUTES` / `PRÉVUES` / `FAITES` ont sauté avec les trois vues : la
carte porte déjà son badge `PRÉVUE`, le filtre ne disait rien de plus, et la
période fait le tri.

**Chercher un exercice.** En haut du carnet, une barre : on tape un nom, on tombe
sur son historique de perf — la même fiche que depuis le RÉCAP (signal, top set,
1RM estimé, records par fourchette de reps, courbe, séance par séance). Seuls les
exercices **réellement notés** sont proposés : un mouvement jamais fait n'a pas
d'historique à lire, le proposer serait une impasse. Les alias sont résolus, donc
« dead » et « soulevé de terre » ne font qu'une ligne. Chaque résultat dit son
nombre de séances et sa dernière fois. Tant que rien n'est tapé, rien ne s'ouvre :
une liste ouverte en permanence pousserait le calendrier hors de l'écran pour ne
rien dire.

**Une série, une ligne.** `SÉRIE · 8 SEPT. · KG · REPS · RPE · ✓`, la grille de
Strong ou Hevy, reprise parce que c'est celle qu'on connaît. Avant, chaque série
prenait trois lignes — poids, puis type, puis RPE et repos — et un exercice de
cinq séries remplissait deux écrans. Le **numéro** porte le type : on le touche,
le menu natif s'ouvre, et `TOP`, `B.O.` ou `ÉCH.` prend sa place. La **colonne
de la dernière fois** porte la date de la séance d'avant — « PRÉC. » ne se
comprenait pas —, et montre la même série ce jour-là (la 3e en face de la 3e).
Elle se **lit**, elle ne recopie plus rien : elle recopiait d'un appui, dans une
case posée à 4 px de celle du poids, et un appui de travers notait une série
qu'on n'avait pas faite. La **date en tête de colonne** est un vrai bouton,
encadré, avec sa flèche : il ouvre la séance d'avant dans SÉANCE, et une
barre orange en bas de l'écran, `RETOUR À MA SÉANCE`, ramène au jour de départ,
sur l'exercice d'où l'on était parti. La barre suit un aller-retour, pas une
chaîne : depuis la séance d'avant, sa propre date mène plus loin, mais le retour
vise toujours le point de départ. Elle se cache dans les autres onglets et
disparaît quand on revient au jour de départ, par elle ou par le calendrier.
Pour un exercice sans historique, la colonne n'apparaît pas (`.sans-prec`).

`↺ DERNIÈRE FOIS`, à côté de `+ SÉRIE`, remplit les séries de ce jour-là. Il
**reste** tant qu'il y a quelque chose à reprendre, et ne part que quand il n'y
a plus rien (`resteAReprendre`). Il disparaissait dès la première ligne remplie,
alors qu'il n'écrase jamais une valeur déjà saisie : c'est justement à la
troisième série qu'on veut encore retrouver celles de la dernière fois. Les
chiffres de la colonne ont aussi perdu leur voile (`opacity:.8`) — seuls les
tirets des séries que la dernière fois ne comptait pas restent effacés.
Une série **faite** perd ses cadres, sa ligne se teinte de vert — on voit où on
en est sans lire les coches une à une, comme chez Hevy — et elle reste
modifiable d'un appui.

**La refonte « Salle noire » (septembre 2026).** Une passe visuelle, pas une
réécriture : mêmes écrans, mêmes données, même logique. Elle vit dans un seul
bloc, `<style id="refonte">`, posé après les styles d'origine — le retirer
rend l'ancienne interface. Fond quasi noir, trois niveaux de surface au lieu
des bordures crème, rayons de 10 à 26 px, une ombre douce et une seule lueur
orange pour l'action principale ; Bricolage Grotesque garde les titres et les
chiffres, le texte courant passe à la police du téléphone. Les onglets passent
en bas sur téléphone. Le bandeau d'un jour vide et l'écran d'accueil portent
deux images d'ambiance générées avec Higgsfield (Seedream 5 Lite), en WebP de
22 et 23 Ko ; la photo encodée dans la page disparaît, 86 Ko de moins à chaque
chargement. Les choix, les sources et ce qui a été écarté (Pinterest, Canva) :
[`docs/design/direction-refonte-2026-09.md`](../design/direction-refonte-2026-09.md).

**L'échelle typographique (15 novembre 2026).** Six tailles (11, 13, 15, 18,
24 et 40 px), trois graisses (400 pour le texte, 700 pour ce qui est fort, 800
pour les titres et les chiffres) et trois interlettrages, posés d'un bloc dans
la couche de refonte : chaque texte prend la marche la plus proche de sa
taille d'origine, qui en comptait 29 de 8 à 42 px. Mesuré à 375 px, l'écran de
séance passe de 14 tailles à 6 et plus aucun texte ne descend sous 11 px sur
les quatre onglets. Les champs de saisie gardent leurs 16 px (Safari zoome en
dessous, et le champ de recherche du carnet, qui était à 14, y passe aussi) ;
le nom de la séance et les chiffres du plein écran gardent leur taille fluide.
Le détail des marches et des exceptions : `DESIGN_SYSTEM.md`, section 3.

**La sobriété (15 novembre 2026).** Chaque relief ne garde qu'un rôle. La
lueur orange ne reste que sous les boutons qui engagent (ajouter, reprendre, le
bouton plein écran) et la verte sous TERMINER ; les boutons sont en aplat, les
dégradés restent aux teintes de groupe, au voile du hero et au halo de la page.
Le flou ne reste que sur la loupe des onglets, la barre iOS, la topbar bureau
et les cartes plein écran. Les pointillés ne signalent plus qu'un emplacement
vide : ajouter une série devient un bouton plein teinté d'orange, les autres
(note, superset, partager, comme avant, suggestion, cycle) des boutons
fantômes. Les rayons passent par cinq jetons (6, 10, 14, 20 et 26 px, 38
valeurs éparses repliées), le numéro de série, le tag du hero et la case du
calendrier perdent leur bordure, et la trame de points derrière l'application
comme la texture béton du bloc volume (35 ko de base64) disparaissent.

**La mécanique (15 novembre 2026).** Plus de flash gris du navigateur au
toucher : chaque bouton s'assombrit tant qu'il est pressé (les onglets gardent
leur propre retour, la loupe), et un appui long n'ouvre plus la bulle de
sélection d'iOS. La feuille arrive au lieu d'apparaître : le voile en fondu, la
carte qui monte de 18 px ; le menu ⋯ de la carte se pose depuis le bas comme le
bilan. Tout s'arrête avec « réduire les animations ».

**Les exercices suivis (16 novembre 2026).** PROGRÈS n'affichait qu'une
longue liste de tous les exercices de la période. Sous le résumé, il a
maintenant deux pages, choisies par le même segment que la période : SUIVIS,
les exercices qu'on garde à l'œil, et TOUS, la liste complète par groupe.
Chaque ligne de TOUS et la tête de la fiche d'un exercice portent un signet ;
un exercice suivi devient une tuile (deux par rangée, teintée de son groupe)
avec sa meilleure série de la période, la courbe de son top set séance après
séance, une flèche contre la semaine, le mois ou l'année d'avant, et sa
fréquence. Suivi mais pas fait sur la période : la tuile reste, éteinte. Sans
rien de suivi, on arrive sur TOUS, où une ligne explique le signet. Les noms
suivis vivent dans les réglages locaux (`topset_reglages.suivis`, quarante
au plus, jamais synchronisés, jamais perdus s'ils sont inconnus).

**La loupe des onglets, les couleurs des groupes, les attentes (septembre
2026).** Sous l'onglet actif, une pièce de verre (`#ongletLoupe`, placée par
`placerLoupe()` à chaque `montrerVue`) : un reflet en haut, un liseré clair à
peine visible. Quand on change d'onglet, elle glisse, s'étire dans le sens du
mouvement et un seul reflet chaud fait le tour du liseré le temps du trajet
(0,46 s) ; le libellé reste au-dessus, net. Elle se fait aussi **glisser du
doigt** : passé 8 px de déplacement horizontal, elle se soulève et suit le
doigt, l'onglet survolé s'allume, et le plus proche s'ouvre au lâcher ; un
simple appui reste un clic (Pointer Events, `touch-action:none` sur la barre
du bas). **Chaque onglet garde sa position de défilement** (18/09/2026) :
SÉANCE, CARNET, PROGRÈS et APPRENDRE retrouvent la hauteur où on les avait
quittés, y compris SÉANCE au retour d'une fiche (`montrerVue`, en mémoire
seulement : à l'ouverture, chaque onglet part du haut). Le balayage de toute
la page pour changer d'onglet a été écarté : il changerait d'onglet par erreur
pendant la saisie et entrerait en conflit avec la carte de chaleur, qui défile
horizontalement. **Sur téléphone, la barre du bas reprend celle d'iOS 26** : une
capsule grise qui flotte, une pastille grise sous l'onglet actif, des libellés
en minuscules ; au toucher, pendant un glisser ou un changement d'onglet, la
pastille devient une bulle de verre qui grossit ce qu'elle couvre, avec des
franges de prisme (cyan, jaune, magenta) près du bord. Safari ne sait pas
déformer ce qui est derrière un élément : la bulle porte sa propre copie des
onglets (construite par `app.js`), agrandie, plus trois copies colorées
légèrement plus petites ou plus grandes, visibles seulement près du bord ;
`suivreBulle()` les recale image par image sur la position réellement
dessinée pendant le trajet. L'ordinateur garde la barre du haut. C'est la seule pièce de verre assumée de
l'app ; elle saute sans animation si l'appareil en demande moins. Les
**groupes musculaires** ne reprennent plus aucune couleur de sens — l'orange
(marque, action), le jaune (record), le vert (réussite), le bleu (information) :
Pectoraux `#ff7aa2`, Dos `#22b8a8`, Épaules `#a99bff`, Bras `#d45fc4`, Jambes
`#b3d236`, Abdos `#c99a6b`, Cardio `#6fd6f5`, Autre `#8f887d`.
`node scripts/palette-groupes.mjs` vérifie l'écart avec les couleurs de sens,
l'écart entre groupes pour les trois daltonismes courants et le contraste ; une
garde refuse qu'un groupe reprenne une couleur de sens. Les **attentes** parlent
une seule langue, la barre qu'on charge : après « OUI, C'EST PLIÉ » (3,2 s) et
désormais aussi « REVOIR LE BILAN » (version rapide, 2 s), un disque par
exercice à la couleur de son groupe, les colliers orange claquent, la barre
décolle, les disques suivent avec un temps de retard et l'ombre au sol se
resserre ; un appui passe au bilan. Le loader du compte joue la même scène en
boucle, avec des disques neutres. Les attentes courtes (listes, graphique, fil
de messages, admin) montrent la barre en petit (`attente()`) au lieu d'un
« Chargement… » seul. Les règles et ce qui reste à décider :
[`DESIGN_SYSTEM.md`](../design/DESIGN_SYSTEM.md).

**Des cibles de 44 px.** Mesurés sur un écran de 375 px, huit boutons de la
carte faisaient moins que les 44 points recommandés par Apple : le menu `⋯`
(40), la recopie de la suggestion (36), les pas `−` `+`, le repos, le
commentaire et la corbeille (40), le superset (40), et le nom de l'exercice
(22 px de haut). Tous font 44 px ; le nom, 40.

**La série ouverte.** Une seule par exercice, encadrée en orange : par défaut la
première pas encore faite. Dessous, ses outils — `−` `+` (2,5 kg, ou 5 s au
temps), le repos, le commentaire, la corbeille. Cocher replie la série et ouvre la
suivante ; toucher un champ d'une autre série l'ouvre, sans rendu, pour garder le
clavier. Seuls un champ ou un menu ouvrent une série : un bouton qui prenait le
focus déplaçait la barre entre l'appui et le relâchement, et l'appui tombait à
côté. C'est un état d'écran, en mémoire, jamais enregistré.

**La carte.** Le groupe musculaire est une pastille dans l'en-tête (`PECS`,
`DOS`…), avec le menu natif posé dessus. **Depuis le 18/09, au muscle près**
quand c'est possible : Dos › dorsaux, trapèzes, lombaires ; Bras › biceps,
triceps, avant-bras ; Jambes › quadriceps, ischios, fessiers, mollets,
adducteurs, abducteurs (pectoraux, épaules et abdos restent entiers). Le
sous-groupe vient du nom (catalogue, puis mots-clés : « leg curl » avant
« curl », « rowing menton » reste aux épaules) et **l'emporte sur un groupe mal
rangé** : un curl noté en Épaules compte en Bras › Biceps. Le menu propose les
sous-groupes sous leur groupe, plus « sans précision » ; ce choix vaut pour ce
nom partout, historique compris (`topset_custom_exercises`, colonne
`exercices_perso.sous_groupe` côté compte). Classement tranché d'après l'anatomie
et l'EMG : trapèzes et lombaires au Dos, soulevé de terre roumain en Jambes ›
Ischios, hip thrust en Fessiers, curl marteau en Biceps, face pull et rowing
menton aux Épaules, pull-over aux Pectoraux. Le superset reste sous `+ SÉRIE` —
c'est une action de saisie, pas un réglage ; passer au temps et supprimer
l'exercice sont dans le menu `⋯`. La carte est un conteneur (`container-type: inline-size`) : sous 310 px
utiles — petit téléphone, superset sur un écran de 360 px — la colonne de la dernière fois
cède sa place aux chiffres du jour, et la ligne *Dernière fois* liste alors les
séries précédentes.

**Changer l'ordre des exercices** (8 octobre 2026). Sous les suggestions,
`⇅ CHANGER L'ORDRE DES EXERCICES` — à partir de deux exercices — ouvre une
liste courte : une ligne par exercice, son groupe en couleur, son nombre de
séries notées. On la glisse par la **poignée** (`⠿`), ou on monte et descend
avec les **flèches** ; chaque déplacement s'écrit tout de suite, il n'y a pas
d'ordre provisoire à valider. Reprendre une séance ne veut pas dire la refaire
dans le même ordre : la machine est prise, ou on n'a plus de jus pour commencer
par les jambes.

Un **superset** tient sur une seule ligne et se déplace d'un bloc — ses membres
doivent rester côte à côte dans `day.exercises`, sinon le bloc n'existe plus.
Le geste vit dans une feuille et pas sur la carte elle-même : les cartes sont
pleines de champs, et un glissement vertical dessus se confond avec le
défilement. Dans la liste, seule la poignée prend le doigt (`touch-action:none`)
— partout ailleurs, la feuille défile.

**Et depuis la carte elle-même** (22 octobre 2026). Le panneau `⇅` range toute
la séance ; quand la machine est prise, on pense à UN exercice, celui qu'on a
sous les yeux. Son menu `⋯` propose donc `▲ MONTER DANS LA SÉANCE` et
`▼ DESCENDRE DANS LA SÉANCE` — rien pour un exercice seul, rien pour monter le
premier ni descendre le dernier. Le déplacement passe par le même chemin que la
feuille (un superset se déplace d'un bloc), s'écrit tout de suite, et la vue
suit l'exercice au lieu de le laisser partir hors de l'écran.

**Un nom long reste lisible** (22 octobre 2026). L'en-tête est une ligne : le
nom, la pastille du groupe, deux boutons. « Développé incliné haltères prise
neutre » y était coupé en plein milieu. Le nom est maintenant **mesuré** —
`scrollWidth` contre `clientWidth`, jamais un nombre de lettres, qui ne dit rien
de la largeur réelle : s'il dépasse, il prend la ligne entière de l'en-tête et
la pastille passe dessous ; s'il dépasse encore, il se resserre à 13 px. La
mesure se fait toujours dans la disposition étroite, sinon la carte changerait
de forme à chaque rendu.

**L'app explique ce qu'elle affiche** (22 octobre 2026). Audit du marché du
22/10 : Strong et Hevy notent, comptent, et ne situent jamais rien — c'est le
reproche qui revient le plus dans les comparatifs. Top Set a des pages sourcées
depuis six semaines, et **aucun chiffre de l'app n'y menait**. Trois liens
discrets (`.lien-savoir`, 44 px de haut, à côté du chiffre et jamais en
décoration) :

- le **signal** d'un exercice (`STAGNATION`, `EN BAISSE`…) → `QUE FAIRE ?`,
  vers `/entrainement/stagnation` ou `/entrainement/surcharge-progressive`
  selon le signal ;
- la **charge suggérée** → `D'OÙ ÇA VIENT ?`, vers la surcharge progressive ;
- le **récap de la semaine** → `POURQUOI 10 ?`, vers le nombre de séries par
  muscle.

**Le récap situe les séries par groupe** (22 octobre 2026). « 6 séries épaules »
ne dit rien tout seul. Sous la silhouette, une ligne : *Repère : au moins
10 séries par groupe et par semaine. Sous ce repère : épaules 6, biceps 4.*
Trois garde-fous pour ne pas dire de bêtise : **seulement sur la semaine** (le
repère est hebdomadaire, le comparer à un mois serait faux), seulement à partir
du jeudi (un lundi soir, tout est sous le repère), et jamais sur une semaine
vide. Du texte gris, pas une alerte : ça situe, ça ne reproche rien.

**Le calculateur de disques** (22 octobre 2026). « 82,5 kg, c'est quoi de chaque
côté ? » La question se pose à chaque changement de charge, et c'est la
fonction standard de Strong comme de Hevy. `TS.chargerBarre()` vit dans
`intelligence.js`, donc testée, et la page
`/outils/calculateur-de-disques` l'utilise : les disques réellement disponibles se décochent, le pas de 2,5 kg
est expliqué, et quand la charge ne tombe pas juste l'écart est **dit** au lieu
d'être arrondi en silence. Le tableau des charges courantes se lit sans
JavaScript.

**Les disques dans la série ouverte** (14 novembre 2026). La question se pose
devant la barre, pas devant une page web. Dans les outils de la série ouverte,
un bouton en forme de disque fait apparaître une ligne sous la série :
`BARRE 20 · 25 + 5 + 1,25 par côté`. Elle suit le poids pendant qu'on le tape
et quand on touche `−` / `+`. Quand la charge ne se fait pas avec des disques
par paire, elle le dit : `25 + 2,5 + 1,25 par côté = 77,5 kg, il manque 0,5`.
Un appui sur la ligne change de barre (20, 15, 10, 25 kg) et l'app s'en
souvient pour cet exercice, sur ce téléphone. **Sur demande seulement**, et
mémorisé par exercice le temps de la séance : pour des haltères ou une machine
la question n'a pas de sens, et une ligne qui dirait « sous le poids de la
barre » sur chaque série serait du bruit. Le calcul est celui de
`TS.chargerBarre()`, le même que la page : les deux ne peuvent pas répondre
deux choses différentes. Pas de ligne sur un exercice au temps ni en cardio.

**L'onglet APPRENDRE mène à des pages** (22 octobre 2026). Six rubriques,
c'étaient six portes et aucune réponse : sous la grille, les huit pages qu'on
cherche vraiment en salle, en lien direct.

**Les horaires de la séance** (22 octobre 2026). Une étiquette de plus dans le
bandeau, à côté de `3 EXOS` et du volume : `19H05 → 20H32 · 1H27`. Personne ne
la remplit. La **première série remplie** ouvre la séance, la dernière la
ferme ; une séance validée garde l'heure de sa validation comme fin. Trois
garde-fous : seulement la journée du jour (remplir une séance d'il y a trois
semaines ne doit pas lui coller l'heure de ce soir), seulement à partir d'une
série remplie (poser des noms d'exercices à 14 h n'ouvre pas la séance), et
**l'heure de début ne se réécrit jamais**. On touche l'étiquette pour corriger
les deux heures ; une heure tapée à la main n'est pas remplacée par la
sauvegarde qui suit (`persistDay(ds, true)`). La durée ne s'affiche que si elle
veut dire quelque chose : jamais à l'envers, jamais au-delà de huit heures.
Côté compte : colonnes `seances.debut` et `seances.fin`, fonction
`pousser_horaires`, sa propre file d'envoi.

**Le cycle d'entraînement** (10 octobre 2026, demandé par Kamil). « Lundi,
pendant deux semaines, cycle force ; après, endurance. » Sous la date, une
pastille dit le cycle en cours et l'ouvre : `FORCE`, `HYPERTROPHIE`,
`ENDURANCE`, ou ce qu'on écrit soi-même (24 caractères).

Ce que ça change, et c'est tout l'intérêt : **« la dernière fois » cherche
d'abord dans le même cycle.** 60 kg × 12 n'est pas une baisse par rapport à
90 kg × 3, et pourtant la colonne PRÉC. mettait les deux face à face : un jour
d'hypertrophie se lisait comme un effondrement. L'en-tête porte maintenant le
cycle d'où viennent les chiffres, et quand il n'y a rien de comparable elle le
dit en orange — `DERNIÈRE FOIS · 26 SEPT. · AUTRE CYCLE : FORCE`. La charge
suggérée se calcule sur le même périmètre, pour la même raison. Le bilan de
fin de séance compare lui aussi à l'intérieur du cycle, et nomme celui qu'il a
pris.

Un cycle est une **déclaration posée sur un jour**, qui tient jusqu'à la
suivante : on le dit une fois, les séances d'après en héritent sans rien
demander. Pas d'objet « bloc » avec un début, une fin et une date à tenir à
jour, pas de cycle recopié sur chaque séance : la base ne porte que les jours
où il a changé d'avis. La feuille propose les siens d'abord, le plus récent en
haut, et ne propose de retirer que ce qui a été déclaré ce jour-là — retirer un
cycle hérité ne voudrait rien dire.

**Le nom d'une séance remonte sur l'écran où l'on s'entraîne** (10 octobre
2026). Il existait depuis longtemps, mais ne se changeait que depuis la fiche
d'une séance dans CARNET : personne ne l'avait jamais trouvé. Il est maintenant
sous la date, avec le `✎`, et le champ vide affiche le nom calculé en
filigrane. Le même `definirTitre` qu'avant — un seul chemin pour nommer, donc
`foisFaite` et le bilan continuent de s'y retrouver.

**Un mot sur la séance entière** (10 octobre 2026). Il y avait le commentaire
d'une série et celui d'un exercice ; il manquait celui du jour — « mal dormi »,
« première depuis la coupure » n'appartiennent à aucune série. Sous la liste,
`＋ UN MOT SUR LA SÉANCE` ouvre un champ de 500 caractères, la même borne que
les autres commentaires, tenue aussi par la table. Le bouton ne s'affiche pas
sur un jour vide.

**Le récap d'une séance montre TOUS ses exercices** (22 octobre 2026). Il ne
listait que ceux qui portaient des chiffres : on relisait une séance de six
exercices et on n'en voyait que quatre — « faut que je clique dessus et je vois
l'exo, mais sinon je vois pas ». Un exercice posé sans valeur notée existe bien
dans le carnet ; il s'affiche maintenant avec `RIEN DE NOTÉ` en pointillés, et
la séance se relit en entier. Les **chiffres**, eux, ne comptent que ce qui a
été fait : `2 EXOS` quand deux des trois sont remplis, et une séance seulement
prévue n'affiche pas quatre cases à zéro mais la phrase qui dit dans quel état
elle est.

**Les séries d'échauffement d'un appui** (14 novembre 2026). Strong le fait
depuis toujours : dans le menu `⋯` de l'exercice, `△ ÉCHAUFFEMENT POUR 100 KG`
pose la montée classique devant la première série de travail — la barre vide
× 8, puis 50 % × 5, 70 % × 3 et 85 % × 2 —, chaque série typée **échauffement**
(donc hors records et hors top set), la première ouverte. La charge vient de la
première série de travail chiffrée aujourd'hui, sinon de la cible suggérée,
sinon du top set de la dernière fois ; quand on ne sait rien, le menu ne propose
rien plutôt que d'échauffer une charge inventée. Le calcul est
`TS.seriesEchauffement(charge, barre, pas)` dans `intelligence.js` : les poids
tombent sur le pas de 2,5 kg **en dessous**, jamais au-dessus (86 kg avant 100
n'est plus un échauffement) ; une marche qui ne dépasse pas la barre est déjà
faite par la barre vide, une marche qui atteint la charge n'en est plus une,
deux marches au même poids n'en font qu'une, et sous le poids de la barre (des
haltères) il n'y a pas de barre vide. La barre est celle choisie pour les
disques. Pas au temps, pas en cardio, pas deux fois sur le même exercice. Le
menu `⋯` se recalcule à l'ouverture et quand le nom change : ce qu'il propose
dépend des chiffres qu'on vient de taper.

**La charge suggérée sans RPE : la double progression** (14 novembre 2026).
Sans RPE, `TS.suggererCible()` ne parlait que si la tendance montait déjà — et
la colonne RPE est rangée par défaut, donc presque personne ne voyait de
suggestion. Désormais, sans RPE : sous 6 reps, le pas classique (mêmes reps, un
cran de plus) ; à partir de 6 reps, la double progression — même charge et une
rep de plus jusqu'au haut de la fourchette (8–12 en hypertrophie, 15–20 en
endurance), puis un cran de plus et retour au bas. La fourchette suit le cycle
déclaré quand il y en a un, sinon celle où tombe le top set. Un top set qui
baisse depuis trois séances n'a pas de suggestion : c'est le signal de
l'exercice qui parle. La suggestion porte sa méthode (`lineaire` / `double`) et
sa raison, et le bloc `SUGGÉRÉ` de la carte l'affiche comme avant. Le bloc « la
prochaine fois » dans le bilan de fin de séance et la fiche reste à faire.

**La prochaine fois, dans le bilan** (16 novembre 2026). Le bilan de fin de
séance se termine par un bloc « LA PROCHAINE FOIS · SUGGÉRÉ » : une ligne par
exercice, avec la cible de la séance suivante (« Squat · +2,5 kg, mêmes reps ·
105 kg × 5 »). C'est la même règle que la cible SUGGÉRÉ de la carte, appliquée
à l'historique qui finit ce jour-là et dans le même cycle : la carte de la
prochaine séance proposera la même chose. Le bloc garde le registre orange de la
cible. La carte passe désormais le cycle déclaré à la règle, comme la double
progression le prévoyait : 8 à 12 reps en hypertrophie, un cran à reps égales
en force.

**La silhouette d'une séance** (16 novembre 2026). Le schéma de face et de
dos de PROGRÈS montre aussi une seule séance : dans sa fiche, sous les quatre
tuiles, et dans le bilan de fin de séance, sous les tuiles séries, exos,
records. Mêmes zones, mêmes couleurs de groupe, même légende (un groupe par
ligne avec son nombre de séries, les muscles dessous). La légende est une seule
fonction pour le récap, la fiche et le bilan. Pas de silhouette pendant la
séance elle-même : l'écran de saisie reste réservé aux séries.

**La régularité, comptée en semaines** (16 novembre 2026). Un objectif de
séances par semaine (de 1 à 7, 3 par défaut) se règle dans RÉGLAGES ET PROFIL.
Une semaine est « tenue » quand elle l'atteint. PROGRÈS montre le compte de la
semaine, le nombre de semaines tenues d'affilée et huit colonnes pour les huit
dernières semaines (une pastille par séance visée, vertes quand la semaine est
tenue). La semaine en cours ne casse jamais la série avant d'être finie, et rien
ne se compte en jours : un jour de repos fait partie de l'entraînement. Une
séance, c'est un jour où au moins une série est notée. Le bilan dit où en est
la semaine (« 3e séance de la semaine · objectif tenu · 5 semaines
d'affilée »). La règle est `TS.regularite` dans `intelligence.js` ; l'objectif
reste dans les réglages locaux (`topset_reglages.objectifSemaine`).

**Copier pour une IA** (16 novembre 2026). Sous la fiche d'une séance et sous
PROGRÈS, « COPIER POUR UNE IA » ouvre une feuille qui montre le texte avant
toute copie : la question à poser d'abord (« Dis-moi ce qui progresse, ce qui
stagne… »), puis les chiffres, puis les unités. Une séance donne chaque
exercice avec son groupe, chaque série (type et RPE quand ils sont notés,
commentaires) et la fois d'avant. Une semaine ou un mois donne les totaux, la
régularité, les séries par groupe, la meilleure série de chaque exercice avec
son premier et son dernier top set, puis le détail séance par séance ; l'année
s'arrête au résumé par exercice. « COPIER LE TEXTE » passe par le
presse-papiers et, à défaut, sélectionne le texte ; « ENVOYER… » ouvre le
partage du téléphone quand il existe. Rien ne part de l'app : on colle
soi-même.

**L'année, écran par écran** (16 novembre 2026). Dans PROGRÈS, sur la période
ANNÉE (et sur toutes les périodes en décembre et en janvier), « Ton année »
s'ouvre en plein écran, un chiffre par écran à la façon d'une story : les
séances notées, les semaines tenues sur l'année et la plus longue série, le
groupe de l'année avec la silhouette de l'année, l'exercice de l'année, la plus
belle progression (premier contre dernier top set, sur le 1RM estimé), les
records battus et la charge la plus lourde, le mois le plus chargé, puis
« COPIER POUR UNE IA » avec le texte de l'année. On touche à droite pour
avancer, à gauche pour revenir ; flèches et Échap au clavier. Chaque écran prend
la couleur de son rôle. Pas de tonnage, pas de verre, pas de braise. En janvier,
c'est l'année qui vient de finir. Deux règles nouvelles dans `intelligence.js` :
`progressionTopSet` et `recordsBattus` (une séance qui bat tout ce qui a été
soulevé avant elle sur cet exercice, échauffements exclus ; la toute première
fois n'est pas un record).

**Comment le faire** (16 novembre 2026). Quand un exercice a sa page dans
Apprendre (le développé couché, la planche et ses variantes pour l'instant), le
menu ⋯ de sa carte commence par « ↗ COMMENT LE FAIRE », et sa fiche montre
« COMMENT LE FAIRE ? » sous son nom. Les abréviations de salle suivent
(« bench », « dc »). La correspondance vit dans `PAGES_EXERCICE`, dans `app.js` :
une page ajoutée à `exercices/` doit y être ajoutée aussi, et un gabarit le
vérifie.

**Un seul jeu d'icônes** (16 novembre 2026). Les glyphes texte qui servaient
d'icônes (⇄ ↺ ✎ ⋯ △ ▲ ▼ ✕ ↗ ⇅ ⟳ ＋ ◷ ▶ ❚❚ ✓ × ‹ ›) changeaient de forme, de
graisse et d'alignement d'un téléphone à l'autre. Ils sont remplacés par un
seul jeu SVG, tracé comme les icônes des onglets (24 × 24, trait de 1,9, bouts
ronds, couleur du texte) : le menu de la carte (flamme pour l'échauffement,
chevrons pour monter et descendre, flèches croisées pour « c'est le même
exercice », corbeille), le bouton ⋯, DERNIÈRE FOIS, le superset (un maillon),
la coche de la série, le temps et le cardio (une horloge), partager, renommer,
l'ordre, fermer, revenir, rafraîchir, la lecture et la pause du chrono. Le jeu
vit dans `ico()` (`app.js`) ; le HTML statique en porte des copies exactes,
vérifiées par un gabarit. Les signes typographiques restent du texte : le ×
de « 80 kg × 10 », la flèche des horaires, ▲ ▼ devant un pourcentage, le ›
des liens.

**Une couleur par état** (16 novembre 2026). L'erreur a sa couleur,
`--erreur` (#ff4d6d), au lieu de l'orange de l'action : messages d'erreur,
« supprimer » de la carte, boutons destructifs des feuilles. Elle est à 16 de
l'orange en vision normale ; en tritanopie les deux se confondent, donc une
erreur porte toujours une phrase, et une suppression sa corbeille. L'alerte
devient neutre (filet clair, texte blanc cassé) : le jaune ne dit plus que le
record, et le top set de la dernière fois, dans la colonne PRÉC., se lit à la
graisse. Le record se voit en séance : une pastille jaune pleine, étoile
sombre, qui surgit au coin de la coche, à la place d'une étoile au trait de
15 px.

**Duplication de série.** `+ SÉRIE` recopie la précédente : poids, reps, RPE,
repos. Seul `fait` repart à zéro, et le commentaire ne se recopie pas. Sur cinq
séries identiques, tu en saisis une et tu appuies quatre fois. La ligne s'ajoute
à la carte sans refaire l'écran, et sans ouvrir le clavier : elle est déjà
remplie, et `−` `+` corrigent le poids. Refaire tout le panneau supprimait le
champ où l'on venait de taper — sur iPhone, un appui sur un bouton ne quitte pas
ce champ — et Safari renvoyait la page tout en haut. Quand l'écran doit encore
être refait (`renderDayPanel`, `repeindreCarte`), l'app quitte d'abord le champ
et remet la page où elle était.

**Au temps : gainage, planche, chaise.** Un exercice tenu se mesure en secondes.
Taper « Planche » ou « Gainage » bascule la série en durée pendant la frappe —
`−5` et `+5` y remplacent les pas de 2,5 kg — et le menu `⋯` bascule n'importe
quel autre exercice. Dans la colonne `DIFF.`, la *difficulté* ressentie de 1 à 10 remplace
les reps en réserve, qui n'ont pas de sens pour une planche. Le record est la
série la plus longue, la fiche de l'exercice trace le meilleur temps séance après
séance, le récap l'affiche en minutes.

La durée vit **dans le champ des reps, écrite avec son unité** : `45 s`. Le champ
est déjà du texte libre, donc la base, la synchro, la sauvegarde et le tableur la
transportent sans qu'aucun format change, et `45 s` se lit tel quel partout. La
difficulté occupe le champ du RPE — c'est ce que le sigle veut dire au départ.
L'unité est obligatoire : `45` tout court reste 45 répétitions. Deviner
réinterpréterait des séances déjà notées, et ce n'est pas à l'app de décider
après coup qu'une série de pompes était un gainage. Une durée ne compte ni dans le
volume, ni dans le 1RM estimé, ni dans les records par reps.

**Le chrono du gainage.** Sur un exercice au temps, `▶ CHRONO` à côté de
`+ SÉRIE` lance le temps ; un appui de plus met en pause, et la durée tenue
remplit la première série encore vide (un lest déjà noté reste), qui est cochée.
Le chrono repart de zéro au prochain appui : une pause, une série. L'heure de
départ est gardée dans `localStorage` (`topset_chrono`) — une app que l'iPhone a
fermée pendant la planche retrouve son chrono — et l'écran reste allumé tant
qu'il tourne (Wake Lock, quand le navigateur le permet). Un seul chrono à la fois :
en lancer un autre note d'abord celui qui tournait.

**Le repos entre les séries.** Cocher une série, ou mettre le chrono en pause,
lance le repos : il monte depuis zéro dans une pastille en bas à gauche, en face
de « revenir en haut ». Cocher la série suivante, relancer le chrono ou toucher
la pastille l'arrête et écrit sa durée dans le REPOS de la série qui l'a lancé.
Moins de 10 s (des séries cochées après coup) ou plus de 20 min (un repos
oublié) : rien n'est écrit ; décocher cette série l'annule, valider la séance
l'abandonne. Seulement sur la séance du jour, gardé dans `localStorage`
(`topset_repos`) comme le chrono, écran allumé.

**La pastille ne se cache plus derrière le clavier** (14/10/2026, « des fois je
valide une série et ça me met pas le chrono »). Le chrono partait bien : c'est
la pastille qui était masquée tant que le clavier était ouvert — et on coche sa
série clavier ouvert, le champ des reps a encore le focus. Elle reste maintenant
à l'écran et se pose **juste au-dessus du clavier** (`--clavier-h`, mesurée sur
le `visualViewport`), à sa place de départ même si elle avait été déplacée : un
point fixe pendant la saisie vaut mieux qu'un point qui passe dessous. Et une
pastille déplacée tout en bas ne peut plus finir **derrière la barre
d'onglets** : la limite basse se mesure sur la barre au lieu d'être une marge
de 8 px.

**Le repos se déplace** (18/09/2026). La pastille se déplace du doigt (8 px
avant de parler de glisser : un appui qui tremble reste un appui) et garde sa
place (`topset_repos_pos`, en fraction de l'écran). Un appui ouvre l'exercice
en plein écran, sur le repos.

**Retomber sur son exercice** (20/09/2026). La date en tête de la colonne
`PRÉC.` ouvre la séance d'avant **centrée sur le même exercice** (retrouvé par
son nom : d'un jour à l'autre, un exercice ne garde pas son identifiant), et la
barre de retour ramène à celui d'où l'on vient. Fermer un plein écran rend sa
place à la page au lieu de la remonter en haut. Sans exercice à viser, ou s'il a
disparu, c'est le haut de la page, comme avant.

**L'exercice en plein écran** (19/09/2026, simplifié le 20/09). L'icône orange
⤢ de chaque carte (sauf le cardio) ouvre l'exercice en grand, sur la **seule
série à faire** : la première pas encore cochée. Les séries faites restent
rappelées en petit, et la même série la dernière fois à côté. Gros −/+ de part
et d'autre du chiffre (2,5 kg, 1 rep, 5 s au temps).
- `SÉRIE SUIVANTE` coche la série exactement comme sa ligne : le repos d'avant
  est noté, le sien commence, et l'écran passe au **repos** : le temps qui monte
  dans un anneau qui se remplit jusqu'au repos visé (celui de l'exercice, sinon
  90 s) puis passe au vert, la série notée, et la suivante déjà remplie et
  modifiable. `PASSER À LA SÉRIE SUIVANTE` y revient ; `Terminer l'exo` passe au
  suivant.
- **Superset** : les exercices du bloc ensemble, A puis B ; on enchaîne sans
  repos à l'écran, et le repos vient après le dernier du tour.
- `Exo suivant →` et les points en haut : un superset compte pour un exercice.
- **✕** (ou Échap) ferme sans rien valider : les réglages sont déjà dans la
  série, qui reste en cours ; si un repos tourne, la pastille reprend. On
  retombe sur la carte de l'exercice, pas en haut de la page.
- **Supprimer une série** se fait sur sa carte, où la poubelle est.
La **molette** et le **swipe** (glisser à droite pour valider, à gauche pour
supprimer) ont sauté le 20/09/2026 : deux gestes à deviner pour ce que deux
boutons font déjà, et une suppression à portée de pouce pendant une série.
Le fond est la braise (voir plus bas) : douce pendant la série, forte pendant le
repos. Toutes les écritures passent par `scheduleSave`, comme la carte : hors
ligne et sans compte, rien ne change.

**Le chrono libre** (20/09/2026). Le bouton ⏱ de l'en-tête ouvre un chrono qui
n'appartient à aucun exercice : il ne note rien, il compte. Deux modes —
**minuteur** (1:00, 1:30, 2:00, 3:00, et ± 15 s ; l'anneau se vide, puis passe
au vert) et **chronomètre** qui monte. `DÉMARRER` / `PAUSE` / `REMETTRE À ZÉRO`,
et rien d'autre. Comme le repos et le chrono de gainage, il garde une **heure de
départ** (`topset_chrono_libre`) et non un compteur : fermer l'écran, verrouiller
le téléphone ou quitter l'app ne l'arrête pas. Le fond est la braise.

**Les réglages** (20/09/2026, « l'interface devient fouilli »). Le bouton profil
de l'en-tête ouvre `RÉGLAGES ET PROFIL`, réglages d'abord :
- **Couleurs des groupes** : douze teintes en roue (15/11/2026), les sept
  d'origine et cinq de plus — brique, sable, sauge, acier, orchidée. Le
  nuancier d'un groupe se déplie sous son nom, un seul à la fois ; une couleur
  choisie avant la roue reste proposée comme « actuelle ». La couleur choisie
  suit le groupe **partout** — carte, planning, récap, silhouette, bandeau,
  plein écran. Un bouton remet celles d'origine.
- **Chrono de repos automatique** : la pastille qui part toute seule quand on
  coche une série.
- **Bouton CHRONO sur tous les exercices** : sinon il ne sort que pour le
  gainage.
- **Champ REPOS sur chaque série**, **colonne RPE** : rangés par défaut depuis
  le 20/09. Ranger une colonne n'efface rien — la valeur reste dans la série,
  part dans les exports, et revient si on rallume la colonne. Le RPE nourrit la
  charge suggérée : éteint, la suggestion s'appuie sur la seule tendance des
  charges.
- **Boutons − / + sous le poids** (16/11/2026, « ça prend bcp de place pour
  rien »). Allumés par défaut. Éteints, la série ouverte n'a plus ses boutons
  −2,5 / +2,5 kg ; l'exercice en grand garde toujours les siens, et les séries
  au temps ou en cardio gardent leurs −5 / +5 et −1′ / +1′.
- **Garder l'écran allumé** pendant un chrono ou un repos.
- **Je nomme mes exercices moi-même** (14/10/2026, « faut une option en mode
  jmet le nom de mon exo »). Allumée, l'app ne demande plus rien quand on tape
  un nom : ni abréviation, ni faute de frappe, ni ressemblance. Le menu `⋯` de
  l'exercice sait toujours relier deux noms à la demande.
Les réglages vivent dans ce téléphone (`topset_reglages`) : ce sont des états
d'écran, pas des données du carnet, et ils ne montent pas dans le compte.

**Le cardio : minutes, vitesse, inclinaison.** Tapis, course, marche, vélo,
rameur… s'ouvrent en cardio : une série est une durée **en minutes** (`25`,
`12,5`), plus la vitesse (km/h) et l'inclinaison (%) moyennes, toutes deux
facultatives ; `−1′` et `+1′` remplacent les pas. La durée vit dans le champ des
reps comme pour une planche, donc records, courbe et récap la lisent déjà. La
vitesse et l'inclinaison sont deux nouveaux champs de série, absents quand ils
sont vides, bornés (0–99,9 km/h, −30–99,9 %) et arrondis à un chiffre ; en base,
les colonnes `series.vitesse` et `series.inclinaison`, dont `pousser_jour` écarte
une valeur illisible ou hors bornes plutôt que de refuser la journée. Tant que
`schema.sql` n'a pas été relancé, une base qui ne rend pas ces clés ne les efface
pas du téléphone (`jourDistant`, comme pour les commentaires). Le tableur gagne
deux colonnes à droite, `Vitesse (km/h)` et `Inclinaison (%)` ; un ancien tableur
se réimporte tel quel. Un tapis déjà noté en répétitions le reste : l'historique
passe avant le nom.

**Refaire la dernière fois.** Trois gestes, jamais depuis la colonne de la
dernière fois, qui se lit et ne recopie rien :
- `↺ DERNIÈRE FOIS`, à côté de `+ SÉRIE`, tant qu'aucune série n'est remplie :
  les séries de la dernière séance sur cet exercice, la 3e en face de la 3e
  (poids, reps, type, repos, vitesse et inclinaison). Rien n'est coché, le RPE
  reste à dire, une série déjà remplie n'est pas touchée (`repriseSerie`).
- `+ AJOUTER À MA SÉANCE DU JOUR`, sous chaque exercice d'une séance passée et
  faite — dans sa fiche, ou dans SÉANCE quand on l'ouvre par la date de la
  dernière fois : l'exercice arrive dans la séance d'aujourd'hui avec ses séries,
  RPE compris, rien de coché. Le même exercice déjà posé et encore vide reçoit
  les séries au lieu d'un doublon (`ajouterAuJour`). « Faite » : validée, ou
  passée avec des séries — sans quoi aucun carnet d'avant la validation n'en
  profiterait (`seanceFaite`).
- Sur un jour vide, `↺ REFAIRE CELLE DE LUNDI DERNIER` (le même jour, la
  semaine d'avant) et `↺ REFAIRE MA DERNIÈRE SÉANCE` si ce n'est pas la même,
  avec leur titre ; tout se recopie par `selectionnerSeance`.

**La charge selon le matériel (16/11/2026).** La ligne des disques de la série
ouverte garde sa place, mais parle selon le matériel de l'exercice : les disques
par côté pour une barre, `2 haltères de 10 kg` aux haltères, `2,5 kg de chaque
côté` au vis-à-vis, le poids de la pile pour une poulie ou une machine à pile,
les disques par côté sans barre pour une machine à disques (presse, hack squat),
et les disques à la ceinture pour des dips ou des tractions lestés. Le bouton
prend l'icône d'un disque, d'un haltère ou d'une poulie. Le matériel se devine au
nom (`TS.outilParDefaut`) ; un nom inconnu reste une barre de 20 kg, comme avant.
Un appui sur la ligne la remplace, au même endroit, par le choix du matériel, en
deux temps : le matériel, puis sa variante — le poids de la barre, ou ce que veut
dire le poids noté (les deux haltères ou un seul). Le choix vaut pour toutes les
séances de l'exercice, sur ce téléphone ; une barre choisie avant reste la sienne.

**L'image d'une séance (16/11/2026).** `PARTAGER EN IMAGE`, en bas de la fiche
d'une séance et après `FERMER` dans le bilan (aucun bouton ne change de place),
dessine sur le téléphone une story de 1080 × 1920 : la date et le titre en
haut, la silhouette des muscles au centre, jusqu'à cinq exercices avec leur
meilleure série (les records en jaune, avec une étoile), puis séries,
exercices, durée — ou records quand les horaires manquent —, le logo et
top-set.fr. Tout tient entre 200 et 1 720 px de haut, hors de ce qu'Instagram
recouvre ; la silhouette rapetisse quand un long titre ou six exercices
demandent la place. Le panneau montre l'image avant de la partager. Le fichier
est prêt dès l'ouverture du panneau : sur iPhone, un partage lancé après une
attente est refusé. Sans partage de fichiers (un ordinateur), le bouton
enregistre l'image. Rien ne passe par un serveur.

**Le poids du corps (16/11/2026).** Une pesée par jour : une date, un poids et,
si on veut, les tours de taille, de bras et de cuisse. PROGRÈS finit par elle,
après tout le reste : une seule ligne discrète (`+ NOTER MON POIDS DU
CORPS`) tant qu'il n'y a pas de pesée, puis une carte neutre — le dernier poids,
l'écart depuis la dernière pesée d'avant la période, et la courbe de la période.
Neutre parce qu'une variation de poids n'est ni un progrès ni un recul : on
peut vouloir en prendre. Le panneau corrige un jour depuis l'historique et
supprime en deux appuis. La fiche d'un exercice ajoute une ligne,
`1RM estimé : 1,25 × ton poids du corps`, quand une pesée date de moins de
90 jours de sa dernière séance (`TS.peseeProche`, `TS.forceRelative`) ; sans
pesée, elle ne change pas. Les pesées vivent sous `topset_pesees`, suivent le
compte (table `pesees`) sans qu'un coach ni l'équipe puissent les lire, et ne
partent ni dans un partage ni dans le texte pour une IA.

**Les modèles de séance (16/11/2026).** Le dernier bouton de la fiche d'une
séance, `ENREGISTRER COMME MODÈLE`, la garde sous un nom (« Push A ») et, si on
veut, dans un dossier. Le même nom remplace le modèle existant, ce que le
panneau dit avant d'enregistrer ; un dossier laissé vide garde le sien. Sur un
jour vide, les modèles s'alignent sous les boutons `REFAIRE` (`LANCER PUSH A`,
sans dossier d'abord, puis par dossier) ; sans modèle, l'écran ne change pas.
Un modèle garde l'ordre, les exercices et les supersets (avec un bloc neuf à
chaque lancement). En le lançant, chaque exercice reprend sa dernière fois,
comme `↺ DERNIÈRE FOIS` (même cycle d'abord), sinon les séries du modèle : un
modèle de septembre ne ramène pas les charges de septembre. Rien n'est coché,
et la séance prend le nom du modèle si elle n'en a pas (`lancerModele`).
`GÉRER` renomme, range et supprime ; supprimer se confirme d'un second appui.
Les modèles vivent sous `topset_modeles`, suivent le compte (table `modeles`),
changent de carnet avec leur propriétaire quand un autre compte se connecte, et
voyagent dans la sauvegarde JSON ; l'import n'ajoute que ceux qui manquent.

**Ce qui allait avec, la semaine d'avant.** Sous `+ AJOUTER UN EXERCICE`, dès
qu'un exercice du jour a un nom : les exercices de la même séance la semaine
d'avant (même reconnaissance que le bilan, un exercice en commun suffit) qui ne
sont pas encore dans celle du jour, quatre au plus. Un appui l'ajoute vide, avec
autant de séries que ce jour-là — la colonne de la dernière fois et
`↺ DERNIÈRE FOIS` font le reste. Rien sur une séance déjà faite
(`suggestionsExo`).

**Les outils sous le planning.** Le calculateur de 1RM, le tableau RPE et le
modèle de tableur : trois liens en bas du planning, en plus de l'onglet
Apprendre.

**RPE par série.** Échelle des répétitions en réserve, de 10 à 6 par demi-points :
10 c'est l'échec, 9 il t'en restait une, 8 il t'en restait deux. Facultatif —
laisse vide, rien ne casse. La cellule n'a la place que du chiffre : la phrase
(« RPE 8 — 2 reps en réserve ») passe un instant en bas de l'écran quand on
choisit, parce qu'une infobulle ne s'affiche pas sur un téléphone.

**Repos par série**, et non par exercice, repris automatiquement à la duplication.

**Un commentaire par série.** Pour ce que les chiffres ne disent pas :
« assistée », « avec bandes », « un peu fatigué ». `+ COMMENTAIRE`, à côté de
`+ SÉRIE`, l'ajoute à la dernière série faite — c'est juste après qu'on y
pense — et la bulle des outils à n'importe quelle autre. Il s'écrit sous la
série, comme du texte ; vidé, il disparaît. La fois suivante, il s'affiche sous
*Dernière fois* avec le numéro de sa série (« S3 : assistée ») ; on le relit
aussi dans la fiche de la séance, l'historique de l'exercice et le carnet lu par
le coach. *Sélectionner pour le jour affiché* recopie les séries, pas les
commentaires. 500 caractères au plus, dans l'app comme en base. Le champ `note`
d'une série n'existe que s'il est rempli, et le tableur le porte en dernière
colonne, `Commentaire`, sur la ligne de sa série.

Le commentaire était d'abord **par exercice** : trop vague pour dire laquelle
avait été assistée. `normalizeExercise()` range un ancien commentaire d'exercice
sur sa dernière série (après le sien, s'il y en avait un), là où « assisté sur
la dernière » voulait dire quelque chose ; rien ne se perd. Un exercice sans
série garde le sien, faute d'endroit où le poser.

**Le bandeau du jour prend une photo** selon le groupe musculaire dominant de
la séance : un banc de développé couché pour les pectoraux, une cage à squat
chargée pour les jambes, une barre de traction et une poulie haute pour le dos,
un rack d'haltères pour les épaules, une barre EZ pour les bras, une roue et un
tapis pour les abdos, une rangée de tapis de course pour le cardio. Sept salles
vides, de nuit, une seule lumière rasante, personne dedans — générées le
14/10/2026 (Higgsfield, Z Image, 0,15 crédit pièce, 1,05 au total), déjà en gris
et de 7 à 19 Ko chacune, dans `img/hero/`. « Autre » et la séance vide gardent
la photo d'ambiance générique.

Avant, c'étaient sept petits dessins au trait, et ils **remplaçaient** la photo
(`.hero[data-illu] .hero-photo`) : dès qu'une série était notée, le bandeau
n'était plus qu'un rectangle noir avec un trait blanc dedans — d'autant que la
photo en question n'existait pas non plus. Les SVG ont été retirés : une seule
image par bandeau, pas un dessin posé par-dessus une photo du même objet. Elles
sont dans la coquille du service worker : hors ligne aussi.

**Le titrage de la séance, refondu** (14/10/2026, « trop bizarre, pas belle »).
Il y avait trois blocs empilés qui se marchaient dessus : un bandeau dont le
grand titre était le *groupe musculaire*, la date une seconde fois juste en
dessous, puis le nom de la séance dans un petit bouton — qui héritait du style
d'en-tête des cartes du carnet (classe `.seance-tete` partagée) et s'affichait
donc sur fond orange, en plein milieu. Un seul bloc maintenant : la date et le
cycle en haut, **le nom de la séance en grand**, le groupe et les chiffres en
bas. Trois défauts de fond réparés au passage :

- la photo du bandeau pointait sur `var(--img-plates)`, une variable qui n'a
  jamais existé — le fond était un rectangle noir ;
- le dessin du groupe **remplaçait** la photo au lieu de s'y superposer : dès
  qu'une série était notée, l'image disparaissait ;
- un lavis `mix-blend-mode: color` à 90 % effaçait le relief de ce qui restait.
  La teinte du groupe arrive maintenant par un côté, en dégradé.

La classe du bloc a été renommée `.seance-titrage` pour mettre fin à la
collision avec `.seance-tete`, qui est l'en-tête plein des cartes du carnet.

**La fin de séance.** En bas de la séance du jour, une fois quelque chose de noté,
`✓ TERMINER MA SÉANCE` pose la question — en signalant les séries notées mais
pas cochées, qui comptent quand même — puis affiche un **bilan**. D'abord
**la même séance la semaine d'avant**, reconnue à ses exercices (parmi les 14
jours précédents, celui qui en partage le plus, à égalité le plus proche de
7 jours, et au moins la moitié en commun) : combien d'exercices sont en hausse,
compté depuis 0, puis une ligne par exercice avec sa pastille ▲ / ▼ / = (1RM
estimé du top set, reps sans charge, durée totale en cardio, meilleure tenue en
gainage). Ensuite les séries, les exercices, les records battus, le **top set
du jour** (celui dont le 1RM estimé est le plus haut, pas le plus lourd en
valeur brute), les autres exercices **meilleurs que la dernière fois**, et une
phrase tirée de la date du jour — la même toute la journée, une autre demain.
Plus de tonnage : les kilos soulevés ne disaient rien de la progression. Tout vient des séries saisies :
aucune ligne n'apparaît sans de quoi la calculer.

La validation est un **horodatage** sur la journée (`termine`), pas un booléen :
le bilan affiche l'heure, et deux appareils peuvent la comparer. Elle voyage
par son propre appel, `pousser_fin`, sur le modèle du titre — une base sans la
colonne `seances.terminee` rend une journée **sans la clé**, et la validation
d'ici reste. Rien ne se verrouille : les séries restent modifiables après.

**Mémoire des exercices.** Tape un exercice absent de la base et il est retenu
pour la prochaine fois, groupe musculaire compris. L'enregistrement se fait quand
tu quittes le champ, pas à chaque lettre — sinon tu te retrouverais avec `B`,
`Be`, `Ben`. La carte pose alors la question en toutes lettres :
**l'ajouter à mes exercices**, ou **le relier à un exercice existant** (même
mouvement, autre nom : l'historique reste d'un seul tenant). Avant, elle
annonçait « ajouté à tes exercices » sans montrer qu'on pouvait le rattacher —
et depuis la nouvelle carte, l'encart s'insérait à côté d'un élément parti dans
l'en-tête, donc il ne s'affichait plus du tout.

**Les noms qui se ressemblent (16/11/2026).** « leg curl » et « Leg curl »,
« divierging seated row » et « Diverging seated row » : le même exercice écrit
deux fois. L'app les réunit seule, sans rien demander, quand les deux noms ne
diffèrent que par les majuscules, les accents, la ponctuation, un pluriel en
« s », ou une seule faute de frappe sur un seul mot (une lettre en trop, en
moins, changée ou inversée, sur un mot d'au moins cinq lettres qui commence
pareil). Deux exercices de la base ne se réunissent jamais : « Développé
incliné » et « Développé décliné » restent deux exercices. Le nom gardé est
celui de la base ou du dictionnaire, sinon le plus utilisé ; le récap n'affiche
plus qu'un nom par exercice. Un nom relié ou séparé à la main n'est jamais
touché, et `LES SÉPARER`, dans le menu `⋯`, défait une fusion. Les exercices
suivis se reconnaissent par l'exercice, plus par l'écriture (`FUSION_AUTO`,
`rafraichirFusionAuto`, recalculé seulement quand les noms changent).

**Les abréviations de salle.** `RDL`, `OHP`, `bench`, `deadlift`, `BSS`… :
une quarantaine d'abréviations et de noms anglais pointent vers un nom de la
base (`SYNONYMES`). Aucun rapprochement automatique ne pouvait les trouver —
« RDL » et « Soulevé de terre roumain » n'ont pas une lettre en commun.

Depuis le 8 octobre 2026, le dictionnaire **tranche tout seul** : écrire
« bench » un jour et « Développé couché » le lendemain donne un seul historique,
sans rien avoir à déclarer. Avant, il fallait accepter la proposition au moment
exact de la frappe ; passé ce moment, le nom était retenu tel quel et la
question ne revenait jamais — deux exercices pour un seul mouvement, sans que
rien ne le dise. La carte **annonce** maintenant le rapprochement
(« bench → Développé couché ») plutôt que de le demander.

**La boîte nomme sa proposition, et OUI relie à elle** (14/10/2026, « il me
propose forcément de le relier à un autre exo, et il comprend pas direct que
c'est développé couché […] si je le relie faut que ça le relie à l'exo
proposé »). Elle posait une question ouverte puis renvoyait vers une liste
déroulante vide, où il fallait retrouver soi-même l'exercice qu'elle venait de
deviner. Trois boutons suffisent maintenant : **OUI, C'EST ÇA** (qui rattache à
la proposition, en plein), `PLUTÔT L'ÉCRIRE « DÉVELOPPÉ COUCHÉ »`, et
`NON, C'EST UN AUTRE EXERCICE`. `AUTRE EXERCICE…` reste dessous, et ouvre la
liste **déjà posée sur la proposition**.

**Les fautes de frappe** (14/10/2026, « si j'écris benc ou bnech faut qu'il
puisse comprendre que j'ai voulu écrire bench, et pour tous les exos »). L'app
compte les corrections qui séparent le mot tapé d'un nom connu — une lettre en
trop, une qui manque, une fausse, deux inversées (Damerau-Levenshtein) — et
propose : *« bnech » : tu voulais écrire Développé couché ?*. La tolérance suit
la longueur : rien en dessous de quatre lettres, une correction jusqu'à huit,
deux au-delà ; et les deux mots doivent commencer pareil, sauf si ce sont
justement les deux premières lettres qui sont inversées. Les abréviations sont
cherchées aussi, et c'est l'exercice visé qui est proposé, pas l'abréviation.
Corriger remplace le nom et **retire la faute** de la liste des exercices
mémorisés — sauf si ce mot a déjà servi ailleurs dans le carnet, et là il
devient un rattachement : jamais d'historique coupé pour une correction de
confort.

Une faute **propose**, elle ne décide jamais : `cleCanonique()` ne la consulte
pas. Sans cette règle, « curl » et « curls » fusionneraient tout seuls, et un
historique faux ne se répare pas.

Sa décision passe devant le dictionnaire, dans les deux sens. Séparer deux noms
**se note** (`seul: true` dans `topset_custom_exercises`) : sans ce drapeau,
rien ne distinguait « il a tranché » de « il n'a rien dit », et le dictionnaire
aurait recollé à la frappe suivante ce qu'il venait de séparer.

**Fusionner deux exercices après coup.** Dans le menu `⋯` de la carte,
`⇄ C'EST LE MÊME EXERCICE QUE…` ouvre la liste des exercices et rattache les
deux noms : un seul historique, records et récap compris. Quand c'est déjà fait,
le menu le dit — `⇄ RATTACHÉ À « DÉVELOPPÉ COUCHÉ »` — et la feuille propose de
`LES SÉPARER`. C'est le même geste qu'à la frappe, mais disponible aussi
longtemps que l'exercice existe : une faute de nom ne coupe plus l'historique
pour de bon. « Développé haltères » et « bench haltère » ne sont dans aucun
dictionnaire ; c'est par là qu'on les réunit.

**Aucune chaîne d'alias.** Rattacher un nom à un nom déjà rattaché s'arrêtait à
la première étape : `bench haltère` → `bench` → `Développé couché` ne résolvait
qu'un cran, et l'historique restait coupé en deux sans rien dire. `definirAlias`
résout donc la cible avant de l'écrire, et la proposition annonce la
**destination finale**, jamais l'étape intermédiaire.

**Récap.** Volume total (poids × répétitions, additionné), calendrier des séances,
records par exercice et répartition par groupe musculaire — sur la semaine, le
mois ou l'année. La silhouette est de face et de dos, une zone par muscle ; un
groupe noté sans précision allume toutes ses zones, plus pâles. Sous chaque
groupe de la légende, le détail par muscle ; chaque ligne d'exercice porte son
sous-groupe.

**Le carnet n'a plus de filtres** (20/09/2026). `TOUTES / PRÉVUES / FAITES` est
parti : deux jeux de boutons se disputaient le même écran, et rien ne disait
lequel agissait sur quoi. `JOUR / SEMAINE / MOIS` commande le calendrier **et**
la liste en dessous, qui montre exactement la période affichée ; le badge
`PRÉVUE` sur la carte dit le reste.

**Partager ses perfs à des amis** (8 octobre 2026). Un exercice, une séance ou
un récap s'envoient à des amis choisis. Les mécaniques qui rendent un fil
malsain sont connues, et aucune n'est ici.

*Pas d'inconnus.* On devient amis par un **code** de 8 caractères, qu'on se
donne de la main à la main, et les deux parties agissent : l'un saisit,
l'autre accepte. Aucune recherche par pseudo — un pseudo tapé de travers
désignerait quelqu'un, un code est faux ou juste. Pas de profil public, pas de
suggestions d'amis. Le code se refait (`REFAIRE MON CODE`) sans perdre ses
amis. Tout est dans `RÉGLAGES ET PROFIL › MES AMIS`.

*On envoie, on ne publie pas.* Il n'existe **aucun fil** de ce que font tes
amis. `↗ PARTAGER` vit là où la chose vit : sur la fiche d'une séance, sur la
fiche d'un exercice, sous le récap. Tu choisis quoi, tu choisis à qui, et rien
ne part avant. Le reste de ton carnet ne sort jamais.

*Une copie figée.* Ce qui est envoyé est un instantané (`contenu` jsonb) :
l'exercice avec ses chiffres clés et ses cinq dernières séances, la séance avec
ses exercices et ses séries, le récap avec ses totaux et ses cinq premiers
groupes. Corriger ta séance demain ne change pas ce que ton ami a lu, et aucune
policy n'ouvre `seances`, `exercices` ou `series` à un ami. Les champs sont
recopiés un par un (`seriePartagee`) : ce qui n'est pas nommé ne sort pas.

*Aucun compteur sur personne.* Pas de nombre d'amis affiché comme un score, pas
de total de réactions, pas de série de jours, pas de classement — et aucune
fonction en base qui trierait des gens. Les réactions sont quatre mots fermés
(`BRAVO`, `COSTAUD`, `SOLIDE`, `VU`), sans équivalent négatif ; elles vont à ce
partage-là et ne s'additionnent nulle part. Rappuyer sur la même la retire.

*Une liste finie.* Ce qu'on a reçu s'affiche en haut de l'écran MESSAGES, du
plus récent au plus ancien, et ça s'arrête : pas de tri par popularité, pas de
défilement infini. Un filet orange marque ce qui n'est pas lu, et la pastille
de l'en-tête compte les partages non lus avec le reste. `×` range le partage
chez soi sans que l'auteur le sache. Pas de story — demandé, et de toute façon
c'est l'inverse de « on envoie à quelqu'un ».

*Sans compte, tout marche pareil.* Les boutons `↗ PARTAGER` expliquent et
proposent un compte ; rien ne casse.

Côté base : `liens_ami`, `partages`, `partages_recus`, et douze fonctions
`SECURITY DEFINER`. Aucune policy d'écriture, sauf la suppression de ses
propres partages — RLS filtre des lignes et pas des colonnes, et « chacun
modifie ses reçus » aurait laissé passer un `update` qui se rend destinataire
d'un partage adressé à quelqu'un d'autre.

**Graphique de progression** par exercice, tracé depuis ton propre historique.

**Faire un retour.** Un lien en bas de chaque écran ouvre un formulaire : un bug,
une idée, une question. Ça part dans la base, pas dans une boîte mail, et
l'app t'emmène aussitôt dans ta conversation avec l'équipe, où la réponse
arrivera. Il faut un compte — c'est ce qui permet de répondre, et ce qui évite
qu'un robot remplisse la table.

**Messages.** Une bulle dans l'en-tête ouvre toutes les conversations au même
endroit : l'équipe Top Set, son coach, ses coachés. Une pastille y compte ce qui
attend. Voir [La messagerie](coach-et-admin.md#la-messagerie).

**Trois portes dans l'en-tête.** La bulle des messages, la silhouette du
**profil** (compte, pseudo, coach, exports) et `⇅` pour les **données**
(sauvegarde, tableur, import). Le compte et les fichiers vivaient dans la même
feuille, qui était devenue un fourre-tout.

**Exporter mes données** (16/11/2026, « le bouton synchronisé ne sert pas
vraiment à grand-chose »). Dans le compte, `EXPORTER MES DONNÉES` remplace
`SYNCHRONISER MAINTENANT` : la synchro se fait déjà seule, au retour dans l'app,
au retour du réseau et après chaque note. Sans compte, le même écran s'ouvre
depuis `TES DONNÉES`, après le tableur. Les fichiers sont faits dans le
téléphone et ne passent par aucun serveur :
- **Tout en Excel** (`.xlsx`) : six onglets — Séries (une ligne par série),
  Séances (horaires, durée, volume, repos médian, ressenti), Semaines (du lundi
  au dimanche, semaines vides comprises, séries par groupe), Exercices (charge
  max, meilleure série, 1RM estimé au début et à la fin, progression), Poids du
  corps, À lire (la légende). De vraies dates et de vraies heures, des nombres
  qui se calculent, l'en-tête figé. De quoi tout garder si on quitte l'app. Le
  `.csv` de toujours reste à côté.
- **Pour une IA** (`.txt`, ou `COPIER LE TEXTE`) : la question d'abord
  (régularité, charges semaine après semaine, temps de repos, schémas
  d'entraînement, volume par groupe, temps passé, poids du corps, puis un plan
  pour les 4 semaines suivantes), la légende des notations, le profil, un
  tableau semaine par semaine, chaque exercice avec son top set séance par
  séance, et toutes les séances en entier : `100×5 @8 r150` = 5 reps à 100 kg,
  RPE 8, 150 s de repos.
Sur un téléphone, le fichier part dans la feuille de partage du même appui
(Fichiers, Mail, une app d'IA) ; si iOS refuse parce que l'appui est trop
ancien, il reste prêt et le bouton l'envoie au suivant. Sur un ordinateur, il
est téléchargé. `export.js` les fabrique depuis un modèle qu'`app.js` lui passe
(le carnet, les pesées et le pseudo : ni email, ni clé, ni réglage).

**Pensé pour le téléphone.** Sur un écran de moins de 900 px, les onglets
vivent **en bas**, sous le pouce, avec leurs icônes ; ils se rangent le temps
qu'un champ a le clavier (`body.clavier`), et laissent la place à la saisie
dans une conversation. Ils reviennent toujours : la barre ne se range que si
la zone visible a vraiment rétréci (`visualViewport`), et un changement de vue,
un retour sur la page ou l'app remise au premier plan effacent tout état
périmé. Toucher le logo **TOPSET** ramène à la séance du jour. Sur un ordinateur, ils restent une barre segmentée en haut. Une flèche « revenir en haut » apparaît dès qu'on est descendu d'un
écran. Deux appuis rapides sur `+` ajoutent 5 kg au lieu de zoomer
(`touch-action: manipulation`), et toucher un champ ne fait plus zoomer
Safari : sous iOS, tous les champs sont écrits en 16 px au moins, la taille en
dessous de laquelle Safari zoome d'office — et ne dézoome plus. La couche de la
refonte vient après elle, mais ne touche jamais la taille de ces champs : une
garde le vérifie. Cette règle est
**la dernière de la feuille de style** : à spécificité égale, c'est la règle
écrite plus bas qui gagne, et placée plus haut elle perdait contre le champ de
la messagerie, qui restait en 14 px. Un garde-fou le vérifie.

Les feuilles (données, profil, retour) et l'écran d'accueil laissent la place
de l'heure et de la batterie, et leur en-tête — avec la croix — reste en haut
quand on les fait défiler. Dans l'app installée, une feuille haute glissait sa
croix sous la barre d'état : on ne pouvait plus la fermer.

**Une virgule qui marche vraiment.** Le champ poids accepte `62,5` comme `62.5`.
Un clavier français propose une virgule, et `<input type="number">` la refuse en
silence : le champ se vide et la série perd son poids. C'est précisément pour ça
que ce champ est en `type="text"` avec `inputmode="decimal"`.
