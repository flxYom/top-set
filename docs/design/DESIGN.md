---
name: Top Set — Salle noire
colors:
  background: '#0c0b0a'
  surface: '#151412'
  surface-container: '#1d1b19'
  surface-container-high: '#27241f'
  outline: '#2b2825'
  outline-variant: 'rgba(255,244,230,0.15)'
  hairline: 'rgba(255,244,230,0.08)'
  on-surface: '#f5f2ec'
  on-surface-variant: '#a39b8f'
  on-surface-tertiary: '#8d867b'
  primary: '#ff5c38'
  on-primary: '#0d0c0a'
  record: '#ffd23f'
  on-record: '#0d0c0a'
  success: '#2bd08a'
  on-success: '#0d0c0a'
  info: '#4d7cff'
  group-pectoraux: '#ff7aa2'
  group-dos: '#22b8a8'
  group-epaules: '#a99bff'
  group-bras: '#d45fc4'
  group-jambes: '#b3d236'
  group-abdos: '#c99a6b'
  group-cardio: '#6fd6f5'
  group-autre: '#8f887d'
typography:
  display: 'Bricolage Grotesque'
  body: 'system-ui (SF Pro on iPhone)'
radius:
  s: '10px'
  m: '14px'
  l: '20px'
  xl: '26px'
---

# Design System: Top Set — Salle noire

Extrait du code en ligne (`index.html`, couche `<style id="refonte">`, `app.js`)
le 18/09/2026. Ce fichier **décrit** l'interface pour la recréer ou la
prolonger. Les **décisions** (pourquoi, ce qui est clôturé, ce qui reste à
trancher) vivent dans [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) : en cas
d'écart, c'est lui qui fait foi.

## 1. Visual Theme & Atmosphere

Une salle de musculation la nuit : un noir chaud, presque brun, où seuls les
chiffres et l'action principale prennent la lumière. Le fond n'est pas un
gris neutre mais un `#0c0b0a` teinté vers l'orange, avec une seule lueur
orange très diffuse au sommet de l'écran. Tout le reste est porté par trois
niveaux de surface qui montent d'un cran chacun, des filets à 8 % de blanc
chaud, et un texte blanc cassé, jamais pur.

C'est une interface d'outil, dense et directe, utilisée pendant l'effort :
les grands chiffres (charge, répétitions, séries) sont en Bricolage
Grotesque, serrés et lourds ; tout le texte courant passe à la police du
téléphone pour rester lisible en petit. Les couleurs ont chacune un seul
rôle, les effets sont rares (une lueur sous l'action principale, un verre
unique sous les onglets du téléphone), et chaque animation s'arrête si
l'appareil demande moins de mouvement.

## 2. Color Palette & Roles

### Primary Foundation
- **Noir de salle chaud** `#0c0b0a` — fond de page, sous tout.
- **Fonte sombre** `#151412` — première surface : cartes, en-tête, onglets.
- **Fonte patinée** `#1d1b19` — surface intermédiaire : lignes de série, tuiles.
- **Fonte levée** `#27241f` — surface haute : élément actif, onglet choisi.
- **Filet chaud** `rgba(255,244,230,.08)` / `.15` — contours et séparateurs ;
  la profondeur vient des surfaces, pas des bordures.

### Accent & Interactive
- **Orange Top Set** `#ff5c38` — la marque, l'action principale (bouton
  plein, dégradé léger vers le haut, lueur orange dessous), la série ouverte,
  le chrono en marche, le focus clavier. Texte noir `#0d0c0a` dessus.
- Jamais décoratif, jamais pour désigner un groupe musculaire.

### Typography & Text Hierarchy
- **Blanc cassé** `#f5f2ec` — texte principal, chiffres.
- **Grès** `#a39b8f` — texte secondaire, libellés.
- **Poussière** `#8d867b` — texte tertiaire (jours de la semaine, en-têtes de
  colonnes), 4,8:1 sur la surface patinée.

### Functional States
- **Vert fait** `#2bd08a` — série cochée (ligne teintée + coche pleine),
  séance validée, hausse dans le bilan.
- **Jaune record** `#ffd23f` — record, top set, outils ; jamais une alerte.
- **Bleu info** `#4d7cff` — information, commentaire.
- Un état n'est jamais porté par la couleur seule : toujours un mot, une
  icône ou une forme avec.

### Groupes musculaires
Huit teintes à part, validées pour rester distinctes en vision normale et
pour les trois daltonismes courants : Pectoraux `#ff7aa2`, Dos `#22b8a8`,
Épaules `#a99bff`, Bras `#d45fc4`, Jambes `#b3d236`, Abdos `#c99a6b`,
Cardio `#6fd6f5`, Autre `#8f887d`. Elles teintent un liseré, une pastille,
l'en-tête d'une carte ; jamais une couleur de sens.

## 3. Typography Rules

### Hierarchy & Weights
- **Bricolage Grotesque** (auto-hébergée, `fonts/`) : grotesque à caractère,
  un peu brute. Pour la marque, les titres, les boutons, les onglets et tous
  les grands chiffres. Graisse 800, approche négative (`-0.02` à `-0.04em`).
  - Titre de séance : 32 px ; titre de vue : ~24 px ; chiffre de tuile : 22–28 px ;
    grand chiffre du bilan / récap : 42 px.
  - Saisie d'une série : 16 px minimum sur iPhone (en dessous, Safari zoome).
- **Police du système** (SF Pro sur iPhone) : texte courant, notes,
  explications, 13–15 px, graisse 400–700.
- **Libellés** : 11 px minimum, capitales, graisse 700–800, espacement
  `.06` à `.16em`.

