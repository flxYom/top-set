# Stratégie SEO et contenu — TOP SET

> Mémoire stratégique du référencement. À relire avant toute nouvelle page.
> **Dernière analyse : 11 septembre 2026.** Étape en cours : **E, F et G faites** (reste l'inspection dans Search Console) — **H (production) à venir.**

**Objectif** — faire de top-set.fr une ressource de référence en musculation, organisée autour d'un parcours :
**comprendre → apprendre → s'entraîner → suivre → progresser**. L'application reste le produit ; le
contenu répond à de vraies recherches, construit l'autorité du domaine et mène naturellement à l'app.

**Critère de réussite** — pas « 50 pages », mais : chaque page répond à une intention réelle, chaque cluster a
une page pilier, les sources sont vérifiables, les pages sont indexables et rapides, et Search Console dit
quelle page écrire ensuite.

Fichiers liés :

| Fichier | Rôle |
|---|---|
| `sujets.json` | la matrice (source de vérité) : 83 sujets, 8 notes chacun, signaux, statut |
| `matrice.mjs` | calcule les notes, vérifie la cohérence (cannibalisation, champs), génère les deux fichiers ci-dessous |
| `matrice.md` | la matrice classée, avec les signaux sujet par sujet (généré) |
| `inventaire.md` | une ligne par URL : statut, requête, sujets absorbés (généré) |
| `recherche/` | les données brutes, datées : autocomplétion Google, concurrence, PubMed, Lighthouse |
| `../../contenu/` | la source des pages publiées, `sources.json` (bibliographie), `site.json` (rubriques, pages fixes, 404) |
| `../../scripts/contenu.mjs` | le générateur et ses vérifications ; `gabarit.mjs`, le rendu HTML |

---

## A. Architecture actuelle (inspectée le 11/09/2026)

| Point | Constat |
|---|---|
| Framework | aucun. HTML statique, CSS en ligne dans `index.html`, JS dans `app.js` + `intelligence.js` |
| Build | aucun. Vercel sert les fichiers tels quels (`cleanUrls: true`, `trailingSlash: false`) |
| Routage | les « vues » de l'app (planning, séances, récap…) ne sont **pas** des URL : un seul `/` |
| Pages | 5 : `/` (l'app), `/guide`, `/confidentialite`, `/cgu`, `/mentions-legales` |
| Métadonnées | écrites à la main dans chaque `<head>` : title, description, canonical, Open Graph, Twitter |
| Données structurées | `WebSite` sur l'accueil uniquement |
| Assets | police auto-hébergée, icônes générées par script, `legal.css` partagé par les 4 pages annexes |
| PWA | `sw.js` : réseau d'abord pour les pages, chaque page visitée est mise en cache (hors ligne ensuite) |
| CSP | `script-src 'self'` : aucun script en ligne possible, seulement des fichiers servis par le site |
| Publication | `.vercelignore` exclut docs, schéma, tests |

## B. Problèmes SEO, par priorité

**P1 — bloquants**

1. **Aucune page ne répond à une recherche.** Rendu comme Googlebot, l'accueil montre **118 mots** : un
   planning vide daté du jour, et l'écran de création de compte par-dessus. Rien ne dit ce qu'est TOP SET.
   Les 4 autres pages sont le guide et des pages légales.
2. **Le nom est un mot courant.** « top set » est une méthode d'entraînement (forums, coachs) et une barre
   chocolatée (« top set chocolat » dans l'autocomplétion). On ne gagnera pas « top set » contre ces sens :
   il faut devenir la meilleure ressource sur la **méthode**, et que cette ressource montre l'app.
3. **Le domaine n'est pas encore indexé.** Search Console vient d'être configuré ; sitemap soumis le 11/09,
   statut « impossible de récupérer » (courant juste après soumission ; le fichier est valide et servi).

**P2 — importants**

4. **Autorité nulle** : domaine neuf, aucun lien entrant connu (Search Console → Liens le dira).
5. **Deux hôtes à vérifier** : `top-set.vercel.app` redirige vers une page `/login` titrée « Top Set »
   (ancienne version Next.js ?) et `topset-web.vercel.app` répond « Topset ». S'ils sont à nous, ils
   concurrencent la marque ; s'ils ne le sont pas, rien à faire.
6. **Accueil : CLS 0,20** (seuil « bon » : 0,1) — la vue planning bouge au chargement ; performance
   Lighthouse 85. Le guide est à 99. C'est un correctif de l'app, à faire à part, avec précaution.

**P3 — mineurs**

7. Deux `<h1>` sur l'accueil (le logo « TOPSETapp » et « Ton carnet de musculation » dans l'écran d'accueil).
8. Pas de page 404 à nous : Vercel affiche « NOT_FOUND » brut, sans lien pour repartir.
9. Contraste du logo signalé par Lighthouse (un logotype est exempté par les WCAG ; faible priorité).

**Ce qui va bien** (vérifié) : canonical correct sur chaque page ; `top-set.fr` → `www` en 308 ;
`/guide.html` et `/guide/` → `/guide` en 308 ; `http` → `https` ; aucun `noindex` ; `robots.txt` et
`sitemap.xml` valides ; paramètres d'URL couverts par le canonical ; Lighthouse SEO 100/100 sur les deux
pages mesurées ; guide : performance 99, LCP 1,4 s.

## C. Architecture éditoriale recommandée

Le produit reste à `/` (ne rien casser : les téléphones qui ont installé l'app ouvrent `/`). Le contenu
vit à côté, en pages statiques :

| Section | Rôle | Hub |
|---|---|---|
| `/documentation/` | le lexique : une notion, une page (top set, RPE, 1RM, échec…) | `/documentation` |
| `/entrainement/` | principes et méthodes : comment progresser, doser, suivre | `/entrainement` |
| `/exercices/` | les mouvements, sous l'angle « bien faire, puis progresser et suivre » | `/exercices` |
| `/outils/` | calculateurs utiles, reliés au carnet | `/outils` |
| `/carnet-de-musculation` | la page produit : ce que fait TOP SET, pour qui | — |
| `/nutrition/` | **reportée** : sujets de santé, forte concurrence, faible lien produit | — |

`/guide` reste l'aide de l'app (« comment ça marche ») : ce n'est pas du contenu SEO. Quand une notion y
est expliquée (RPE, sauvegarde), le guide renvoie vers la page de documentation au lieu de la dupliquer.

### Clusters et pages piliers

| Cluster | Pilier | Pages secondaires (première vague en gras) |
|---|---|---|
| **Top set & structure des séries** | `/documentation/top-set-musculation` | **back-off set**, séries d'échauffement, drop set, pyramide, rest-pause, superset |
| **Intensité & autorégulation** | `/documentation/rpe-musculation` | **RIR**, **échec musculaire**, **tableau RPE** (outil), intensité vs effort, autorégulation |
| **Charge & force maximale** | `/documentation/1rm-musculation` | **calculateur 1RM** (outil), pourcentages du 1RM, tester son 1RM, record personnel, tonnage |
| **Progression & programmation** | `/entrainement/surcharge-progressive` | **répétitions**, **séries par muscle**, **temps de repos**, **stagnation**, deload, fréquence, périodisation, tempo, amplitude |
| **Suivi & carnet** | `/entrainement/suivre-sa-progression` (méthode) + `/carnet-de-musculation` (produit) | **carnet EPS**, **modèle Excel/CSV** (outil) |
| **Exercices** | `/exercices` (hub) | **planche/gainage**, **développé couché**, **poids de la barre**, squat, soulevé de terre, tractions… |
| Programmes | plus tard | PPL, full body, 5/3/1 — quand l'app aura des modèles de séance |

Maillage : le parcours se lit dans les liens. Exemple : RPE → RIR → échec musculaire → top set → back-off →
1RM → calculateur → carnet. Chaque page a un parent, ses enfants, 3 à 6 notions liées **dans le texte**, et
un lien vers son pilier. Pas de bloc « articles similaires » générique.

## D. Recherche : méthode et limites

Toutes les données sont dans `recherche/`, datées :

| Source | Ce qui a été fait | Fichier |
|---|---|---|
| Autocomplétion Google (FR) | 155 requêtes de départ (sujets × « comment / pourquoi / combien / c'est quoi »), 1 036 suggestions | `suggestions-google-2026-09-11.json` |
| Concurrence | top 10 organique de 32 requêtes clés, annonces exclues | `concurrence-ddg-2026-09-11.json` |
| Pages concurrentes | lecture détaillée des deux pages en tête sur « top set » et d'un outil EPS | notes dans `matrice.md` |
| PubMed | nombre de méta-analyses et revues systématiques par thème (18 thèmes) | `pubmed-revues-2026-09-11.json` |
| Lighthouse | mesure « avant » de `/` et `/guide` (mobile) | `lighthouse-2026-09-11.json` |

**Limites, à dire franchement :**

- **Pas de volumes de recherche.** Aucune source gratuite fiable n'en donne ; la matrice utilise des
  *signaux* (présence et précision des suggestions), jamais de chiffres inventés.
- **La concurrence vient de DuckDuckGo France, donc de Bing — pas du classement Google.** Google a bloqué
  les requêtes automatiques (page « trafic inhabituel ») : on ne contourne pas ce contrôle. Les SERP Google,
  les « Autres questions posées » et Google Trends restent à consulter à la main (voir ci-dessous).
- **Google Trends** a refusé l'accès automatique (erreur 429). Cinq comparaisons à ouvrir à la main,
  2 minutes, pour compléter les signaux :
  - [RPE vs RIR vs échec](https://trends.google.com/trends/explore?date=today%205-y&geo=FR&q=rpe%20musculation,rir%20musculation,%C3%A9chec%20musculaire)
  - [carnet vs application vs suivi](https://trends.google.com/trends/explore?date=today%205-y&geo=FR&q=carnet%20de%20musculation,application%20musculation,suivi%20musculation)
  - [1RM : les formulations](https://trends.google.com/trends/explore?date=today%205-y&geo=FR&q=1rm,calcul%201rm,charge%20maximale%20musculation)
  - [top set vs back off vs drop set](https://trends.google.com/trends/explore?date=today%205-y&geo=FR&q=top%20set,back%20off%20set,drop%20set)
  - [saisonnalité du carnet EPS](https://trends.google.com/trends/explore?date=today%205-y&geo=FR&q=carnet%20de%20musculation%20eps)

**Ce que la recherche a appris** (et qui a changé le plan) :

1. **La niche EPS.** « eps », « bac », « terminale », « lycée » apparaissent sous « carnet de musculation »
   *et* « carnet d'entraînement musculation » : des lycéens doivent tenir un carnet pour l'EPS. En face :
   des PDF d'établissements, Scribd, deux outils EPS (l'un sans bilan ni graphique). TOP SET — gratuit, sans
   compte, exportable — y répond exactement.
2. **Le top set est peu couvert en français.** Un fil de forum, un blog de coach (~850 mots, 0 source), une
   page d'éditeur d'app mi-française mi-anglaise (0 source), puis des vidéos. Aucune méta-analyse n'étudie
   la méthode nommée : la page s'appuiera sur la littérature RPE/RIR, proximité de l'échec et charge, et le
   dira.
3. **Les sujets d'entraînement génériques sont saturés** de « guides complets 2026 » presque identiques et
   rarement sourcés (séries par muscle, temps de repos, surcharge progressive). On n'y gagne qu'avec des
   sources lues, des exemples de salle, et un lien avec ses propres données.
4. **Les pages exercices sont les moins accessibles** (sites établis, Décathlon, Wikipédia). Une seule dans
   la première vague pour valider le gabarit, plus une page au temps (planche) liée à une fonction de l'app.
5. **Un format Excel qui se réimporte.** « carnet de musculation excel » + le CSV de l'app qui se réimporte
   déjà : un modèle au format exact de l'export est un pont direct vers le produit.
6. **Questions pratiques de quiconque note ses charges** : « combien pèse la barre » (développé couché,
   Basic-Fit). Petite page, peu concurrencée, utile au moment de la saisie.

## Méthode de notation

Huit critères notés de 0 à 5 dans `sujets.json` (définitions dans le fichier). Pondération, écrite une
seule fois dans `matrice.mjs` :

| Critère | Poids | Pourquoi |
|---|---|---|
| Demande | ×2 | une page que personne ne cherche ne sert qu'au maillage |
| Pertinence TOP SET | ×1,5 | proximité avec noter / doser / suivre / progresser |
| Accessibilité (concurrence) | ×1,5 | 5 = seulement des forums, 0 = des géants |
| Opportunité de contenu | ×1,5 | peut-on faire nettement mieux que l'existant ? |
| Lien produit | ×1,5 | la page mène-t-elle à une fonction existante ? |
| Autorité thématique | ×1 | |
| Qualité des sources | ×1 | d'après PubMed : ≥ 20 revues = 5 |
| Maillage | ×1 | |

Note = somme pondérée / 55 × 100. Règles de sélection : les sujets `MERGE` (absorbés par une autre page) et
`RETIRED` (risque élevé : questions médicales) ne sont pas classés ; le script refuse deux pages actives sur
la même URL ou la même requête.

## E. Les 20 sujets retenus

Classés par note, puis ajustés (ajustements justifiés sous le tableau). Tout est dans `matrice.md`.

| # | Page | Requête principale | Type | Note |
|---|---|---|---|---|
| 1 | `/documentation/top-set-musculation` | top set musculation | définition, pilier | 91 |
| 2 | `/documentation/1rm-musculation` | 1rm musculation | définition, pilier | 86 |
| 3 | `/documentation/back-off-set` | back off set musculation | définition | 85 |
| 4 | `/documentation/rpe-musculation` | rpe musculation | définition, pilier | 85 |
| 5 | `/entrainement/carnet-musculation-eps` | carnet de musculation eps | guide | 84 |
| 6 | `/entrainement/nombre-de-repetitions` | nombre de répétitions hypertrophie | guide | 84 |
| 7 | `/entrainement/surcharge-progressive` | surcharge progressive musculation | guide, pilier | 83 |
| 8 | `/outils/calculateur-1rm` | calcul 1rm | outil | 82 |
| 9 | `/documentation/rir-musculation` | rir musculation | définition | 79 |
| 10 | `/entrainement/suivre-sa-progression` | suivi progression musculation | guide, pilier | 79 |
| 11 | `/carnet-de-musculation` | carnet de musculation | page produit | 78 |
| 12 | `/entrainement/nombre-de-series-par-muscle` | combien de séries par muscle par semaine | guide | 78 |
| 13 | `/entrainement/temps-de-repos` | temps de repos musculation | guide | 78 |
| 14 | `/documentation/echec-musculaire` | échec musculaire | guide | 77 |
| 15 | `/outils/tableau-rpe` | tableau rpe pourcentage | outil | 77 |
| 16 | `/exercices/planche-gainage` | planche abdos combien de temps | exercice | 74 |
| 17 | `/outils/modele-carnet-musculation` | carnet de musculation excel | outil | 72 |
| 18 | `/entrainement/stagnation` | stagnation musculation | guide | 72 |
| 19 | `/exercices/developpe-couche` | développé couché | exercice | 70 |
| 20 | `/documentation/poids-de-la-barre` | combien pèse la barre développé couché | définition | 65 |

Répartition : 6 fondations (définitions), 7 guides, 3 outils, 2 exercices + 1 référence pratique, 1 page
produit. La recherche a imposé moins d'exercices que l'exemple initial (5–7) : ce sont les pages les moins
accessibles.

**Ajustements par rapport au classement brut :**

- *Pourcentages du 1RM* (76) attend : il fera sans doute un onglet du calculateur 1RM plutôt qu'une page
  (risque de cannibalisation entre trois outils voisins) — décision au pilote.
- *Progresser au développé couché* (75) attend la page exercice, pour ne pas lui faire concurrence.
- *Autorégulation* (73) : aucune demande prouvée ; on attend Search Console.
- *Développé couché* (70) entre pour valider le gabarit « exercice » et nourrir le maillage 1RM / top set.
- *Poids de la barre* (65) entre parce qu'elle est courte, accessible, et sert au moment précis de la saisie.

### Pilote (étape F) : 5 pages très différentes

1. `/documentation/top-set-musculation` — définition pilier, liée au produit, meilleure note.
2. `/outils/calculateur-1rm` — outil ; réutilise les formules déjà testées de `intelligence.js`.
3. `/carnet-de-musculation` — page produit : le texte que l'accueil ne peut pas porter.
4. `/entrainement/carnet-musculation-eps` — guide, niche la plus proche du produit.
5. `/exercices/planche-gainage` — gabarit exercice, sur une fonction de l'app (séries au temps).

Plus l'ossature : les hubs (`/documentation`, `/entrainement`, `/exercices`, `/outils`), une page
« méthode éditoriale », une page 404.

## F. Architecture technique

Principe : **rester un site statique sans framework et sans étape de build côté Vercel.** Un générateur
Node, sans dépendance, transforme des fichiers de contenu en pages HTML qui sont **commitées** ; la CI
vérifie qu'elles sont à jour. Les diffs restent lisibles, le déploiement ne change pas, le site marche
toujours en ouvrant les fichiers.

```
contenu/                          ← source (non publiée)
  sources.json                    ← bibliographie : auteurs, année, titre, revue, DOI, PMID, type, ce qui a été lu
  site.json                       ← rubriques (hubs), pages écrites à la main du plan du site, 404
  documentation/top-set-musculation.html
  entrainement/…  exercices/…  outils/…  carnet-de-musculation.html  methode-editoriale.html
scripts/contenu.mjs               ← générateur + vérifications (non publié)
scripts/gabarit.mjs               ← le rendu : une fonction pour les pages, une pour les hubs
documentation/top-set-musculation.html   ← généré, commité, servi à /documentation/top-set-musculation
documentation/index.html          ← hub généré, servi à /documentation
contenu.css                       ← styles des pages de contenu, mêmes jetons que legal.css
outils/outils.js                  ← JS des calculateurs (fichier externe : CSP)
outils/tableau-rpe.js             ← JS du tableau RPE (même formule, TS.epley)
img/                              ← captures de l'app (WebP) pour la page produit
sitemap.xml                       ← régénéré avec toutes les pages indexables
```

**Format d'un contenu** : un fichier HTML dont le premier commentaire contient les métadonnées en JSON —
`type`, `title`, `description`, `h1`, `fil` (fil d'Ariane), `lede` (chapeau), `primaryQuery`, `published`,
`reviewed`, `relu`, `ordre`, `keyPoints`, `related`, `sources` (ce que chaque source soutient ici), et selon
le type `termes`, `fiche`, `sommaire`, `scripts`, `captures`. La rubrique et l'adresse viennent du chemin du
fichier. Le corps est du HTML simple avec deux conventions :

- `[[/documentation/rpe-musculation|l'échelle RPE]]` → lien interne vérifié, par son chemin complet (le
  générateur échoue si la page n'existe pas) ;
- `[@zourdos2016]` → appel de note numéroté, relié à l'entrée de `sources.json` (le générateur échoue si la
  source n'existe pas, ou si une source est listée sans être citée).

**Ce que le gabarit produit, pour chaque page** : `<title>`, description, canonical, Open Graph, Twitter,
un seul H1, fil d'Ariane visible, sommaire (depuis les H2), sections, points clés, notions liées, sources
numérotées et lisibles (« ce qu'elles soutiennent »), date de vérification, auteur, appel vers l'app quand
il est pertinent, et le JSON-LD :

- `BreadcrumbList` sur toutes les pages de contenu ;
- `Article` sur les définitions et guides (titre, dates, auteur, éditeur) ;
- `SoftwareApplication` sur `/carnet-de-musculation` seulement — il décrit fidèlement la page ; sans avis
  ni note, Google n'en tire pas de résultat enrichi, et on ne le promet pas ;
- **pas de `FAQPage`**. Des questions/réponses peuvent exister pour le lecteur, sans balisage.

**Le gabarit de chaque type, vérifié** (mise en conformité du 11/09, sections 9, 11, 12 et 19 du brief).
Les sections obligatoires sont repérées par l'identifiant de leur H2 ; le titre reste libre.

| Type | Sections obligatoires (`id`) | Blocs |
|---|---|---|
| Définition | `definition`, `utiliser`, `exemples`, `erreurs` | au moins 3 **termes associés** (`termes`) ; un terme dont le sujet est publié devient un lien, tout seul |
| Exercice | `execution`, `erreurs`, `variantes` | **fiche** : muscles, matériel, niveau, mouvement (amplitude et trajectoire), respiration, avant le sommaire ; au moins une notion liée, et un exercice lié dès qu'une autre fiche existe |
| Guide, outil | libres | — |

« À lire ensuite » affiche la rubrique de chaque page liée (notion, exercice, outil, le carnet) : c'est la
séparation « notions liées / exercices liés » du brief, sans titres vides tant qu'une rubrique n'a qu'une
page. `test/contenu.test.mjs` retire chacun de ces éléments à une copie du site et vérifie le refus.

**Vérifications automatiques** (échec = pas de publication) : titres (≤ 60) et descriptions (110–160)
bornés et uniques sur tout le site, pages écrites à la main comprises ; un seul H1 ; liens internes
résolus ; chaque source citée existe et dit ce qu'elle soutient ici ; aucune source listée sans être
citée ; pas de script, de style ni de gestionnaire d'événement en ligne ; poids par page ; la page
correspond à un sujet `PUBLISHED` de la matrice, sur la même requête, avec la même date de revue ;
sections, termes et fiche exigés par le type ; fichiers générés à jour. `html-validate` et `test/liens.test.mjs` (liens, casse, ancres, et chaque
page à deux clics de l'accueil) complètent en CI.

**Rubriques** : une rubrique n'est indexable qu'à partir de **3 pages**. En dessous, sa page existe (fil
d'Ariane, navigation) mais porte `noindex,follow` et reste hors du plan du site : une liste d'un lien
serait une page mince.

**Apprendre, rubrique principale** (demande du 11/09) : `/apprendre` regroupe les quatre rubriques, la
page produit et la méthode, avec toutes leurs pages ; toujours indexable. Dans l'app, c'est le
4e onglet (écran fixe de six cartes, rien de stocké). Sur chaque page de contenu, une barre des rubriques
sous l'en-tête ; le fil d'Ariane est Accueil › Apprendre › rubrique › page.

**Intégration à l'existant, sans toucher à l'app :**

- dans l'app, un onglet **APPRENDRE** (vue fixe, rien de stocké) et un lien de pied de page, tous deux
  vers `/apprendre` : toutes les pages à 2 gestes de l'accueil ;
- `sw.js` : aucune logique à changer (réseau d'abord, chaque page visitée consultable hors ligne) ; à
  surveiller : le cache des pages visitées n'a pas de limite — à borner si le site grossit ;
- `.vercelignore` : ajouter `contenu/`, `scripts/` (`docs/` l'est déjà) ;
- CI : générateur en mode vérification, `html-validate` sur les sous-dossiers, `test/liens.test.mjs`
  étendu aux pages imbriquées (il ne lit aujourd'hui que la racine).

**Budget de performance par page de contenu** : HTML ≤ 30 Ko compressé, CSS partagée ≤ 8 Ko, aucun JS
hors outils, images en `loading="lazy"` avec dimensions, LCP < 2 s et CLS < 0,05 au Lighthouse mobile.
Mesure avant/après à chaque étape.

**Illustrations** : schémas SVG dessinés pour chaque page, dans la charte, écrits directement dans la
page (aucune requête de plus) avec un titre accessible — profil de charge top set / back-off, position
et erreurs de la planche. **Pas de photos** pour l'instant (décision du 11/09) : des schémas pour les
exercices, et de vraies captures de l'app (carnet de démonstration, WebP, 18 à 27 Ko) pour la page
produit. Pour chaque image : objectif pédagogique, texte alternatif, dimensions, poids ≤ 60 Ko.

## Crédibilité (E-E-A-T) et IA

- Chaque page : signature « Par Yom Industry × Claude (Anthropic) », date de publication, date de
  vérification des sources, sources. « Relu par Yom Industry le … » ne s'affiche que quand le champ
  `relu` est rempli dans la source : la relecture humaine n'est jamais annoncée avant d'avoir eu lieu.
- JSON-LD `Article` : l'auteur est l'organisation Yom Industry (l'éditeur). L'IA est nommée dans la
  signature visible et expliquée sur `/methode-editoriale`, pas déclarée comme auteur dans les données
  structurées.
- Une page `/methode-editoriale` : comment un sujet est choisi, recherché, sourcé, relu ; ce que l'IA fait
  (recherche, structure, brouillon) et ce qu'elle ne fait pas (être une source) ; comment signaler une
  erreur.
- Aucun titre revendiqué qu'on n'a pas (médecin, chercheur, diététicien). Sujets de santé : prudence,
  renvoi vers un professionnel.
- **Chaque source indique ce qui a été lu** : résumé seul, ou texte intégral. On ne cite pas un article
  qu'on n'a pas ouvert.
- Chaîne obligatoire pour un contenu scientifique : **recherche → vérification → source → rédaction →
  contrôle**. Pas de publication en masse : 15 pages vérifiées valent mieux que 150 superficielles.

## G. Plan d'implémentation

| Étape | Contenu | Livrable | Contrôle |
|---|---|---|---|
| A. Audit | fait | ce document | — |
| B. Recherche | fait | `recherche/` | — |
| C. Notation | fait | `sujets.json`, `matrice.md` | `matrice.mjs --verifier` |
| D. Architecture | fait, validé le 11/09 | sections C et F ci-dessus | — |
| E. Infrastructure | fait le 11/09 : générateur, gabarit, `contenu.css`, hubs, 404, méthode éditoriale, lien « Apprendre », CI | pages hub en ligne | tests + Lighthouse + app intacte (tous les tests existants) |
| F. Pilote | fait le 11/09 : les 5 pages, 14 sources ouvertes une à une | 5 pages publiées | relecture par toi : en ligne, avant l'indexation (le domaine n'est pas encore indexé) ; chaque page relue reçoit son champ `relu` |
| E bis. Gabarits | fait le 11/09 : sections obligatoires par type, termes associés, fiche d'exercice, rubrique des pages liées ; page top set complétée (séries classiques et pyramide, RPE/RIR, charge depuis le 1RM, avantages, limites, erreurs, suivi dans le temps ; 1 source de plus : Helms 2016, texte sur PMC) ; fiche de la planche | pages mises à jour | `test/contenu.test.mjs` (15), tous les tests, mobile 360 px, Lighthouse en production : top set 100/100/100/100, LCP 1,3 s (une première mesure à 98) ; planche 100, LCP 1,2 s (`recherche/lighthouse-2026-09-11-gabarits.json`) |
| G. Validation | fait le 11/09 : mobile et ordinateur, console (CSP comprise), routes et 404, canonical, sitemap, Lighthouse en production — 100/100/100/100 sur les pages de contenu, LCP 1,2 s, CLS ≤ 0,002 (`recherche/lighthouse-2026-09-11-pilote.json`). **Reste, côté Google** : Test des résultats enrichis sur une page (JSON-LD), Inspection d'URL et demande d'indexation dans Search Console | rapport de validation | seuils du budget |
| H. Production | les 15 autres pages, par cluster (pilier d'abord), par lots de 3 publiés un par un. **Lot 1 (intensité) fait le 11/09** : RPE (pilier), RIR, échec musculaire — 10 sources de plus, résumés lus, DOI vérifiés. **Lot 2 (charge) fait le 11/09** : 1RM (pilier), back-off set, tableau RPE (outil calculé avec la formule de l'app, comparé aux mesures de Nuzzo 2024) — 6 sources de plus. **Lot 3 (progression) fait le 11/09** : surcharge progressive (pilier), nombre de répétitions, séries par muscle — appuyé sur la position ACSM 2026 (lue sur PMC), 7 sources de plus. **Lot 4 (suivi) fait le 11/09** : temps de repos, stagnation, suivre sa progression (pilier suivi) — 7 sources de plus | ~3 pages par lot | idem + inventaire à jour |

## H. Risques

| Risque | Parade |
|---|---|
| Régression de l'app / PWA | l'app n'est pas touchée (un lien dans le pied de page) ; tous les tests existants tournent ; `sw.js` inchangé |
| Cache hors ligne qui grossit | chaque page visitée est gardée ; borner le cache `COURANT` quand le site dépasse quelques dizaines de pages |
| Performance | pages statiques sans JS, budget chiffré, Lighthouse avant/après |
| Duplication avec le guide | le guide garde l'aide de l'app et renvoie vers la documentation |
| Cannibalisation | une requête = une page, contrôlé par `matrice.mjs` ; paires surveillées : RPE/RIR, répétitions/force-ou-hypertrophie, 1RM/calculateur/pourcentages, échauffement/séries d'échauffement, développé couché/progresser au développé couché, carnet/suivre sa progression, accueil/page produit (le titre de l'accueil contient « carnet de musculation » : surveiller dans Search Console quelle page Google choisit) |
| Contenu faible | pas de page sans sources lues et sans exemple concret ; relecture avant publication |
| Sujets santé | exclus de la première vague (douleurs : retirés) ; nutrition reportée |
| Dépendances | aucune : générateur en Node pur |
| Maintenance | date de vérification sur chaque page ; revue des pages de plus de 12 mois ; inventaire généré |
| Droits | aucune reprise de texte ni d'image d'autrui ; les méthodes d'auteurs (5/3/1) sont citées, pas reproduites |

## Boucle Search Console (dès que des données existent, puis chaque mois)

1. Exporter Performances → Requêtes et Pages (28 derniers jours) dans `docs/seo/search-console/AAAA-MM-*.csv`.
2. Classer :
   - **Opportunité 1** — position 4 à 15 avec des impressions régulières → enrichir la page, le titre, le maillage ;
   - **Opportunité 2** — beaucoup d'impressions, CTR faible → retravailler titre, description, adéquation à l'intention ;
   - **Opportunité 3** — requête pertinente sans page → nouveau sujet dans `sujets.json` ;
   - **Opportunité 4** — page visitée mais quittée vite → contenu ou UX ;
   - **Opportunité 5** — deux pages sur la même requête → fusionner ou différencier.
3. Mettre à jour `sujets.json` (statuts, notes de demande réelles), régénérer, noter la décision ci-dessous.

Tant que le site est neuf, les seuils sont bas (quelques dizaines d'impressions) : on cherche des tendances,
pas des certitudes.

## Décisions prises (11/09/2026)

1. **Auteur affiché** : « Yom Industry × Claude (Anthropic) ». Aucune expérience ni aucun titre revendiqué.
2. **Mention de l'IA** : oui, expliquée sur `/methode-editoriale`.
3. **Photos d'exercices** : non — schémas dessinés et captures de l'app.
4. **Le pilote** : validé, les 5 pages.
5. **Les deux hôtes vercel.app** sont à toi. Vérifié le 11/09 : ce sont deux **autres projets Vercel**,
   pas ce site — `top-set.vercel.app` (ancienne app Next.js, redirige vers `/login`, « Hypertrophy
   training. Built for lifters. ») et `topset-web.vercel.app` (ancienne app React, une `<div>` vide pour
   les robots). Ce site-ci répond sur `top-set-yom-nutrition.vercel.app`, déjà en `noindex` d'office.
   À faire côté Vercel, par toi : si ces deux projets ne servent plus, les supprimer, ou rediriger leur
   domaine vers `www.top-set.fr`.

## Journal des décisions

| Date | Décision |
|---|---|
| 11/09/2026 | Le produit reste à `/` ; le contenu en pages statiques générées et commitées, sans framework ni build Vercel. |
| 11/09/2026 | Pas de volumes inventés : notes sur signaux, sources de données versionnées dans `recherche/`. |
| 11/09/2026 | Nutrition reportée ; questions de douleur exclues. |
| 11/09/2026 | Pas de `FAQPage` ; `SoftwareApplication` seulement sur la page produit. |
| 11/09/2026 | Pilote de 5 pages avant toute production. |
| 11/09/2026 | Signature « Yom Industry × Claude (Anthropic) » ; l'IA n'est pas un auteur dans le JSON-LD. |
| 11/09/2026 | Pas de photos : schémas SVG dans la page, captures de l'app pour la page produit. |
| 11/09/2026 | Rubriques indexables à partir de 3 pages. |
| 11/09/2026 | Apprendre devient une rubrique principale : 4e onglet de l'app, page `/apprendre`, barre des rubriques sur chaque page (au lieu d'un lien de pied de page). |
| 11/09/2026 | Pilote publié avant la relecture humaine, parce que le domaine n'est pas encore indexé ; la mention « relu » attend la relecture réelle. |
| 11/09/2026 | Le calculateur de 1RM charge `intelligence.js` : même formule (Epley) et même limite (12 répétitions) que le carnet. |
| 11/09/2026 | Séries par muscle : la page dit comment le récap de l'app compte (toutes les séries remplies, échauffements compris, un groupe par exercice) plutôt que de le faire passer pour un décompte de séries dures. Le guide disait que le graphique d'un exercice montrait « tes charges » : il montre le 1RM estimé du top set, corrigé. |
| 11/09/2026 | Tableau RPE : calculé (Epley + répétitions en réserve, comme le calculateur et l'app) plutôt que recopié d'une table sans source ; 1 répétition à RPE 10 = 100 % ; affiché à côté des mesures réelles (Nuzzo 2024), qui montrent que la formule est prudente. Les pourcentages du 1RM (sujet `pourcentages-1rm`) restent dans le calculateur et ce tableau : pas de page de plus. |
| 11/09/2026 | Production par lots à la demande du propriétaire (« fais les autres aussi ») : chaque lot de 3 pages a ses sources ouvertes une à une et passe toute la validation avant d'être publié ; pas de publication en masse. RPE et RIR sans cannibalisation : la page RPE présente l'échelle et son usage, la page RIR la façon d'estimer juste. |
| 11/09/2026 | Gabarits vérifiés par le générateur : une définition sans erreurs fréquentes ni termes associés, un exercice sans fiche, ne se génèrent pas. Origine du mot « top set » : non datée, on le dit plutôt que d'inventer ; la recherche l'emploie tel quel (Helms et al. 2018). |
