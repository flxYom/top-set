> **Français** · [English](../en/data.md)

# Tes données

Une partie de la [documentation de Top Set](../../README.fr.md#documentation).

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

Onze tables au total. Cinq portent le carnet — `seances`, `exercices`, `series`,
`exercices_perso`, `consentements` — et personne n'y voit jamais la ligne d'un
autre, sauf le coach à qui l'on a ouvert son carnet, en lecture seule. Les autres
sont venues après :

- **`profils`** — pseudo, rôle, date d'inscription, date de dernière visite. Le
  pseudo continue de vivre dans les métadonnées du compte : cette colonne n'en
  est qu'un miroir interrogeable, parce que le schéma `auth` de Supabase n'est
  pas lisible depuis un navigateur. Aucune donnée de carnet, aucun email.
- **`retours`** — les retours utilisateurs. Supprimer son compte n'efface pas le
  retour, ça le rend anonyme (`on delete set null`) : partir est un droit,
  effacer un bug signalé n'en est pas un.
- **`liens_coach`** — qui suit qui, et depuis quand. Voir
  [Le lien coach ↔ coaché](coach-et-admin.md#le-lien-coach--coaché).
- **`messages_support`** et **`messages_coach`** — les deux moitiés de la
  messagerie. Voir [La messagerie](coach-et-admin.md#la-messagerie).
- **`notifications_admin`** — ce que l'équipe doit voir passer, écrit
  uniquement par des déclencheurs.

### Un carnet par compte

Le carnet local vit sous une seule clé, partagée par tout l'appareil. Tant
qu'une personne égale un appareil, ça ne se voit pas. Dès que deux comptes se
connectent sur le même téléphone, le second voyait le carnet du premier — et
l'app lui proposait de l'envoyer sur *son* compte, ce qui en changeait le
propriétaire pour de bon.

La règle est donc&nbsp;: **le carnet suit le compte, pas l'appareil.** À la
connexion, si le carnet présent appartient à un autre identifiant, il est rangé
sous `topset_carnet_<user_id>` et celui du nouvel arrivant est repris s'il en
avait un ici. Le format ne change pas, la clé `musculation_sessions` non plus&nbsp;:
c'est son contenu qui est échangé.

Trois propriétés valent d'être notées&nbsp;:

- **Rien n'est effacé.** Le rangement précède toujours le vidage, et un
  rangement plus riche n'est jamais écrasé par un plus pauvre.
- **La file d'envoi part avec le carnet.** La garder ferait pousser les journées
  d'un compte vers l'autre à la première synchro.
- **Un carnet rangé n'est récupérable que par son propriétaire.** C'est aussi la
  bonne règle de confidentialité&nbsp;: l'autre compte ne doit pas pouvoir le
  reprendre.

La déconnexion applique la même règle. Le commentaire du code disait que
supprimer le carnet à la déconnexion serait une perte de données — c'était vrai
tant qu'il n'existait aucun endroit où le mettre. Maintenant qu'il y en a un, se
déconnecter range le carnet et rend l'app vierge&nbsp;: celui qui ouvre le
téléphone ensuite, même sans compte, ne voit rien.

Une adresse email = un carnet.

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

**Une base en retard ne mange pas les commentaires.** Les commentaires ont
demandé deux colonnes, `exercices.note` puis `series.note`, ajoutées quand
`schema.sql` est relancé. Une base qui ne les a pas encore renvoie des lignes
**sans la clé** `note` : `jourDistant()` le lit comme « la base ne sait pas », pas
comme « commentaire effacé », et garde celui du téléphone — l'exercice retrouvé
par son identifiant, sinon par sa place et son nom (la base fabrique ses propres
identifiants), la série par son identifiant, sinon par sa place. Une base à jour
renvoie `note: null`, et là, on la suit.

Clés de stockage : `musculation_sessions` (le carnet), `topset_custom_exercises`
(exercices mémorisés), `topset_sync` (file d'attente et curseur de synchro),
`topset_conflits` (la version perdante d'un conflit, jamais jetée en silence).

---

## Sauvegarde et récupération

Le navigateur étant l'unique copie, l'app prend sa perte au sérieux.

**Export.** Le bouton `⇅` te donne un fichier JSON contenant toutes tes séances et
tes exercices personnels. Tu le télécharges, le partages, ou le copies en texte.
C'est la seule copie qui survit à un navigateur nettoyé.

**Importer ajoute, ne remplace plus.** Remplacer effaçait le carnet en place par
celui du fichier : une vieille sauvegarde importée par erreur faisait disparaître
des mois de séances. `fusionnerCarnets()`, dans `intelligence.js` et donc
testée, ajoute ce qui manque et ne touche jamais à ce qui est là :

- un jour absent arrive entier, avec son titre ;
- dans un jour présent, un exercice est reconnu par son identifiant, ou par son
  nom et ses séries remplies — c'est ce qui permet au tableur, qui n'a pas
  d'identifiants, de ne rien doubler ;
- c'est un multi-ensemble, pas un ensemble : deux cartes « Pompes × 20 » le même
  jour sont deux exercices faits, et restent deux ;
- un identifiant déjà pris ailleurs dans le carnet est remplacé. En base, un
  exercice est unique par personne, tous jours confondus : un doublon bloquerait
  la synchro de la journée pour toujours.

Le premier appui montre ce qui va arriver — « 25 séries sur 4 jours (dont 3 que
tu n'avais pas) » — le second applique, en refaisant la fusion sur le carnet de
cet instant. Seules les journées qui ont bougé repartent vers le compte.
Réimporter deux fois le même fichier n'ajoute rien.

**Titres, fins de séance et noms partent même seuls.** `pousser()` sortait
quand aucune journée n'avait bougé : un titre changé, une séance validée ou un
nom d'exercice attendaient alors la prochaine série notée, parfois des jours.
Les quatre files sont maintenant regardées ensemble.

**Le tableur se réimporte.** `lireCsvCarnet()` relit le CSV exporté, et ce
qu'Excel en fait quand il le réenregistre : virgules au lieu de points-virgules,
dates en JJ/MM/AAAA. Il passe ensuite par exactement le même nettoyage qu'un
fichier JSON. Au passage, l'import relit enfin le **titre** des séances : il
voyageait dans la sauvegarde sans jamais être relu. La colonne `Commentaire`
est relue sur la série de sa ligne, comme l'export l'écrit.

**Garde-fou contre l'écrasement.** `saveLocal()` réécrit le carnet entier à chaque
sauvegarde. Si `state.sessions` était vide au mauvais moment — chargement raté,
JSON corrompu — cet unique appel effacerait tout, définitivement et sans un mot.
Donc :

- L'app **refuse** de remplacer un carnet rempli par un carnet vide, et le dit.
  La condition se lève d'elle-même dès qu'il y a de nouveau un jour réel.
- Chaque sauvegarde conserve la **version précédente** sous une clé de secours.
- Un JSON illisible est **mis de côté** au lieu d'être écrasé.
- Un bouton `RÉCUPÉRER N JOURS` apparaît dans le panneau `⇅` dès qu'une copie
  récupérable contient plus que ce qui est chargé. Récupérer, c'est importer
  cette copie : ce qui manque revient, ce qui est là ne bouge pas.

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
n'est chargé que si une session existe déjà, ou au moment où l'on se connecte.

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

**Aucun cookie, aucun traceur aujourd'hui.** Sans compte, le seul traitement qui
existe, ce sont les journaux d'accès de l'hébergeur. La politique ne promet plus
« aucune mesure d'audience » : une mesure des performances du site est prévue,
et elle sera décrite sur la page avant de commencer.

**La politique de confidentialité suit l'app.** La version 3.1 nomme l'éditeur et
tous les intervenants — Vercel, Supabase, Resend pour les emails du compte, OVH
pour le domaine, et Claude (Anthropic), qui aide à écrire le code et les pages
sans être branché à l'app —, et ajoute les commentaires au carnet. Comme la 3.0,
elle ne redemande rien aux comptes existants. La 3.0 disait déjà, fonction par
fonction, ce qu'un compte enregistre, qui le voit — soi, son coach, l'équipe —,
sur quelle base légale et pour combien de temps. La version acceptée est
enregistrée avec chaque consentement : à l'inscription, et à chaque demande de
coaching. Cette dernière partait sans numéro, et la base inscrivait « 1 », une
version qui n'a jamais existé. La 3.0 ne redemande rien aux comptes existants :
elle décrit ce que les gens déclenchent eux-mêmes (écrire, envoyer un retour) et
le coaching, qui a déjà son propre accord.
