> **Français** · [English](../en/technical.md)

# Technique

Une partie de la [documentation de Top Set](../../README.fr.md#documentation).

## La pile technique

Aucun framework. Aucun bundler. Aucune dépendance à installer. Rien à compiler
pour travailler : la source est servie telle quelle en local. Une seule étape au
déploiement, la minification (voir [Déployer](#déployer)).

Un fichier HTML avec le CSS en ligne, plus des fichiers statiques.
`index.html` pèse environ 204 Ko, dont à peu près 119 Ko de texture en base64 ;
le JavaScript de l'app vit à côté, dans `app.js` (237 Ko), et la logique métier
testée dans `intelligence.js` (31 Ko).

**Pourquoi le JS n'est pas en ligne, lui.** Il l'a été jusqu'à l'audit de
sécurité. Un script en ligne oblige à écrire `script-src 'self' 'unsafe-inline'`
dans la politique de sécurité de contenu — et cette permission-là autorise aussi
les gestionnaires d'événements injectés. Un XSS trouvé pendant cet audit
s'exécutait précisément grâce à elle. Sans étape de build, il n'existe pas de
`nonce` possible sur un hébergement statique : sortir le script est la seule
façon de passer à `script-src 'self'`. Il est chargé à la même place, en fin de
`<body>`, donc l'ordre d'exécution ne change pas.

`style-src` garde `'unsafe-inline'`, et c'est assumé : les cartes portent un
attribut `style="--card-color:…"`, une injection de style ne peut pas exécuter
de script, et sortir la feuille de style ne supprimerait pas le besoin.

Deux bibliothèques, chacune chargée seulement quand elle sert : Chart.js 4.4.1 la
première fois qu'on ouvre un graphique de progression, supabase-js 2.115.0 quand
un compte entre en jeu.

C'est un choix assumé pour une app de cette taille : aucune chaîne d'outils à
maintenir, aucune dérive de versions, et l'ensemble s'ouvre, se lit et se modifie
dans un seul fichier.

---

## Structure du projet

```
index.html               balisage et styles de l'app
app.js                   toute la logique de l'app (sortie du HTML pour la CSP)
intelligence.js          logique métier pure : top set, records, 1RM, signaux
sw.js                    service worker — coquille en cache, hors-ligne
supabase-config.js       URL du projet + clé publique (voir Comptes et Supabase)
manifest.webmanifest     manifeste PWA
vercel.json              en-têtes de sécurité, cache, redirections, étape de build (build.mjs → dist/)
build.mjs                construit dist/ : copie des fichiers servis, JS de l'app minifié
robots.txt  sitemap.xml  indexation ; le plan du site est produit par scripts/contenu.mjs
favicon.ico              16 + 32 + 48 px, à la racine où les navigateurs le cherchent

guide.html  cgu.html  confidentialite.html  mentions-legales.html
                         pages fixes, stylées par css/legal.css
apprendre.html  carnet-de-musculation.html  methode-editoriale.html  404.html
documentation/  entrainement/  exercices/  outils/
                         pages de contenu et leurs rubriques (générées depuis contenu/, commitées)
outils/*.js              calculateurs (fichiers externes : la CSP refuse le script en ligne)
outils/*.csv             modèle de carnet vierge et exemple, au format de l'export

css/                     legal.css (pages fixes) et contenu.css (pages de contenu)
icons/                   icon.svg, favicons 16/32/48 px, icônes 180/192/512 px (écran d'accueil, PWA)
img/                     og-image.png (aperçu de partage, 1200×630), captures de la page produit,
                         hero/ (dessins du bandeau, SVG), ambiance/ (images d'ambiance, WebP)
fonts/                   Bricolage Grotesque, auto-hébergée (latin + latin-ext)
vendor/                  Chart.js 4.4.1 et supabase-js 2.115.0, chargés à la demande

contenu/                 source des pages de contenu, bibliographie, rubriques (non publié)
scripts/                 générateur des pages de contenu, vérificateur de la palette (non publiés)
supabase/schema.sql      tables, politiques RLS et fonctions de synchro
supabase/test/           le schéma testé sur un vrai Postgres (PGlite) : RLS, montée depuis chaque version
test/                    logique métier, gardes de sécurité, liens, gabarits de contenu
docs/                    documentation détaillée (fr/, en/), design system, SEO, audits, captures
.github/                 CI, modèles d'issues, CONTRIBUTING.md, SECURITY.md
README.md  README.fr.md  CHANGELOG.md  LICENSE
```

Les icônes et l'image de partage sont générées à partir de leur géométrie par un
script plutôt que dessinées à la main : changer une couleur de marque, c'est
changer une valeur et relancer. Ce script vit hors du dépôt, avec les sources du
logo.

Tout ce qui est dans le dépôt n'est pas une page du site : `.vercelignore` écarte
la documentation, le schéma, les tests, et la source des pages de contenu
(`contenu/`, `scripts/`) dont seules les pages produites sont servies. Avant, `top-set.fr/supabase/schema.sql`
était lisible par n'importe qui — rien de secret, la sécurité tient à RLS et pas
au secret du schéma, mais rien à servir non plus.

---

## Comptes et Supabase

Les comptes sont **facultatifs**. Sans `supabase-config.js` — ou avec
`window.TOPSET_SUPABASE` à `null` — le profil dit que les comptes ne sont pas
disponibles, la bulle des messages disparaît, et l'app est un carnet purement
local. Rien ne casse, aucun bouton mort.

Il n'y a **aucune variable d'environnement** (l'étape de build ne fait que
minifier) : un site
statique n'a pas de serveur pour les lire. Les deux valeurs vivent dans
`supabase-config.js`, versionné dans ce dépôt, et c'est correct — les deux sont
publiques par conception :

```js
window.TOPSET_SUPABASE = {
  url:     'https://<ref-du-projet>.supabase.co',
  anonKey: '<la clé anon / publishable>'
};
```

La clé anon identifie le projet, elle ne donne pas d'accès : chaque requête est
filtrée par le Row Level Security sur l'utilisateur connecté. Ce qui ne doit
**jamais** figurer ici, ni nulle part dans Git : la clé `service_role` (ou
`secret`), qui contourne RLS, et le mot de passe de la base.

### Configurer son propre projet

1. **supabase.com/dashboard → New project.** Choisis une région proche de tes
   utilisateurs.
2. **SQL Editor → New query** → colle [`supabase/schema.sql`](../../supabase/schema.sql)
   → Run. Le script est idempotent : le relancer ne change rien et n'efface rien.
3. **Authentication → Sign In / Providers → Email** : active le provider. Laisse
   *Confirm email* désactivé tant que l'envoyeur par défaut de Supabase est en
   place — il envoie 2 messages par heure, ce qui bloquerait les inscriptions.
   Réactive-le une fois un vrai SMTP configuré.
4. **Project Settings → API** : recopie l'URL du projet et la clé anon dans
   `supabase-config.js`.
5. Ajoute ton origine Supabase au `connect-src` de `vercel.json`, sinon le CSP
   bloque toutes les requêtes — en silence, comme le fait un CSP.

### Tester le schéma

Les règles de la base sont testées contre un vrai Postgres (PGlite), pas simulées :

```bash
cd supabase/test && npm install && npm test
```

`test-rls.mjs` attaque les règles depuis le rôle `authenticated`, comme le
ferait le navigateur : écriture, journée rejouée sans doublon, isolation entre
utilisateurs, lien coach, messagerie, notifications, visiteur anonyme, cascade à
la suppression du compte.

`test-montee.mjs` installe **chaque version passée** du schéma sur une base
neuve, y met des données, puis passe la version actuelle deux fois. La base de
production n'est jamais vide, et c'est là que ça casse : une fonction dont les
colonnes de retour changent passe sur une base neuve, et Postgres refuse de la
« remplacer » sur la vraie. Dans l'éditeur SQL de Supabase, cette seule erreur
annule tout le script, sans que rien ne le dise. C'est arrivé une fois ; les
fonctions qui renvoient un tableau sont désormais supprimées avant d'être
recréées, et ce test tourne dans la CI avec l'historique complet.

Le même fichier refuse de s'exécuter ailleurs que dans le projet Top Set. Ce
compte Supabase héberge aussi Yom Nutrition, et y coller le schéma donnait une
erreur de colonne manquante qui ne nommait ni le projet ni la méprise. Une garde
en tête de fichier s'arrête désormais net, avant la première écriture, dès
qu'elle reconnaît les tables de l'autre base : tout le script est une seule
transaction, donc rien n'y est écrit, et l'autre projet repart intact.

---

## Le lancer en local

N'importe quel serveur de fichiers statiques. Il n'y a rien à compiler : la
source se sert telle quelle. Pour voir le site exactement comme en ligne
(JavaScript minifié), `node build.mjs` puis `npx serve dist`.

```bash
npx serve .
```

Ouvrir `index.html` directement fonctionne aussi — la seule chose qui casse en
`file://`, c'est le manifeste PWA.

---

## Déployer

Conçu pour de l'hébergement statique. Sur Vercel : importer le dépôt, choisir
**Other** comme framework, déployer. `vercel.json` s'occupe des en-têtes et du
cache, `.vercelignore` de ce qui ne doit pas être publié.

**L'étape de build (18/09/2026).** Vercel lance `node build.mjs` et sert
`dist/` (`buildCommand` et `outputDirectory` dans `vercel.json`). Le script
copie exactement les fichiers servis — le dépôt moins `.vercelignore` et la
configuration — puis minifie `app.js`, `intelligence.js`, `mesure.js` et
`supabase-config.js` avec esbuild (version épinglée dans le script). `app.js`
passe de 92 à 51 Ko compressés. Rien d'autre n'est réécrit : pas de bundle, pas
de transpilation, les noms globaux partagés entre les fichiers restent intacts,
et `sw.js` n'est pas touché (sa `VERSION` reste lisible en ligne). Si le build
échoue, Vercel garde la version précédente en ligne. Pour tester avant de
pousser : `node build.mjs && npx serve dist`.

Le site vit sur `top-set.fr`, qui redirige vers `www.top-set.fr`. Le domaine est
écrit en dur dans les balises Open Graph, les liens canoniques, `robots.txt` et
`sitemap.xml` ; le script qui le remplaçait partout a servi une fois, au passage
du domaine provisoire au vrai, et a été retiré.

**À chaque mise en ligne qui touche l'app**, la version du service worker
(`VERSION` dans `sw.js`) avance d'un cran : c'est ce qui dit aux téléphones de
remplacer la coquille gardée en cache.

---

## L'installer sur un téléphone

C'est une PWA : elle s'installe sans passer par un store, obtient son icône et
s'ouvre en plein écran.

**iPhone (Safari)** — Partager, puis *Sur l'écran d'accueil*.
**Android (Chrome)** — menu, puis *Installer l'application*.

Ça vaut le coup sur iPhone pour une raison qui dépasse le confort : Safari peut
effacer le `localStorage` d'un site non visité depuis environ une semaine, mais
pas celui d'une app posée sur l'écran d'accueil.

**Hors connexion.** Un service worker garde la coquille de l'app : elle s'ouvre
sans réseau, dans une salle au sous-sol, et le carnet est dans le
`localStorage`. La page passe d'abord par le réseau pour que tu aies toujours la
dernière version, et rien de ce qui vient de Supabase n'est mis en cache.

**Captures dans le manifeste.** `manifest.webmanifest` déclare les trois
captures de la page produit (`screenshots`, `form_factor: narrow`), un `id` et
des catégories : sur Android, Chrome s'en sert pour une fenêtre d'installation
plus riche, comme une fiche d'application. iOS les ignore.

**Audit du 12 septembre 2026.** Ce qui va, ce qui ne va pas face à Hevy, Strong,
StrengthLog et aux sites français, ce qui a été corrigé et ce qui reste :
[`docs/audit-concurrence-2026-09-12.md`](../audits/concurrence-2026-09-12.md).