### Spacing Principles
- Chiffres de performance en `tabular-nums` : les colonnes ne dansent pas.
- Interlignage serré (1–1,1) sur les chiffres et titres, 1,4–1,5 sur le texte.
- Guillemets français avec espaces insécables (`« … »`).

## 4. Component Stylings

### Buttons
- **Principal** : pleine largeur, orange plein, texte noir en capitales
  Bricolage, rayon 14–20 px, lueur orange douce dessous. Un seul par écran.
- **Secondaire** : fond de surface, filet chaud, texte blanc cassé.
- **Ajout léger** (`+ SÉRIE`, `+ COMMENTAIRE`) : contour en pointillé, neutre
  ou orange pour l'action la plus probable.
- **Icône** : cercle ou carré arrondi de 44 px, surface sombre, icône SVG de
  20–24 px au trait de 1,9–2,3.
- Appui : léger enfoncement (`scale(.975)`), 0,14 s. Aucune cible sous 44 px.

### Cards & Exercise Cards
- Carte : surface sombre, filet chaud de 1 px, rayon 20–26 px, relief
  presque invisible (reflet de 1 px en haut, ombre longue et diffuse).
- **Carte d'exercice** : en-tête teinté de la couleur du groupe, puis une
  grille d'une ligne par série (numéro · dernière fois · kg · reps · RPE ·
  coche), façon Strong/Hevy. La série ouverte a un contour orange et révèle
  ses outils ; une série faite se teinte de vert.
- **Suggestion** : bloc bordé orange avec l'étiquette `SUGGÉRÉ`, pour ne
  jamais confondre ce qu'on a fait et ce qu'on pourrait tenter.
- **Tuiles de chiffres** : grille égale (2 ou 3 colonnes), grand chiffre
  Bricolage + libellé en capitales grès.

### Navigation
- **Téléphone** (< 900 px) : barre du bas fixe, quatre onglets (Planning,
  Séances, Récap, Apprendre), icône 24 px + libellé 10,5 px, capsule grise
  flottante avec une loupe de verre sous l'onglet actif (seule exception au
  « pas de verre »). Elle se range quand le clavier sort.
- **Ordinateur** : barre segmentée en haut, onglet actif sur surface levée,
  icône orange.
- **Sous-onglets** : contrôle segmenté à trois cases de 44 px.

### Inputs & Forms
- Champs sans bordure lourde, sur surface patinée, rayon 10 px ; focus en
  contour orange avec un halo à 20 %.
- Chiffres centrés en Bricolage ; libellé visible au-dessus ou dans la cellule.

### Domain-Specific Components
- **Calendrier** : jour fait = couleur du groupe en plein, prévu = contour,
  aujourd'hui = bord orange ; cases de 44 px minimum.
- **Chargement** : une barre de musculation qu'on charge disque par disque,
  en grand pour le bilan, en petit (30 px) pour les listes.
- **Bilan** : feuille sombre plein écran, étiquette verte `SÉANCE TERMINÉE`,
  grand chiffre des exercices en hausse, pastilles `▲ +3 %` vertes.

## 5. Layout Principles

### Grid & Structure
- Une colonne centrée, 560 px de large au plus (640 px au-delà de 900 px).
- Marges latérales de 16 px, ou la zone sûre de l'iPhone si elle est plus grande.
- Grilles internes en `minmax(0,1fr)` pour que rien ne déborde.

### Whitespace Strategy
- Rythme de 4/8 px : 6–10 px entre éléments d'un bloc, 14–20 px entre blocs.
- Dense par choix : on voit toute une série sans défiler.

### Alignment & Visual Balance
- Aligné à gauche, chiffres centrés dans leurs colonnes.
- Le poids visuel va aux chiffres et à l'action principale, rien d'autre.

### Responsive Behavior & Touch
- Pensé téléphone d'abord, vérifié à 320, 360, 375, 402 et 430 px.
- Toute barre fixe respecte `env(safe-area-inset-*)`.
- Cibles tactiles ≥ 44 px ; zone d'appui élargie quand le visuel est plus petit.
- `prefers-reduced-motion` coupe les animations et la loupe.

## 6. Design System Notes for Stitch Generation

### Language to Use
« Carnet de musculation sombre, noir chaud presque brun, dense, chiffres
énormes en grotesque serrée, une seule couleur d'action orange vif, surfaces
en trois niveaux, filets très fins, pas de verre, pas de dégradé violet. »

### Color References
Noir de salle chaud `#0c0b0a` · Fonte sombre `#151412` · Fonte patinée
`#1d1b19` · Blanc cassé `#f5f2ec` · Grès `#a39b8f` · Orange Top Set
`#ff5c38` · Vert fait `#2bd08a` · Jaune record `#ffd23f`.

### Component Prompts
- « Carte d'exercice sombre : en-tête teinté citron vert avec le nom
  "Squat", puis une grille de séries, une ligne par série, colonnes kg /
  reps / RPE en grands chiffres Bricolage, une coche verte pleine sur la
  série faite. »
- « Bouton principal pleine largeur, orange `#ff5c38`, texte noir en
  capitales "+ AJOUTER UN EXERCICE", rayon 18 px, lueur orange diffuse. »
- « Bilan de fin de séance plein écran sur fond noir chaud : étiquette verte
  "SÉANCE TERMINÉE", titre, un chiffre géant, trois tuiles, une liste
  d'exercices avec pastilles de progression vertes. »

### Incremental Iteration
Changer un écran à la fois ; garder les couleurs dans leur rôle ; vérifier à
375 px avant tout ; ne jamais ajouter d'effet qui ne serve pas la saisie ou
la lecture d'un chiffre.
