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
- [La confidentialité par construction](#la-confidentialité-par-construction)
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

**Graphique de progression** par exercice, tracé depuis ton propre historique.

**Une virgule qui marche vraiment.** Le champ poids accepte `62,5` comme `62.5`.
Un clavier français propose une virgule, et `<input type="number">` la refuse en
silence : le champ se vide et la série perd son poids. C'est précisément pour ça
que ce champ est en `type="text"` avec `inputmode="decimal"`.

---

## Où vivent tes données

Dans le `localStorage`, sur un appareil, dans un navigateur. Nulle part ailleurs.

**Ce que ça t'apporte :** aucun compte, démarrage immédiat, rien à faire fuiter,
aucun serveur à payer.

**Ce que ça te coûte :** aucune synchronisation entre appareils, et le carnet est
*détruit* si tu vides les données du site, changes de téléphone, ou navigues en
privé.

Une seule clé de stockage, `musculation_sessions`, contient un dictionnaire
`AAAA-MM-JJ` → séance. Les exercices personnels sont sous
`topset_custom_exercises`.

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

## La confidentialité par construction

La politique de confidentialité affirme que rien ne quitte ton appareil. Cette
affirmation est **appliquée techniquement**, pas seulement écrite :

**Aucune requête vers un tiers.** Bricolage Grotesque et Chart.js étaient chargés
depuis Google Fonts et cdnjs, ce qui envoyait l'adresse IP de chaque visiteur à
Google et Cloudflare à chaque ouverture. Les deux sont désormais servis depuis le
site lui-même.

**Un CSP strict** dans `vercel.json` — `default-src 'self'`, `connect-src 'self'` —
qui n'est possible *que parce qu'*il n'y a aucune origine externe. Il bloque
l'exfiltration au niveau du navigateur.

**Aucun cookie, aucune mesure d'audience, aucun traceur.** Le seul traitement qui
existe, ce sont les journaux d'accès de l'hébergeur, et la page de confidentialité
le dit.

---

## La pile technique

Aucun framework. Aucune étape de build. Aucun bundler. Aucune dépendance à
installer.

Un fichier HTML avec CSS et JavaScript en ligne, plus des fichiers statiques.
`index.html` pèse environ 218 Ko, dont à peu près 119 Ko de texture en base64.

Chart.js 4.4.1 est la seule bibliothèque, chargée à la demande la première fois
qu'on ouvre un graphique de progression.

C'est un choix assumé pour une app de cette taille : aucune chaîne d'outils à
maintenir, aucune dérive de versions, et l'ensemble s'ouvre, se lit et se modifie
dans un seul fichier.

---

## Structure du projet

```
index.html               toute l'app — balisage, styles, logique
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
set-domaine.mjs          remplace le domaine provisoire partout
LICENSE  SECURITY.md  CONTRIBUTING.md  CHANGELOG.md
.github/                 templates d'issues/PR, workflow de CI
```

Les icônes et l'image de partage sont générées à partir de leur géométrie par un
script plutôt que dessinées à la main : changer une couleur de marque, c'est
changer une valeur et relancer.

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

- **Pas une app de coaching.** Il enregistre ce que tu as fait ; il ne te dit pas
  quoi faire.
- **Pas un dispositif médical.** Les charges et le RPE sont ceux que tu as saisis.
  Rien n'est vérifié, validé ni conseillé.
- **Pas multi-appareils.** Il n'y a pas de synchronisation, volontairement, pour
  l'instant.
- **Pas une app sociale.** Pas de fil, pas d'amis, pas de classement.

---

## La suite

**Court terme :** un vrai hors-ligne. Il n'y a pas encore de service worker (voir
[L'installer sur un téléphone](#linstaller-sur-un-téléphone)) — c'est la prochaine
chose à corriger, avant tout le reste.

**Plus tard :** les comptes et la synchronisation sont l'étape suivante évidente, et le schéma
existe déjà et est testé — trois tables relationnelles (séances → exercices →
séries) avec sécurité au niveau de la ligne, plutôt qu'un gros bloc JSON par
utilisateur.

Il n'est délibérément pas branché. La version actuelle ne demande aucun compte,
ce qui est le moyen le plus rapide de savoir si les gens s'en servent vraiment
avant d'ajouter un backend, une connexion et une politique de confidentialité qui
doit décrire un vrai traitement de données.

Le jour où ça arrive : politique réécrite, version incrémentée, et consentement
demandé avant que quoi que ce soit ne quitte un appareil.

---

## Licence

Tous droits réservés. Le code est public en lecture ; il n'est pas sous licence
de réutilisation.
