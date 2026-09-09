> [English](README.md) · **Français**

![Top Set](og-image.png)

# top-set

**Note une série en dix secondes. Regarde ta progression se construire, mois après mois.**

[![CI](https://github.com/flxYom/top-set/actions/workflows/ci.yml/badge.svg)](https://github.com/flxYom/top-set/actions/workflows/ci.yml)
![Statut](https://img.shields.io/badge/statut-bêta-orange)
[![Licence](https://img.shields.io/badge/licence-tous%20droits%20réservés-lightgrey)](LICENSE)

Un carnet de musculation qui tourne entièrement dans le navigateur. Tu notes tes
séries, tes charges, tes répétitions et ton RPE pendant la séance ; il te rend le
volume, les records et la progression dans le temps.

Pas de compte. Pas d'inscription. Aucun serveur qui détient tes données. Tout vit
dans le `localStorage` du navigateur, sur l'appareil que tu utilises. C'est un
choix assumé, et il coupe dans les deux sens — voir
[Où vivent tes données](#où-vivent-tes-données).

**C'est une bêta**, utilisée et développée au jour le jour par son auteur. Attends-toi
à des aspérités et, de temps en temps, à un changement qui casse quelque chose. Si
un truc est cassé, confus ou manquant, [ouvre une issue](../../issues/new/choose) —
c'est exactement à ça que sert ce repo pour l'instant.

<p align="center">
  <img src="screenshots/planning.png" width="240" alt="Écran de planning hebdomadaire : jours de la semaine, bandeau récap du jour, exercice développé couché noté" />
  <img src="screenshots/session.png" width="240" alt="Saisie d'une série : steppers de poids et répétitions, RPE, repos, et la troisième série dupliquée" />
  <img src="screenshots/recap.png" width="240" alt="Récap hebdomadaire : volume levé, séances, séries, assiduité, et répartition par groupe musculaire" />
</p>
<p align="center"><sub>Planning · Saisie d'une série · Récap hebdomadaire — vrais écrans, avec des chiffres de démo pour ces captures.</sub></p>

---

## Sommaire

- [Ce qu'il fait](#ce-quil-fait)
- [Où vivent tes données](#où-vivent-tes-données)
- [Sauvegarde et récupération](#sauvegarde-et-récupération)
- [Migrer un carnet existant](#migrer-un-carnet-existant)
- [La confidentialité par construction](#la-confidentialité-par-construction)
- [Comptes et Supabase](#comptes-et-supabase)
- [Retours et administration](#retours-et-administration)
- [La pile technique](#la-pile-technique)
- [Structure du projet](#structure-du-projet)
- [Le lancer en local](#le-lancer-en-local)
- [Déployer](#déployer)
- [L'installer sur un téléphone](#linstaller-sur-un-téléphone)
- [Ce qu'il n'est pas](#ce-quil-nest-pas)
- [La suite](#la-suite)
- [Licence](#licence)

---

## Ce qu'il fait

**Planning hebdomadaire.** La ligne de pastilles, c'est ta semaine. Tu choisis un
jour, tu ajoutes des exercices, tu ajoutes des séries. Les flèches changent de
semaine, et le bouton `AUJOURD'HUI` te ramène — il passe en orange dès que tu
t'es éloigné de la semaine en cours.

**Duplication de série.** `+ SÉRIE` recopie la précédente : poids, reps, RPE,
repos. Seul `fait` repart à zéro. Sur cinq séries identiques, tu en saisis une et
tu appuies quatre fois.

**Incréments.** `−` et `+` ajoutent ou retirent 2,5 kg sans ouvrir le clavier.
C'est le geste le plus fréquent entre deux séries : il coûte un appui.

**RPE par série.** Échelle des répétitions en réserve, de 10 à 6 par demi-points :
10 c'est l'échec, 9 il t'en restait une, 8 il t'en restait deux. Facultatif —
laisse vide, rien ne casse.

**Repos par série**, et non par exercice, repris automatiquement à la duplication.

**Mémoire des exercices.** Tape un exercice absent de la base et il est retenu
pour la prochaine fois, groupe musculaire compris. L'enregistrement se fait quand
tu quittes le champ, pas à chaque lettre — sinon tu te retrouverais avec `B`,
`Be`, `Ben`.

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
une idée, une question. Ça part dans la base, pas dans une boîte mail, et tu peux
relire ce que tu as déjà envoyé avec son statut. Il faut un compte — c'est ce qui
permet de répondre, et ce qui évite qu'un robot remplisse la table.

**Une virgule qui marche vraiment.** Le champ poids accepte `62,5` comme `62.5`.
Un clavier français propose une virgule, et `<input type="number">` la refuse en
silence : le champ se vide et la série perd son poids. C'est précisément pour ça
que ce champ est en `type="text"` avec `inputmode="decimal"`.

---

## Où vivent tes données

**Sans compte** — le fonctionnement par défaut — dans le `localStorage`, sur un
appareil, dans un navigateur. Nulle part ailleurs.

**Ce que ça t'apporte :** aucun compte, démarrage immédiat, rien à faire fuiter,
aucun serveur à payer.

**Ce que ça te coûte :** aucune synchronisation entre appareils, et le carnet est
*détruit* si tu vides les données du site, changes de téléphone, ou navigues en
privé.

**Avec un compte**, une copie vit en plus dans Postgres chez Supabase, et le même
carnet s'ouvre sur n'importe quel appareil. Le téléphone garde sa copie dans les
deux cas : le compte ne remplace pas le stockage local, il le sauvegarde.

Sept tables au total. Cinq portent le carnet — `seances`, `exercices`, `series`,
`exercices_perso`, `consentements` — et personne n'y voit jamais la ligne d'un
autre. Deux sont venues après :

- **`profils`** — pseudo, rôle, date d'inscription, date de dernière visite. Le
  pseudo continue de vivre dans les métadonnées du compte : cette colonne n'en
  est qu'un miroir interrogeable, parce que le schéma `auth` de Supabase n'est
  pas lisible depuis un navigateur. Aucune donnée de carnet, aucun email.
- **`retours`** — les retours utilisateurs. Supprimer son compte n'efface pas le
  retour, ça le rend anonyme (`on delete set null`) : partir est un droit,
  effacer un bug signalé n'en est pas un.

### Comment marche la synchro

Le `localStorage` reste la source de vérité de l'interface. Tout est écrit en
local d'abord et immédiatement — l'écran n'attend jamais le réseau. Supabase est
une copie qui suit.

L'unité de synchro est **la journée**, parce que c'est déjà l'unité de l'app :
`state.sessions` est un dictionnaire `date → séance`. `pousser_jour()` réécrit une
journée entière de façon atomique, ce qui supprime les doublons, les fusions
partielles et les séries orphelines en tant que classe de bugs, au lieu de les
traiter cas par cas.

Une modification marque sa journée et l'envoi attend 2,5 s de calme : taper au
clavier ne déclenche pas une requête par frappe. Hors ligne, la file des journées
en attente vit dans le `localStorage` et repart sur l'événement `online` et au
retour sur l'onglet. **Une journée ne quitte la file que si le serveur a
confirmé.**

Clés de stockage : `musculation_sessions` (le carnet), `topset_custom_exercises`
(exercices mémorisés), `topset_sync` (file d'attente et curseur de synchro),
`topset_conflits` (la version perdante d'un conflit, jamais jetée en silence).

---

## Sauvegarde et récupération

Le navigateur étant l'unique copie, l'app prend sa perte au sérieux.

**Export.** Le bouton `⇅` te donne un fichier JSON contenant toutes tes séances et
tes exercices personnels. Tu le télécharges, le partages, ou le copies en texte.
C'est la seule copie qui survit à un navigateur nettoyé.

**L'import se fait en deux temps :** le premier appui montre ce que tu as et ce
que le fichier contient, le second seulement applique. Remplacer est irréversible,
donc il demande deux fois.

**Garde-fou contre l'écrasement.** `saveLocal()` réécrit le carnet entier à chaque
sauvegarde. Si `state.sessions` était vide au mauvais moment — chargement raté,
JSON corrompu — cet unique appel effacerait tout, définitivement et sans un mot.
Donc :

- L'app **refuse** de remplacer un carnet rempli par un carnet vide, et le dit.
  La condition se lève d'elle-même dès qu'il y a de nouveau un jour réel.
- Chaque sauvegarde conserve la **version précédente** sous une clé de secours.
- Un JSON illisible est **mis de côté** au lieu d'être écrasé.
- Un bouton `RÉCUPÉRER N JOURS` apparaît dans le panneau `⇅` dès qu'une copie
  récupérable contient plus que ce qui est chargé.

---

## Migrer un carnet existant

Quelqu'un qui utilisait l'app en local et crée ensuite un compte se voit poser la
question — jamais de migration automatique, parce que l'appareil a pu servir à
quelqu'un d'autre.

```
données locales → détection → migration proposée → envoi → vérification
```

La migration est **non destructive par construction** : le local est le cache de
l'app, donc rien n'y est jamais effacé — c'est une propriété de la conception, pas
une promesse. Quand une journée existe des deux côtés, la plus fournie gagne et
l'autre est mise de côté dans `topset_conflits`.

Elle est **idempotente** : pousser deux fois la même journée produit les mêmes
lignes, parce qu'une journée est remplacée en entier et non complétée.

Elle ne se déclare réussie qu'après avoir relu le cloud et compté les séries une à
une. Sans cette étape, « migré » ne voudrait dire que « aucune requête n'a renvoyé
d'erreur ».

---

## La confidentialité par construction

Ce que la politique de confidentialité affirme est **appliqué techniquement**, pas
seulement écrit :

**Aucune requête vers un tiers.** Bricolage Grotesque, Chart.js et supabase-js
sont tous servis depuis le site lui-même. Les charger depuis un CDN enverrait
l'adresse IP de chaque visiteur à Google ou Cloudflare à chaque ouverture, qu'il
ait un compte ou non.

**Un CSP strict** dans `vercel.json` — `default-src 'self'`, `script-src 'self'`
sans `'unsafe-inline'`, `object-src 'none'`, `frame-ancestors 'none'`, et
`connect-src` limité à `'self'` plus la seule origine Supabase du projet. Rien
d'autre ne peut être contacté, ce qui bloque l'exfiltration au niveau du
navigateur, et aucun script injecté ne peut s'exécuter même si un `esc()` était
oublié quelque part.

**Un fichier importé est traité comme hostile.** Il est plafonné à 8 Mo avant
d'être lu, les identifiants qui sortent de `[A-Za-z0-9_-]{1,64}` sont remplacés,
le groupe musculaire est validé contre la liste fermée, et les exercices
mémorisés sont repassés clé par clé. Aucune donnée légitime n'est réécrite :
`test/gabarits.test.mjs` vérifie que les identifiants historiques passent tous
le filtre.

**Rien n'est téléchargé pour qui n'a pas de compte.** supabase-js pèse 209 Ko et
n'est chargé que si une session existe déjà ou si le panneau compte est ouvert.

**Row Level Security sur toutes les tables.** Chaque ligne porte l'identifiant de
son propriétaire, et la base refuse toute lecture ou écriture qui ne correspond
pas à l'utilisateur connecté. Les clés étrangères sont composites
`(user_id, id)` : une ligne ne peut même pas structurellement appartenir à la
séance de quelqu'un d'autre. Le client n'envoie jamais de `user_id` — il vient du
jeton, côté serveur.

**Deux couches de droits, pas une.** Supabase accorde par défaut tous les droits
de table au rôle `authenticated` sur chaque table créée. Le schéma les révoque
puis n'accorde que ce qui sert : un consentement et un retour peuvent être écrits
et relus, jamais modifiés ni effacés. RLS le garantissait déjà ; le droit de table
le redit, pour que la garantie ne tienne pas sur une seule couche.

**Aucune policy `UPDATE` sur `profils`, et c'est délibéré.** RLS filtre des
lignes, pas des colonnes : « chacun modifie son profil » aurait aussi autorisé
`update profils set role = 'admin' where user_id = auth.uid()`. La ligne
appartient bien à l'appelant, la policy passerait, et n'importe qui deviendrait
administrateur depuis la console de son navigateur. Tout passe par
`toucher_profil()`.

**Aucun cookie, aucune mesure d'audience, aucun traceur.** Le seul traitement qui
existe, ce sont les journaux d'accès de l'hébergeur, et la page de confidentialité
le dit.

---

## Retours et administration

### Les retours

Un lien « Nous faire un retour » en pied de page ouvre une feuille : trois
natures — `bug`, `idee`, `question` — un texte de 4 000 caractères maximum, et la
liste de ce qu'on a déjà envoyé avec son statut.

Ce qui part avec le message : la vue où l'on se trouvait, la taille de l'écran,
le navigateur tronqué à 160 caractères, et un drapeau « installé en PWA ». De quoi
reproduire un bug, et rien du carnet. L'écran le dit avant l'envoi.

Les bornes sont dans la base, pas dans le formulaire : `check` sur le type, sur
le statut, sur la longueur du corps et sur la taille du contexte. On ne défend pas
une table avec du JavaScript.

### L'espace administrateur

Réservé au rôle `admin`. Il montre huit compteurs (inscrits, nouveaux et actifs à
7 et 30 jours, séances, séries, retours en attente), la liste des retours avec de
quoi les marquer lus ou traités, et la liste des inscrits triée par dernière
visite.

**Ce qu'il ne montre pas :** aucun email, et aucune ligne de carnet. Les quatre
fonctions renvoient des agrégats. Un administrateur voit *combien* de séances sont
loguées, jamais ce qu'il y a dedans — le `select` direct sur `seances` lui est
refusé comme à tout le monde, et un test le vérifie à chaque exécution de la
suite.

Le contrôle du rôle est **dans les fonctions**, en première instruction, pas dans
l'interface : cacher un bouton n'a jamais protégé personne.

### Se nommer administrateur

Il n'existe aucune fonction pour ça, volontairement. Ça se fait une fois à la
main, après avoir ouvert l'app au moins une fois pour que la ligne de profil
existe — Supabase → SQL Editor :

```sql
update public.profils set role = 'admin'
where user_id = (select id from auth.users where email = 'ton@email.fr');
```

---

## La pile technique

Aucun framework. Aucune étape de build. Aucun bundler. Aucune dépendance à
installer.

Un fichier HTML avec le CSS en ligne, plus des fichiers statiques.
`index.html` pèse environ 182 Ko, dont à peu près 119 Ko de texture en base64 ;
le JavaScript de l'app vit à côté, dans `app.js` (166 Ko).

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

Chart.js 4.4.1 est la seule bibliothèque, chargée à la demande la première fois
qu'on ouvre un graphique de progression.

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
guide.html               page « comment ça marche »
cgu.html                 conditions générales d'utilisation
confidentialite.html     politique de confidentialité
mentions-legales.html    mentions légales
legal.css                styles communs aux pages ci-dessus
chart.umd.js             Chart.js 4.4.1, chargé à la demande
fonts/                   Bricolage Grotesque, auto-hébergée (latin + latin-ext)
screenshots/             captures utilisées dans ce README (planning, saisie, récap)
icon.svg                 favicon principal
favicon-16/32.png        secours là où les favicons SVG ne passent pas
icon-180/192/512.png     écran d'accueil et PWA
og-image.png             aperçu de partage, 1200×630
manifest.webmanifest     manifeste PWA
vercel.json              en-têtes de sécurité et politique de cache
robots.txt  sitemap.xml  indexation
supabase.umd.js          supabase-js 2.115.0, chargé à la demande
supabase-config.js       URL du projet + clé publique (voir Comptes)
supabase/schema.sql      tables, politiques RLS et fonctions de synchro
supabase/test/           le banc d'essai RLS du schéma (PGlite) — 113 tests
test/                    logique métier (87) et gardes de sécurité (50)
set-domaine.mjs          remplace le domaine provisoire partout
LICENSE  SECURITY.md  CONTRIBUTING.md  CHANGELOG.md
.github/                 templates d'issues/PR, workflow de CI
```

Les icônes et l'image de partage sont générées à partir de leur géométrie par un
script plutôt que dessinées à la main : changer une couleur de marque, c'est
changer une valeur et relancer.

---

## Comptes et Supabase

Les comptes sont **facultatifs**. Sans `supabase-config.js` — ou avec
`window.TOPSET_SUPABASE` à `null` — le panneau compte disparaît et l'app est un
carnet purement local. Rien ne casse, aucun bouton mort.

Il n'y a **ni étape de build ni variable d'environnement à l'exécution** : un site
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
2. **SQL Editor → New query** → colle [`supabase/schema.sql`](supabase/schema.sql)
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

39 vérifications : écriture, journée rejouée sans doublon, tirage incrémental,
isolation entre deux utilisateurs, refus de greffer une ligne sur la séance d'un
autre, visiteur anonyme sans accès, cascade à la suppression du compte.

---

## Le lancer en local

N'importe quel serveur de fichiers statiques. Il n'y a rien à compiler.

```bash
npx serve .
```

Ouvrir `index.html` directement fonctionne aussi — la seule chose qui casse en
`file://`, c'est le manifeste PWA.

---

## Déployer

Conçu pour de l'hébergement statique. Sur Vercel : importer le dépôt, choisir
**Other** comme framework, déployer. `vercel.json` s'occupe des en-têtes et du
cache.

Le domaine apparaît 23 fois dans le HTML, `robots.txt` et `sitemap.xml` — balises
Open Graph, liens canoniques, URL du sitemap. Une seule commande met tout à jour :

```bash
node set-domaine.mjs mondomaine.fr
```

Elle accepte `https://mon.site/`, `www.mon.site` ou `mon.site`, et refuse ce qui
n'est pas un domaine.

---

## L'installer sur un téléphone

C'est une PWA : elle s'installe sans passer par un store, obtient son icône et
s'ouvre en plein écran.

**iPhone (Safari)** — Partager, puis *Sur l'écran d'accueil*.
**Android (Chrome)** — menu, puis *Installer l'application*.

Ça vaut le coup sur iPhone pour une raison qui dépasse le confort : Safari peut
effacer le `localStorage` d'un site non visité depuis environ une semaine, mais
pas celui d'une app posée sur l'écran d'accueil.

**Pas encore hors connexion.** Il n'y a pas de service worker : ouvrir l'app
demande encore une connexion réseau (`index.html` est servi en `no-cache`,
volontairement, pour que tu aies toujours la dernière version). Une fois la page
chargée, tout ce qui est déjà dans le `localStorage` reste lisible même si la
connexion tombe en cours de séance — mais lancer Top Set sans connexion du tout
ne marche pas aujourd'hui. Le vrai hors-ligne est sur [la suite](#la-suite).

---

## Ce qu'il n'est pas

- **Pas un entraîneur automatique.** Il enregistre ce que tu as fait ; il ne te dit pas
  quoi faire.
- **Pas un dispositif médical.** Les charges et le RPE sont ceux que tu as saisis.
  Rien n'est vérifié, validé ni conseillé.
- **Pas multi-appareils.** Il n'y a pas de synchronisation, volontairement, pour
  l'instant.
- **Pas une app sociale.** Pas de fil, pas d'amis, pas de classement.

---

## La suite

**Livré :** les comptes optionnels et la synchronisation cloud sur Supabase, le
service worker et le hors-ligne, la logique métier testée dans `intelligence.js`,
la page de progression par exercice, les retours utilisateurs et l'espace
administrateur.

**En cours :** la relation coach ↔ coaché. Un code d'invitation généré par le
coach, accepté des deux côtés, consenti et révocable ; puis des modèles de séance
rangés en dossiers, assignables dans le carnet d'un coaché ; puis un fil de
discussion et un retour de séance. `profils` est le socle de tout ça — c'est pour
elle qu'elle a été écrite en premier.

**Encore ouvert :** le retour du lien de réinitialisation du mot de passe n'a
jamais été exercé avec un vrai email. Les enregistrements DNS de Resend sont
publiés sur `top-set.fr` ; il reste à brancher la clé API dans les réglages SMTP
de Supabase et à faire le tour complet.

---

## Licence

Tous droits réservés. Le code est public en lecture ; il n'est pas sous licence
de réutilisation.
