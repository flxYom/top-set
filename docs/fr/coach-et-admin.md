> **Français** · [English](../en/coach-and-admin.md)

# Coach et administration

Une partie de la [documentation de Top Set](../../README.fr.md#documentation).

## Le lien coach ↔ coaché

C'est la seule ouverture du mur des carnets, et elle tient en quatre policies
`SELECT` ajoutées **à côté** des policies existantes, sans les toucher : deux
policies permissives se cumulent, donc le propriétaire garde tous ses droits et
le coach n'obtient que la lecture.

**Le lien n'existe que si les deux parties ont agi.** Le coach génère un code de
8 caractères (alphabet sans `O`/`0` ni `I`/`1` — il se lit à voix haute), le
coaché le saisit, le coach accepte. Un pseudo tapé à la main donnerait un carnet
entier à un inconnu sur une faute de frappe ; un code est faux ou juste, jamais
« presque ».

**Ce que le coach peut :** lire les séances, exercices, séries et exercices
mémorisés de son coaché, et voir son pseudo.
**Ce qu'il ne peut pas :** modifier ou effacer quoi que ce soit, voir l'email,
les consentements ou les retours. Il n'existe aucune fonction pour.

**Un seul coach actif** par personne, garanti par un index unique partiel et non
par une règle applicative qu'on pourrait oublier. **Révocable des deux côtés**,
avec effet immédiat : la policy relit le statut à chaque requête, il n'y a ni
jeton à expirer ni cache à vider. Le **consentement** du coaché est daté et
versionné dans `consentements` au moment où il fait la demande.

### Le point de conception qui compte

`tirer_jours_de(client)` est en `security invoker` et **ne vérifie aucun droit**.
Elle demande les séances de ce client, et RLS répond. Sans lien actif le résultat
est vide — pas parce qu'un `if` l'a décidé, mais parce que la base n'a rien à
montrer. Il n'y a donc aucun contrôle à oublier dans cette fonction, et un test
vérifie qu'elle ne passe jamais en `security definer`.

47 tests couvrent ce seul mécanisme : avant lien, en attente, après accord, ce
que le coach ne peut pas faire, le tiers qui n'est ni l'un ni l'autre, le second
coach refusé, la révocation, l'arrêt du coaching, et `anon` partout.

### La conversation coach ↔ coaché

Une table à part, `messages_coach`, et non une réutilisation de la messagerie de
support : là-bas l'autre partie est « l'administration », la même pour tout le
monde ; ici ce sont deux comptes, et le droit d'écrire se lit **dans le lien**,
pas dans un rôle.

- **Écrire** exige le lien *actif*, et que l'auteur déclaré corresponde au côté
  réel : un coaché ne signe pas « coach », un coach n'écrit pas à quelqu'un qu'il
  ne suit pas, et personne ne fabrique un fil entre deux inconnus.
- **Lire** : le coaché garde son historique même après avoir coupé l'accès —
  c'est sa conversation. Le coach, lui, perd la lecture dès la rupture, comme
  pour le carnet. L'administrateur ne la voit pas.
- **Réécrire** est impossible : le droit de mise à jour est limité à la colonne
  `lu`. **Effacer** aussi : il n'y a pas de policy `delete`.
- **Marquer lu** ne vaut que pour ce que l'autre a écrit, et un message part
  non lu et daté par la base : l'insertion s'arrête à `coach_id`, `client_id`,
  `auteur` et `corps`.

Dans l'app, cette conversation est une ligne de la boîte des messages, comme
les autres. On y arrive aussi depuis *Mon coach* dans le profil, depuis chaque
carte de *Mes coachés*, et depuis le carnet que le coach est en train de lire —
lire une séance et vouloir en parler, c'est le même geste. Un suivi terminé
reste dans la boîte du coaché, marqué **SUIVI TERMINÉ** : il la relit, il n'y
écrit plus.

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

**Anti-spam** (18/09/2026). Chaque envoi peut déclencher un email ; un script
avec un compte valide pourrait donc inonder la file et la boîte mail. Un
trigger `before insert` (`plafond_envois`) plafonne par heure : 10 retours
par compte, 30 messages d'un membre vers l'équipe, 60 messages par sens dans
un fil coach ↔ coaché. L'équipe n'est pas plafonnée. Au-delà, la base refuse
et l'app affiche « trop d'envois en peu de temps — réessaie dans une heure ».

### La messagerie

Un fil par personne, le même des deux côtés : un message écrit par
l'administrateur porte quand même le `user_id` du membre, sans quoi il n'y
aurait pas de conversation mais deux listes.

Le point qui tient tout : **la policy d'insertion vérifie que l'auteur déclaré
correspond au rôle réel de l'appelant.** Un membre ne peut pas insérer un
message signé `admin`, même en fabriquant la requête à la main. Ce n'est pas le
formulaire qui l'empêche, c'est la base.

Le droit d'écriture est limité à la colonne `lu` — encore la même leçon : RLS
filtre des lignes, pas des colonnes, et sans ce droit restreint la policy
`update` laisserait réécrire le corps d'un message déjà envoyé. Et on ne
marque lu que ce que l'autre a écrit : le membre, les réponses de l'équipe ;
l'administrateur, les messages des membres. Marquer ses propres messages lus
les aurait retirés des non-lus de l'équipe. Le droit d'insertion, lui, s'arrête
à `user_id`, `auteur` et `corps` : un message part non lu et daté par la base.

#### Une seule boîte pour toutes les conversations

Le support et le coaching avaient chacun leur fil, dans deux feuilles
différentes, et un ticket arrivait dans l'espace admin sans rien pour y
répondre. Il y a désormais **une boîte**, derrière la bulle de l'en-tête. Deux
tables en base, parce que le droit d'écrire ne s'y décide pas pareil — un rôle
d'un côté, un lien de l'autre — mais une seule porte à l'écran : pour la
personne, c'est la même chose, quelqu'un lui a écrit.

Une conversation se décrit par sa table, le côté où l'on se tient et l'autre
personne. Quatre points de vue, un seul rendu :

| Qui regarde | Table | Avec qui |
|---|---|---|
| un membre | `messages_support` | l'équipe Top Set |
| l'équipe | `messages_support` | chaque membre qui a écrit |
| un coaché | `messages_coach` | son coach |
| un coach | `messages_coach` | chacun de ses coachés |

Un coach ou un coaché écrit à l'équipe comme n'importe quel membre, et l'équipe
peut écrire à n'importe qui depuis l'espace admin (**ÉCRIRE**, **RÉPONDRE**).
**Deux inconnus ne peuvent pas s'écrire** : aucun lien ne dit que l'un veut bien
lire l'autre, et c'est la base qui refuse, pas l'écran.

La boîte ne demande aucune fonction nouvelle en base : le dernier message et les
non-lus se lisent directement, sous RLS, et les personnes sans message encore
viennent des liens de coaching. La conversation est la page elle-même — le
champ de saisie reste collé en bas de l'écran — et les nouveaux messages sont
relevés toutes les dix secondes tant qu'elle est ouverte et visible, toutes les
trente secondes dans la boîte. Rien quand l'onglet est caché : ce n'est pas un
battement de cœur pour garder la base éveillée.

#### Ce qui en fait une conversation et pas un formulaire

Le fil s'ouvre **même vide**. Ça paraît un détail d'affichage ; c'en était un de
fonctionnement. Tant qu'il se cachait faute de messages, personne ne pouvait
écrire le premier : la conversation ne pouvait commencer que si elle avait déjà
commencé. Un fil vide affiche maintenant une invitation, et la zone de saisie
avec.

Le reste tient en quatre gestes, tous empruntés à ce que fait n'importe quelle
messagerie et qu'on ne remarque que par leur absence :

- **Les bulles s'alignent par auteur** — les siennes à droite, en orange,
  celles d'en face à gauche. Sans ça il faut relire l'étiquette à chaque bulle
  pour savoir qui parle. Le jour s'écrit une fois, en intertitre (« Hier »,
  « Aujourd'hui »), et chaque bulle ne porte que l'heure.
- **Le nom ne s'affiche qu'au-dessus de ce que dit l'autre.** Au-dessus des
  siens il n'apprend rien et double la hauteur du fil.
- **Une bulle d'attente** apparaît quand le dernier message est du membre. Elle
  n'est pas stockée : elle est fabriquée à l'affichage et disparaît d'elle-même
  dès qu'une réponse arrive, puisqu'alors le dernier message n'est plus de lui.
- **Entrée envoie, Maj+Entrée va à la ligne**, des deux côtés. Le bouton reste
  pour le téléphone.

À l'ouverture, la page descend jusqu'au dernier message. Une relève qui apporte
du neuf ne fait descendre que si l'on était déjà en bas — on ne tire pas la page
sous le nez de quelqu'un qui relit plus haut — et une relève sans nouveauté ne
repeint rien. L'animation est coupée pour qui a réglé son système sur
`prefers-reduced-motion`.

#### Un retour ouvre la conversation

Un retour arrivait dans l'espace admin sans rien qui permette d'y répondre, et
de son côté le membre ne voyait rien se passer. Désormais un déclencheur,
`accuser_retour()`, recopie le retour dans le fil du membre — signé de lui,
marqué d'une étiquette **RETOUR** — puis ajoute un accusé de réception.

Cet accusé est signé `systeme`, pas `admin`. Personne n'a encore lu le retour
à ce moment-là ; le signer « admin » serait un mensonge poli. Aucune policy
n'autorise quiconque à écrire un message `systeme`, administrateur compris :
seul le déclencheur le peut, et c'est ce qui le rend crédible. Les deux lignes
sont horodatées explicitement — dans une même transaction `now()` ne bouge
pas, et l'accusé aurait pu s'afficher avant la question.

**Un geste, une notification** : la copie ne se notifie pas, le retour a déjà la
sienne. Et le droit d'insertion est limité aux colonnes `user_id`, `auteur`,
`corps` — sans ça, un membre pourrait poser lui-même un `retour_id` pour faire
taire la notification de ses propres messages.

Côté administrateur, chaque retour porte un bouton **RÉPONDRE** et chaque
inscrit un bouton **ÉCRIRE** : on peut ouvrir une conversation avec n'importe
qui, même avec quelqu'un qui n'a jamais rien envoyé.

Répondre à un retour encore nouveau le passe en **LU**, puisque c'est ce qu'on
vient de faire. Les retours envoyés avant l'accusé de réception n'avaient jamais
ouvert de conversation : le schéma les recopie une fois, à leur date, sans
notification et sans accusé tardif.

Enfin la **pastille** de la bulle, dans l'en-tête, compte tout ce qui attend,
toutes conversations confondues. Deux comptages `head:true` — des nombres, pas
des centaines de messages — au plus une fois toutes les huit secondes, et zéro
en cas d'erreur : une pastille ne doit jamais empêcher une page de s'afficher.
L'équipe compte ce que les membres ont écrit ; un membre compte ce qu'on lui a
écrit ; tout le monde ajoute ses conversations de coaching.

**Le comptage attend le profil.** Il partait avant que `toucher_profil()` ait
répondu : l'administrateur était compté comme un membre, sur son propre fil de
support — celui de ses retours d'essai, que sa boîte ne lui montre jamais, donc
que rien ne marquait lu. La pastille restait allumée sur un message que
personne ne pouvait ouvrir, et le vrai compte, retenu par la limite des huit
secondes, n'arrivait qu'une minute plus tard. `profilConnu()` fait attendre le
rôle ; ouvrir la boîte recompte ; et un jeton empêche un comptage parti avant
une lecture de rallumer la pastille après elle.

### Les notifications

Une table sans **aucune** policy d'insertion : personne ne peut en fabriquer une
depuis le navigateur. Ouvrir le fil d'un membre marque lues ses notifications de
message et de retour — on vient de les lire ; les inscriptions et les demandes
de coaching restent. Elles sont écrites par des déclencheurs `security definer`
posés sur `profils`, `messages_support`, `retours` et `liens_coach`.

Ces déclencheurs ne lisent aucun paramètre venu du client : ce qu'ils
inscrivent, ils le prennent dans la ligne qui vient d'être écrite. C'est la
version base de données de « relire la source plutôt que croire le corps de la
requête » — la règle qu'on applique côté serveur ailleurs, obtenue ici sans
serveur.

**Elles partent avec le compte.** Elles étaient en `on delete set null`, pour
garder la trace de ce qui s'était passé sans que la personne soit
identifiable. Mais une notification porte le pseudo (inscription) ou les 200
premiers caractères d'un message : orpheline, elle l'était encore. Elles sont
désormais en cascade, et le schéma efface celles qui étaient déjà orphelines.
Seuls les retours survivent à un compte supprimé — sans auteur, et sans
notification qui le nomme.

### L'espace administrateur

Réservé au rôle `admin`. Il montre dix compteurs (inscrits, nouveaux et actifs à
7 et 30 jours, séances, séries, retours en attente, messages non lus,
notifications), les notifications, un accès à la boîte des messages, la liste
des retours — chacun avec **RÉPONDRE**, **MARQUER LU** et **TRAITÉ** — et la
liste des inscrits triée par dernière visite, chacun avec **ÉCRIRE**.

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
