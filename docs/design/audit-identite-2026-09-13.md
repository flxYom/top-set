# Audit de l'identité visuelle et de l'UX — 13 septembre 2026

Phase 1 de la mission « Top Set, produit premium et mature ». **Aucune
modification de l'application n'a été faite.** Ce document décrit ce qui
existe, avec des chiffres mesurés, puis propose des priorités.

## Méthode

- **Code.** Lecture de `index.html` : 1 830 lignes de styles d'origine, puis la
  couche `<style id="refonte">` de 372 lignes posée le 13/09. Lecture de
  `app.js` pour les libellés, les icônes et les états.
- **Rendu réel.** Chrome sans interface, en 375 × 812, écran ×2, avec un carnet
  d'exemple de 4 séances. Styles **calculés** sur chaque élément visible, dans
  six vues :
  - Planning ;
  - Séances ;
  - Récap (semaine) ;
  - Apprendre ;
  - Bilan de fin de séance ;
  - jour vide.
- **Chargement de fin de séance.** Vérification image par image après
  « OUI, C'EST PLIÉ », puis par « REVOIR LE BILAN ».

## 1. Ce qui marche déjà

- **Les grands chiffres de saisie.** 82,5 / 5 / RPE dans la grille : on les lit
  bien, en une ligne par série (décision du 11/09).
- **La marque en texte réel.** TOP clair, SET orange : pas d'image, net à
  toutes les tailles.
- **Les ombres décalées de couleur ont disparu.** 35 règles dans le code
  d'origine, **0 visible** à l'écran après la refonte.
- **Les bordures sont fines.** À l'écran, presque tout est à 1 px. Il reste 1 à
  3 éléments en 2 px par vue.
- **Le fond sombre chaud et l'orange** sont cohérents d'un écran à l'autre.
- **Le chargement de fin de séance fonctionne quand on valide.** Il reste
  affiché environ 1,2 s, avec :
  - un disque par exercice ;
  - des compteurs qui montent jusqu'aux chiffres du bilan ;
  - un appui pour passer au bilan.

## 2. Ce qui fait « système généré à partir des mêmes recettes »

### Majuscules

À l'écran, **plus de la moitié des textes sont en capitales** :

| Vue | Textes | En capitales |
|---|---|---|
| Planning | 71 | 40 (56 %) |
| Bilan | 96 | 50 (52 %) |
| Récap | 42 | 21 (50 %) |
| Séances | 25 | 13 |
| Jour vide | 37 | 19 |
| Apprendre | 29 | 12 |

