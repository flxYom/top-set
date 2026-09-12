# Audit de top-set.fr face à la concurrence — 12 septembre 2026

Ce qui va, ce qui ne va pas, ce qui a été corrigé le jour même et ce qui reste.

## Méthode et limites

- **Mesures** : Lighthouse 12, profil mobile, sur la production, pour l'accueil,
  la page produit et le calculateur de 1RM. Rendu du premier écran dans un
  navigateur à 375 × 812 et 320 × 568, stockage vidé (premier visiteur).
- **Concurrents lus** : les pages d'accueil de [Hevy](https://www.hevyapp.com/),
  [Strong](https://www.strong.app/), [StrengthLog](https://www.strengthlog.com/),
  [Carnet de Musculation](https://www.carnetdemusculation.fr/) (app française
  iOS/Android) ; la page [top set + backoff d'Arvo](https://arvo.guru/fr/resources/top-set-backoff),
  3ᵉ sur « top set musculation » ; le comparatif
  [Bible du sport](https://www.bibledusport.fr/meilleure-appli-musculation-gratuite/).
  Les pages ont été lues au travers d'un résumé automatique : les chiffres
  qu'elles affichent (utilisateurs, notes) sont les leurs, pas vérifiés.
- **Classements** : relevé du 11 septembre (`seo/recherche/concurrence-ddg-2026-09-11.json`,
  résultats Bing via DuckDuckGo France), plus une recherche du 12.
- **Pas d'accès** à la Search Console ni aux statistiques : rien ici ne dit
  combien de personnes viennent, ni d'où.

## Ce qui va

**Le positionnement tient face aux gros.** Gratuit, sans pub, sans compte, hors
ligne, export CSV, synchronisation et RPE compris. D'après leurs propres pages,
Strong range la synchro multi-appareils dans une offre payante (« Strong Cloud »)
et StrengthLog met le suivi RPE/RIR dans son abonnement. Aucun des comparatifs
lus ne cite d'app qui marche dans le navigateur, sans installation.

**La technique est au niveau, ou au-dessus.**

| Page (mobile, production) | Perf. | Access. | Bonnes pratiques | SEO | LCP | CLS |
|---|---|---|---|---|---|---|
| Accueil `/` | 92 | 96 | 100 | 100 | 2,4 s | 0,101 |
| `/carnet-de-musculation` | 99 | 100 | 100 | 100 | 1,6 s | 0 |
| `/outils/calculateur-1rm` | 100 | 100 | 100 | 100 | 1,2 s | 0,001 |

En-têtes de sécurité stricts (CSP sans script en ligne, HSTS, `frame-ancestors
'none'`), canonical sur chaque page, redirections propres, page 404 à nous
(elle manquait le 11), données structurées `SoftwareApplication` et fil d'Ariane.

**Le contenu est plus solide que celui des concurrents directs.** Les pages font
1 300 à 2 300 mots, citent 20 à 29 fois leurs sources, portent un auteur et une
méthode éditoriale. La page d'Arvo qui nous devance sur « top set » n'a ni
auteur ni source, et mélange français et anglais.

**La carte d'exercice parle la langue du marché** : une série par ligne, la
dernière fois en face, la grille de Strong et Hevy (refaite le 11).

## Ce qui n'allait pas — corrigé le 12

1. **Le premier écran contredisait la promesse.** La description du site et la
   page produit disent « sans compte, pas d'inscription » ; l'app s'ouvrait sur
   un formulaire d'inscription, avec « continuer sans compte » en petit lien
   souligné tout en bas — sous la ligne de flottaison sur un petit iPhone.
   Maintenant : `COMMENCER SANS COMPTE` en tête, en vrai bouton, et le compte
   juste en dessous, sans geste de plus.
2. **L'accueil bougeait au chargement** (CLS 0,101 pour un seuil « bon » à 0,1) :
   texte posé dans la police du système, puis recomposé. La police est
   préchargée. Remesuré en production, trois passages : CLS 0, 0,088 et 0,088 ;
   performance 93 à 95 ; premier affichage 1,9 à 2,0 s au lieu de 2,3. Le
   décalage qui reste vient du panneau du jour, sous le seuil.
3. **Deux `<h1>`** sur l'accueil (le logo et le titre de bienvenue). Le logo est
   un paragraphe.
4. **Le manifeste n'avait pas de captures.** Les apps concurrentes ont une fiche
   de store avec des écrans ; sur Android, Chrome montre une fenêtre
   d'installation plus riche quand le manifeste en déclare. Les trois captures
   de la page produit y sont.

## Ce qui ne va pas — et que je ne peux pas corriger seul

1. **Le site est invisible.** Une recherche sur « top-set.fr carnet de
   musculation » ne le sort pas ; il n'apparaît dans aucun des comparatifs
   « meilleure appli musculation gratuite ». En face : Hevy annonce plus de
   16 millions d'utilisateurs et 4,9/5 sur les stores, Strong 5 millions,
   StrengthLog 100 000 par mois, avec logos de presse et avis. Top Set n'a aucune
   preuve sociale — et on n'en inventera pas.
   *À faire* : resoumettre le sitemap dans la Search Console et suivre
   l'indexation ; demander un avis aux premiers utilisateurs, à citer avec leur
   accord ; écrire aux auteurs des comparatifs en proposant l'angle qu'aucun
   n'a : l'app qui marche sans rien installer.
2. **Pas de présence sur les stores.** Le comparatif lu ne retient que les apps
   disponibles sur iOS et Android. Une app web peut entrer sur le Play Store
   sous forme de TWA (une coquille qui ouvre le site) ; l'App Store est plus
   fermé. C'est une décision à prendre, pas une correction.
3. **Le contenu est étroit.** StrengthLog annonce plus de 450 exercices et
   200 programmes ; Top Set a deux pages d'exercice et aucun programme. Suite
   logique : squat et tractions (déjà dans la matrice), soulevé de terre, et des
   programmes quand les modèles de séance seront livrés.
4. **Fonctions que les leaders mettent en avant et que Top Set n'a pas** :
   modèles de séance (en cours), calculateur de disques et d'échauffement
   (Strong), démonstrations d'exercices en image (Hevy, StrengthLog). Montre et
   Apple Santé ne sont pas accessibles à une app web.
5. **Deux anciens hôtes répondent encore** : `topset-web.vercel.app` sert une
   page titrée « Topset », et `top-set.vercel.app` redirige vers un `/login`.
   Ce sont d'anciens projets Vercel, laissés intacts par principe. S'ils sont à
   toi et ne servent plus, les supprimer évite qu'ils concurrencent le vrai site.

## Écarté, avec la raison

- **Réduire les captures de la page produit** (Lighthouse annonce 45 Ko
  d'économie) : le calcul suppose un écran « 1× ». Sur un téléphone, deux à
  trois pixels par point, les images de 603 px de large sont déjà nécessaires
  pour rester nettes.
- **Contraste du logo** (2,6:1, signalé par Lighthouse) : un logotype est exempté
  par les WCAG, et c'est l'identité de l'app.
