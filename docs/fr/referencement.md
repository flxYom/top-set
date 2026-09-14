> **Français** · [English](../en/seo.md)

# Référencement

Une partie de la [documentation de Top Set](../../README.fr.md#documentation).

## Le référencement

**Accueil : la police arrive avant le premier rendu.** Lighthouse (mobile,
production, 12 septembre 2026) mesurait sur l'accueil un décalage de mise en
page de 0,101, juste au-dessus du seuil « bon » de 0,1 : le texte s'affichait
d'abord dans la police du système, puis se recomposait à l'arrivée de Bricolage.
La police latine est désormais préchargée (`<link rel="preload">`), et un
garde-fou vérifie qu'elle est bien celle que la page demande — sinon le
navigateur la téléchargerait deux fois. Remesuré après déploiement, trois passages :
CLS 0 puis 0,088 et 0,088, performance 93 à 95 (au lieu de 92), premier affichage
1,9 à 2,0 s (au lieu de 2,3). Le décalage restant vient du panneau du jour. L'accueil n'a plus qu'un `<h1>` : le logo
de l'en-tête est un paragraphe.

Ce que le code peut faire est fait :

- un **titre** qui dit ce qu'est l'app — « Top Set — carnet de musculation
  gratuit » — et pas seulement son nom. « Top Set » tout court est aussi le nom
  d'une méthode d'entraînement : les forums qui en parlent passent devant ;
- une **description** de moins de 160 caractères, la longueur au-delà de
  laquelle Google coupe ;
- le **nom du site** déclaré en données structurées (`WebSite`), pour que Google
  affiche « Top Set » au-dessus du résultat plutôt que l'adresse ;
- un **favicon** de 48 px et un `favicon.ico`, générés comme les autres icônes ;
- `robots.txt`, qui autorise tout et indique le plan du site, et
  `sitemap.xml`, qui liste les pages indexables avec leur date de mise à jour —
  il est produit par le générateur des pages de contenu ;
- un lien canonique par page, et `top-set.fr` qui redirige vers
  `www.top-set.fr` : une seule adresse par page, pas de contenu en double.

`test/gabarits.test.mjs` vérifie la longueur du titre et de la description, le
bloc `WebSite`, le favicon et le plan du site.

**La stratégie de contenu** vit dans [`docs/seo/content-strategy.md`](../seo/content-strategy.md) :
l'audit, les clusters et leurs pages piliers, la méthode de notation, les 20 sujets retenus, l'architecture
technique, les risques et la boucle Search Console. La matrice (`docs/seo/sujets.json`, 83 sujets)
est la source de vérité ; `node docs/seo/matrice.mjs` en déduit les notes et régénère la matrice classée
et l'inventaire, et refuse deux pages qui viseraient la même URL ou la même requête. Les données de
recherche sont versionnées et datées dans `docs/seo/recherche/` : suggestions de Google, concurrence,
nombre de revues PubMed par thème, mesure Lighthouse. Aucun volume de recherche n'y est inventé.

Le reste ne se fait pas dans le code. Tant que le domaine n'a pas été déclaré
dans **Google Search Console**, Google ne le découvre que par hasard, par un lien
venu d'ailleurs. La déclaration se fait une fois, par un enregistrement DNS chez
OVH, puis on y soumet `https://www.top-set.fr/sitemap.xml`. L'indexation prend
ensuite quelques jours à quelques semaines. Se classer sur « carnet de
musculation » demande autre chose que des balises : du temps, des liens venus
d'autres sites, et des pages qui répondent à ce que les gens cherchent : c'est
le rôle des pages de contenu.

### Les pages de contenu

Le site ne se résume plus à l'app. À côté d'elle, des pages statiques
répondent à de vraies recherches : une notion par page dans `/documentation`,
des guides dans `/entrainement`, des exercices dans `/exercices`, des
calculateurs dans `/outils`, plus une page produit (`/carnet-de-musculation`)
et une page qui dit comment elles sont faites (`/methode-editoriale`). Tout est
regroupé sous une rubrique principale, **Apprendre** (`/apprendre`), qui liste
chaque rubrique et chacune de ses pages.

Dans l'app, Apprendre est un **quatrième onglet**, à côté de PLANNING, SÉANCES
et RÉCAP : un écran fixe de six cartes (documentation, entraînement, exercices,
outils, le carnet, la méthode) et un bouton vers `/apprendre`. Il n'enregistre
rien et ne calcule rien — la vue courante n'est pas stockée, et le rendu
s'arrête là au lieu de retomber sur le récap. Sur les pages, une barre reprend
ces rubriques sous l'en-tête, avec la rubrique courante allumée comme un onglet
de l'app, et le fil d'Ariane passe par Apprendre. Le service worker n'a pas
changé : chaque page visitée reste lisible hors ligne, comme le guide.

Pages publiées : le top set, le calculateur de 1RM, la page produit, la
planche ; puis, par lots de trois, l'échelle RPE,
le RIR et l'échec musculaire ; le 1RM, le back-off set et le tableau RPE ; la
surcharge progressive, le nombre de répétitions et le nombre de séries par muscle ;
le temps de repos, la stagnation et suivre sa progression ; le développé couché,
le poids de la barre et un modèle de carnet pour Excel. Une page sur le carnet
d'EPS des lycéens a été publiée puis retirée : ce n'est pas le public de Top Set.
Son adresse redirige définitivement vers `/carnet-de-musculation` (`redirects`
dans `vercel.json`), et son sujet est `RETIRED` dans la matrice.

**Comment elles sont fabriquées.** Toujours pas de framework ni d'étape de
construction chez Vercel. Chaque page a sa source dans `contenu/` : un fichier
HTML dont le premier commentaire porte les métadonnées en JSON (titre,
description, requête visée, dates, points clés, pages liées, ce que chaque source
soutient). `node scripts/contenu.mjs` en fait les pages publiées, les rubriques,
la 404 et `sitemap.xml` ; les pages produites sont commitées, et le diff d'une
page se relit comme du texte. Deux conventions dans le corps :

- `[[/outils/calculateur-1rm|le calculateur]]` — un lien interne, vérifié ;
- `[@helms2018stop]` — un appel de source numéroté, relié à
  `contenu/sources.json`.

Le gabarit (`scripts/gabarit.mjs`) écrit ce qu'une page ne doit pas pouvoir
oublier : title, description, canonical, Open Graph, fil d'Ariane, signature,
sommaire, sources numérotées et le JSON-LD — `BreadcrumbList` partout,
`Article` sur les définitions, guides et exercices, `SoftwareApplication` sur la
page produit seulement, jamais de `FAQPage`.

**Ce que chaque type de page contient.** Le générateur connaît le gabarit de
chaque type, et refuse une page qui en oublie une partie :

- une **définition** a ses sections « ce que c'est », « comment s'en servir »,
  « exemples » et « erreurs fréquentes », repérées par l'identifiant de leur
  titre (`<h2 id="erreurs">` ; le titre lui-même reste libre), et au moins trois
  **termes associés** dans son champ `termes`. Un terme dont le sujet est publié
  dans la matrice devient un lien vers sa page, tout seul, le jour où elle
  paraît ;
- un **exercice** a sa **fiche** (muscles, matériel, niveau, mouvement,
  respiration), affichée avant le sommaire et dont les sources sont numérotées
  comme le reste ; ses sections « position et exécution », « erreurs
  fréquentes » et « variantes » ; au moins une notion liée, et un autre exercice
  lié dès qu'au moins trois autres fiches existent (avant, le lien serait
  artificiel : le développé couché n'a rien à voir avec la planche).

« À lire ensuite » affiche la rubrique de chaque page liée. `test/contenu.test.mjs`
retire ces éléments à une copie du site et vérifie que le générateur refuse bien,
en disant ce qui manque.

**Ce que le générateur refuse** (et la CI avec lui, `--verifier`) : une source
citée qui n'est pas dans la bibliographie, ou citée sans dire ce qu'elle soutient
ici ; un lien vers une page qui n'existe pas ; un titre de plus de 60 caractères,
une description hors de 110 à 160, un titre ou une description en double avec une
autre page du site ; une page qui dépasse 30 Ko compressés (la feuille de style,
8 Ko) ; un script ou un style en ligne ; une page dont le sujet n'est pas
`PUBLISHED` dans la matrice, ou qui ne vise pas la même requête qu'elle ; un
fichier généré qui n'est plus à jour. Une rubrique n'est indexable qu'à partir de
trois pages : en dessous, elle existe mais reste hors du plan du site.

**Les sources.** `contenu/sources.json` ne contient que des sources réellement
ouvertes : DOI vérifié sur Crossref, résumé lu sur PubMed, texte intégral quand il
est libre, texte officiel pour une règle (le règlement de force athlétique pour
le poids d'une barre). Le champ `lu` dit ce qui a été lu, et la
page l'affiche.

**La signature.** « Par Yom Industry × Claude (Anthropic) » : l'aide de l'IA est
dite en toutes lettres, et `/methode-editoriale` explique ce qu'elle fait et ne
fait pas. Dans les données structurées, l'auteur est Yom Industry, l'éditeur. La
mention « relu par Yom Industry le … » n'apparaît que quand le champ `relu` est
rempli dans la source de la page.

**Ajouter une page** : écrire `contenu/<rubrique>/<page>.html`, ajouter ses
sources à `contenu/sources.json`, passer son sujet à `PUBLISHED` avec
`last_review` dans `docs/seo/sujets.json`, puis :

```bash
node scripts/contenu.mjs
```

```bash
node docs/seo/matrice.mjs
```