Le CSS n'explique qu'une partie. On trouve **17 règles** `uppercase`, mais
surtout environ **76 libellés écrits en capitales dans `app.js`** et
**71 dans `index.html`** (« OUI, C'EST PLIÉ », « + SÉRIE », « VOIR LE RÉCAP… »).
On ne peut donc pas régler ça en CSS : il faut réécrire les textes.

### Pas d'échelle typographique

- **29 tailles de texte différentes** dans le code d'origine, de 8 à 42 px
  (8, 8,5, 9, 9,5, 10, 10,5, 11, 11,5…).
- À l'écran : **15 tailles** sur Planning et **19** sur le Bilan. La plupart
  sont entre **9 et 12 px**. C'est petit pour un téléphone tenu à bout de bras
  entre deux séries.
- **Graisse 800 dans 138 déclarations sur 177.** Quand tout est gras, rien ne
  ressort.
- **Chiffres à chasse fixe (`tabular-nums`) : 8 règles seulement.** Les chiffres
  des compteurs et des tuiles ne s'alignent pas d'une ligne à l'autre.
- Deux polices :
  - Bricolage Grotesque pour les titres et les nombres ;
  - la police du système pour le reste.

  La répartition est saine. Mais les petits libellés en capitales espacées
  dans la police du système ressemblent à des étiquettes de gabarit.

### La même carte partout

Presque chaque bloc suit la même recette :

- fond de surface ;
- trait de 1 px ;
- rayon ;
- petit sur-titre en capitales espacées ;
- valeur en gras.

Exemples : CRÉER MA SÉANCE, DERNIÈRE FOIS, TOP SET DU JOUR, MIEUX QUE LA
DERNIÈRE FOIS, CETTE SEMAINE, ASSIDUITÉ.

À l'écran, **71 éléments bordés sur Planning et 81 sur le Bilan**. On compte
aussi **11 rayons différents** : 3, 4, 6, 7, 10, 12, 14, 16, 20, 26 px et la
pilule.

Les « pilules » servent à tout : 2 EXOS, 3 SÉRIES, 1,6 T, les groupes, les
filtres.

### Boutons en pointillés empilés

Sous **chaque** exercice, trois boutons en pointillés :

- + SÉRIE ;
- + COMMENTAIRE ;
- AJOUTER UN EXERCICE EN SUPERSET.

Il y en a **6 sur Planning** et **7 sur le Bilan**, en comptant la zone
SÉANCE VALIDÉE. C'est le motif le plus répété de l'app.

### Points de fond

- **Motif de points de 14 px sur tout le fond de l'app** (`.app`). Il est
  toujours actif : la refonte n'a retiré l'image que de `:root`.
- Deuxième trame de points **sur les dessins du bandeau**.

### Dégradés, lueurs, flou

- **6 dégradés sur Planning** :
  - le halo orange du fond ;
  - les en-têtes teintés par groupe ;
  - le bouton principal ;
  - le voile du bandeau.
- **Lueurs** sur :
  - le bouton principal ;
  - la coche verte ;
  - le jour choisi ;
  - la tuile jaune du volume.
- **Flou d'arrière-plan sur 4 éléments** : la barre d'onglets et les feuilles.
  C'est exactement le glassmorphism générique que la mission exclut.

### Texture

La tuile « Volume levé » porte une photo de béton en base64 (`--img-concrete`) :
**35,8 Ko, soit 22 % du poids de la page**, pour un grain à peine visible.

## 3. Couleurs : les rôles se marchent dessus

Il y a quatre accents plus huit couleurs de groupes, et **les mêmes teintes ont
plusieurs sens** :

| Teinte | Sert à la fois pour |
|---|---|
| Orange `#ff5c38` | marque, action principale, **Pectoraux**, pastille SUGGÉRÉ, **message d'erreur** (`.sheet-msg.err`), signal « en baisse » |
| Jaune `#ffd23f` | record, **Épaules**, pastille TOP set, jour dans la liste des séances, nom qui défile dans le chargement, signal « stable » |
| Vert `#12c07a` / `#2bd08a` | série faite, **Jambes**, SÉANCE VALIDÉE, « mieux que la dernière fois », phrase du bilan |
| Bleu `#4d7cff` | **Dos**, pastille back-off, commentaire |

À l'écran, Planning affiche en même temps **15 éléments orange, 6 verts,
2 jaunes et 2 bleus**. Le Bilan en affiche 15 orange, 9 verts, 3 jaunes et
2 bleus.

**Il n'y a pas de couleur d'erreur distincte** : une erreur de connexion a la
même couleur que le bouton « Créer ».

## 4. Icônes

- **13 SVG**, tous sur une grille 24 px, mais avec **10 épaisseurs de trait
  différentes** (de 1,2 à 2,8).
- Mélangés à des **caractères de texte** : ⇄ ↺ ◷ ✎ ✓ ✕ ×.
- Les signaux de progression d'un exercice sont des **emoji** : 🟢 🟠 🔴 ⚪.

Trois styles cohabitent.

## 5. Illustrations et images

- **7 dessins du bandeau** (13/09). Traits teintés recouverts de points :
  - sur téléphone, le banc passe sous les pastilles 2 EXOS / 4 SÉRIES ;
  - le rendu fait « clipart », pas éditorial.
- **2 images Higgsfield** : les disques du jour vide et la barre de l'accueil.
  Elles sont sobres, mais ce sont des images d'ambiance générées par IA :
  justement ce que la mission veut éviter comme recette.

## 6. États de l'interface

| État | Aujourd'hui | Problème |
|---|---|---|
| Neutre | surface + trait | — |
| Fait | ligne teintée verte + coche verte avec lueur | lisible |
| Cible / suggéré | bloc bordé orange « SUGGÉRÉ 82,5 kg × 5 » au-dessus de la grille | prend ~100 px au-dessus des séries, en couleur de marque |
| Record | **petite étoile jaune dans le coin de la coche** ; chiffre en jaune dans le bilan | quasi invisible en séance ; repose surtout sur la couleur |
| Alerte | trait gauche jaune (`bilan-alerte`) | même jaune que le record |
| Erreur | texte orange | même orange que l'action |
| Chargement | barre qui se charge (bilan) ; même barre en boucle pour le compte | aucun état de chargement ailleurs |
| Vide | bandeau photo + texte | correct |

## 7. Chargement de fin de séance

J'ai vérifié dans le navigateur, sans supposer.

- **« OUI, C'EST PLIÉ » : le chargement est bien là.**
  - 60 ms : il est affiché ;
  - 400 ms : 4 disques visibles, compteurs à 2 séries · 1 193 kg ;
  - 1,3 s : le bilan le remplace.
- **« REVOIR LE BILAN » : pas de chargement.** Le bilan s'ouvre directement.
  C'est le cas depuis la création de l'écran de fin, le 12/09 (`c5038ad`) :
  ce n'est pas la refonte qui l'a retiré.
- **« VOIR LE RÉCAP DE CETTE SÉANCE » : pas de chargement non plus.** On passe
  directement à l'onglet Récap.

Si tu as vu le chargement disparaître, c'est très probablement en rouvrant une
séance déjà validée : le bouton devient alors « REVOIR LE BILAN ».

## 8. Ergonomie en séance

- **Cibles trop petites.**

  | Cible | Taille | Remarque |
  |---|---|---|
  | REVOIR LE BILAN | 113 × 27 px | |
  | Date de la dernière fois | 52 × 32 px | décidé à 32 px le 13/09 |
  | Nom de l'exercice | 40 px de haut | |
  | Onglets Semaine / Mois / Année | 42 px de haut | |
  | Liens du pied de page | 31 px de large | |

- **Le bloc SUGGÉRÉ** pousse la grille vers le bas à chaque exercice.
- **Les trois boutons en pointillés** sous chaque carte allongent la page :
  Planning mesure 1 913 px pour 2 exercices.

## 9. Décisions passées que la mission pourrait rouvrir

Je te les signale sans les changer.

1. **La refonte « Salle noire » (13/09, en ligne).** Je l'ai décidée seul, à ta
   demande de totale autonomie. Elle a posé :
   - le flou d'arrière-plan ;
   - les en-têtes en dégradé par groupe ;
   - les rayons jusqu'à 26 px ;
   - les lueurs ;
   - la police du système pour le texte ;
   - les onglets en bas ;
   - les 2 images Higgsfield.

   La nouvelle mission demande une identité « brute/géométrique », sans
   glassmorphism, avec moins de dégradés et pas d'images qui font IA.
   **C'est en conflit sur le flou, les dégradés, les grands rayons et les images.**
2. **Pages de contenu sans photo** (11/09 : schémas SVG et vraies captures de
   l'app). La partie « images éditoriales » de la mission pourrait rouvrir ce
   sujet pour le site.
3. **Carte d'exercice** (11–12/09) :
   - une ligne par série ;
   - outils seulement sur la série ouverte ;
   - commentaire par série ;
   - bouton superset sous « + SÉRIE ».

   Toute retouche des cartes doit garder ces règles.
4. **Le ton « truc jeune » de l'écran de fin** (« OUI, C'EST PLIÉ »). Réduire les
   capitales change aussi ce ton.

## 10. Outils disponibles

- **Higgsfield.** CLI et skills, pas un MCP : l'usage est le même. Offre
  gratuite, **8 crédits restants**.
  - Doute sérieux pour un **loader d'interface** : une vidéo générée pèse
    lourd dans le cache hors ligne, reste floue en petit et ne se teinte pas
    selon les données (disques par exercice, compteurs).
  - Plus utile pour un plan de marque ou une référence de mouvement.
- **Canva.** Le MCP est branché : il peut servir d'espace de référence pour la
  direction artistique.
- **Pinterest.** Aucun outil connecté, et le site exige un compte. Sans tableaux
  que tu partages, je ne peux pas l'exploiter.

## 11. Priorités proposées

Dans l'ordre de la mission : vitesse, lisibilité, progression, mobile,
fiabilité, puis esthétique.

1. **Fondation typographique.**
   - Une échelle de 6 tailles, 11 px minimum pour un libellé.
   - 3 graisses.
   - `tabular-nums` sur tous les chiffres.
   - Libellés et boutons en minuscules, les capitales réservées à quelques
     étiquettes courtes.
2. **Rôles des couleurs.**
   - Une couleur d'erreur à part.
   - Le jaune réservé au record.
   - Séparer les couleurs de groupes des couleurs de sens.
3. **Profondeur.**
   - Retirer les points du fond de l'app.
   - Une seule lueur, sur l'action principale.
   - Grouper les boutons en pointillés.
   - Moins de cartes : séparer par espace et par filet.
   - Décider du flou et des dégradés (point 9.1).
4. **États.**
   - Record, fait, cible, alerte et erreur, chacun avec icône, texte et
     position, pas seulement une couleur.
   - Record bien visible en séance.
   - Remplacer les emoji.
5. **Icônes.** Un seul jeu, grille 24 px, un seul trait, sans caractères de
   texte.
6. **Chargement.** Un même langage pour toutes les attentes : validation,
   revoir le bilan, compte, synchronisation.
7. **Poids.**
   - Retirer la texture béton : −35,8 Ko.
   - Revoir ou retirer les dessins du bandeau.
8. **`DESIGN_SYSTEM.md`**, écrit au fur et à mesure des décisions de la phase 2.
