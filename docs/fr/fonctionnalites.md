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

**Planning et séances.** L'app s'ouvre sur **SÉANCES › DU JOUR**, le carnet où
l'on note : le bandeau du jour, puis les exercices et les séries. Le **PLANNING**
est un calendrier qu'on regarde : **SEMAINE** (par défaut, une ligne par jour :
titre de la séance, exercices, séries, faite ou prévue, puis les groupes
travaillés de la semaine), **MOIS** (la grille, une pastille à la couleur du
groupe dominant, pleine pour une séance faite, en contour pour une séance
prévue) et **JOUR** (le détail d'une séance). Les flèches avancent d'un jour,
d'une semaine ou d'un mois ; `AUJOURD'HUI` passe en orange dès qu'on s'est
éloigné. Toucher une séance montre sa fiche, rangée sous MES
SÉANCES, et `‹ RETOUR` ramène au calendrier ; un jour vide s'ouvre dans DU JOUR,
où `AUJOURD'HUI ›` ramène à aujourd'hui. **SÉANCES** a trois rubriques :
DU JOUR, MES SÉANCES et HISTORIQUE.

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
encadré, avec sa flèche : il ouvre la séance d'avant dans DU JOUR, et une
barre orange en bas de l'écran, `RETOUR À MA SÉANCE`, ramène au jour de départ,
sur l'exercice d'où l'on était parti. La barre suit un aller-retour, pas une
chaîne : depuis la séance d'avant, sa propre date mène plus loin, mais le retour
vise toujours le point de départ. Elle se cache dans les autres onglets et
disparaît quand on revient au jour de départ, par elle ou par le calendrier.
Pour un exercice sans historique, la colonne n'apparaît pas (`.sans-prec`).
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

**La loupe des onglets, les couleurs des groupes, les attentes (septembre
2026).** Sous l'onglet actif, une pièce de verre (`#ongletLoupe`, placée par
`placerLoupe()` à chaque `montrerVue`) : un reflet en haut, un liseré clair à
peine visible. Quand on change d'onglet, elle glisse, s'étire dans le sens du
mouvement et un seul reflet chaud fait le tour du liseré le temps du trajet
(0,46 s) ; le libellé reste au-dessus, net. Elle se fait aussi **glisser du
doigt** : passé 8 px de déplacement horizontal, elle se soulève et suit le
doigt, l'onglet survolé s'allume, et le plus proche s'ouvre au lâcher ; un
simple appui reste un clic (Pointer Events, `touch-action:none` sur la barre
du bas). **Sur téléphone, la barre du bas reprend celle d'iOS 26** : une
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
`DOS`…), avec le menu natif posé dessus. Le superset reste sous `+ SÉRIE` —
c'est une action de saisie, pas un réglage ; passer au temps et supprimer
l'exercice sont dans le menu `⋯`. La carte est un conteneur (`container-type: inline-size`) : sous 310 px
utiles — petit téléphone, superset sur un écran de 360 px — la colonne de la dernière fois
cède sa place aux chiffres du jour, et la ligne *Dernière fois* liste alors les
séries précédentes.

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
  faite — dans sa fiche, ou dans DU JOUR quand on l'ouvre par la date de la
  dernière fois : l'exercice arrive dans la séance d'aujourd'hui avec ses séries,
  RPE compris, rien de coché. Le même exercice déjà posé et encore vide reçoit
  les séries au lieu d'un doublon (`ajouterAuJour`). « Faite » : validée, ou
  passée avec des séries — sans quoi aucun carnet d'avant la validation n'en
  profiterait (`seanceFaite`).
- Sur un jour vide, `↺ REFAIRE CELLE DE LUNDI DERNIER` (le même jour, la
  semaine d'avant) et `↺ REFAIRE MA DERNIÈRE SÉANCE` si ce n'est pas la même,
  avec leur titre ; tout se recopie par `selectionnerSeance`.

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

**Le bandeau du jour prend un dessin** selon le groupe musculaire dominant de
la séance : un banc pour les pectoraux, une cage à squat pour les jambes, une
barre et des anneaux pour le dos, des haltères pour les épaules, une barre EZ
pour les bras, une roue pour les abdos, un tracé cardiaque et une corde pour le
cardio. Des SVG en gris (`img/hero/`), que la teinte du groupe colore
par-dessus comme la photo ; « Autre » et la séance vide gardent la photo des
disques. Ils sont dans la coquille du service worker : hors ligne aussi.

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

**Les abréviations de salle.** `RDL`, `OHP`, `bench`, `deadlift`, `BSS`… :
une quarantaine d'abréviations et de noms anglais pointent vers un nom de la
base (`SYNONYMES`). Aucun rapprochement automatique ne pouvait les trouver —
« RDL » et « Soulevé de terre roumain » n'ont pas une lettre en commun. Dès la
frappe, la carte propose le nom entier ; accepter **renomme** l'exercice et
garde l'abréviation **rattachée** au vrai nom, pour la prochaine fois. Rien
n'est décidé sans l'utilisateur : la table ne sert qu'à proposer.

**Récap.** Volume total (poids × répétitions, additionné), calendrier des séances,
records par exercice et répartition par groupe musculaire — sur la semaine, le
mois ou l'année.

**Deux rubriques dans SÉANCES.** *Mes séances* — ce qui reste à faire : les
séances préparées mais pas loguées, celle du jour, celles à venir, triées du plus
ancien au plus récent pour qu'une séance sautée remonte. C'est là que vit
*Créer ma séance*. *Historique* — ce qui est fait, du plus récent au plus ancien,
groupé par mois. La frontière est le fait de l'avoir loguée, pas la date seule :
une séance loguée aujourd'hui reste dans *Mes séances* jusqu'au lendemain.

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
**profil** (compte, pseudo, coach, synchronisation) et `⇅` pour les **données**
(sauvegarde, tableur, import). Le compte et les fichiers vivaient dans la même
feuille, qui était devenue un fourre-tout.

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
