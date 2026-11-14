# Prompt — Top Set boosté (pour Claude Fable 5.1)

À coller tel quel comme premier message d'une session Claude Code ouverte dans
le dossier `topset-web`, avec le modèle Fable 5.1 et l'effort `high`. Tout ce
qui suit la ligne est le prompt.

---

Je construis Top Set (www.top-set.fr), un carnet de musculation en PWA que
j'utilise tous les jours sur iPhone, comme Kamil, l'autre compte réel. Je ne
suis pas développeur. Je veux que Top Set devienne l'app de muscu la plus utile
de sa catégorie pour quelqu'un qui s'entraîne seul : plus rapide à remplir que
Strong ou Hevy, plus claire sur la progression, et toujours gratuite, sans
compte et hors ligne. Le benchmark du 14 novembre 2026 dit où on en est et ce
qui manque : `docs/audits/benchmark-2026-11-14.md`.

## Ce que tu lis avant de toucher au code

1. Ta mémoire de projet (l'index `MEMORY.md` se charge tout seul ; ouvre les
   notes qui touchent à ce que tu fais). Elle contient mes décisions passées et
   mes règles de travail. Elle a priorité sur tes réflexes.
2. Le benchmark ci-dessus.
3. `docs/design/DESIGN_SYSTEM.md`, puis `docs/fr/fonctionnalites.md` pour ce
   que l'app fait déjà.
4. Le code concerné par chaque chantier, avant de le modifier.

## La mission

Livre les chantiers 1 à 11 du tableau du benchmark, dans l'ordre. Le 12 (la fin
du repos écran verrouillé) n'est pas à construire : donne-moi seulement, en fin
de session, ce qu'un test sur iPhone doit vérifier avant qu'on décide.

Chaque chantier est livré quand il est codé, testé, documenté et poussé. Un
chantier par commit, sur `main`, comme d'habitude, et la CI doit être verte.

Deux chantiers demandent mon accord avant d'être codés, parce qu'ils changent
ce que les gens voient de l'app en dehors de l'app ou ce qu'on stocke :

- le 8, l'image à partager : décris-la en quelques lignes (ce qu'elle montre,
  son format) et attends ma réponse ;
- toute nouvelle donnée synchronisée (les modèles de séance au 3, le poids du
  corps au 5) : dis-moi en deux phrases ce qui sera stocké et où, et attends ma
  réponse.

Pendant que tu attends, avance sur les chantiers suivants. Pose ces deux
questions dans le même message, pas une par une.

## Ce qui ne bouge pas

- **Les données existantes ne se cassent jamais.** Le `localStorage` reste le
  stockage local et hors ligne ; les formats JSON et CSV restent lisibles ; le
  mode sans compte reste entièrement fonctionnel. Une migration est non
  destructive et idempotente.
- **Sécurité.** Aucune clé secrète ni service role dans le frontend ou dans Git.
  La RLS reste active sur chaque table ; chaque RPC a ses droits vérifiés ; une
  route publique ne fait jamais confiance au corps de la requête. Ne touche
  jamais au projet Supabase Yom Nutrition (tables `aliments_ciqual`,
  `user_journal`), à la clé dans `.mcp.json` ni à `Data base password.txt`.
- **Le SQL, c'est moi qui le passe.** Tu n'as pas accès à la base. Quand il faut
  du SQL, écris-le idempotent dans un fichier `.txt` de `supabase/`, mets aussi
  à jour `supabase/schema.sql`, et joins le fichier avec `SendUserFile` à la fin
  de ton message, en dernier, sous un bloc « ⚠️ À FAIRE » impossible à louper.
  L'app doit marcher en attendant : une base sans la nouvelle colonne n'efface
  rien.
- **Pas de nouvelle architecture.** Pas de framework, pas de React, pas d'étape
  de build en plus de `build.mjs`. Le CSS nouveau va dans la couche
  `<style id="refonte">` de `index.html`.
- **Les décisions déjà prises restent prises** : pas de verre dépoli en dehors
  de la loupe des onglets, la palette des groupes musculaires validée, la braise
  là où elle est, pas de travail « un seul bouton d'action ». Si un chantier
  semble demander de rouvrir l'une d'elles, dis-le et demande.
- **Aucune maquette, aucune capture, aucun dossier de synthèse.** Tu vérifies
  par des tests textuels, et tu me résumes en quelques lignes.

## Comment travailler

Tu travailles en autonomie. Je ne regarde pas en temps réel et je ne peux pas
répondre pendant que tu travailles, donc demander « Je fais X ? » bloque le
travail. Pour toute action réversible qui découle de cette mission, avance sans
demander. Arrête-toi seulement pour les deux accords ci-dessus, pour une action
destructive, ou pour un vrai changement de périmètre. Avant de finir un tour,
relis ton dernier paragraphe : si c'est un plan, une liste de prochaines étapes
ou une promesse (« je vais… »), fais ce travail maintenant.

Le périmètre, c'est la mission. Si tu trouves en chemin un bug ou une
amélioration que la mission ne demande pas, ne le corrige pas dans ce
changement, sauf si le chantier ne peut pas marcher sans : note-le pour ton
compte rendu. Quand un chantier est ambigu, prends la lecture que le code et le
benchmark soutiennent le plus directement, et écris ton hypothèse dans le
compte rendu.

Pour vérifier ton travail :

- Tout ce que lance `.github/workflows/ci.yml` doit passer avant chaque
  commit : les quatre fichiers de `test/`, `html-validate`,
  `node docs/seo/matrice.mjs --verifier` et `node scripts/contenu.mjs --verifier`.
  Si tu modifies `intelligence.js` ou `app.js`, ajoute les tests qui vont avec
  dans `test/intelligence.test.mjs` ou `test/gabarits.test.mjs`.
- Le comportement d'`app.js` (stockage, synchro, chronos) se teste en chargeant
  la page dans jsdom, depuis le bac à sable : ta note « banc d'essai jsdom »
  explique comment. Une sonde jsdom finit toujours par `process.exit()`.
- Chaque règle de calcul nouvelle (échauffement, prochaine charge, régularité)
  vit dans `intelligence.js` avec ses tests, et l'app l'appelle : la page web et
  l'app ne doivent jamais donner deux réponses différentes.
- Les scripts de vérification jetables restent dans le bac à sable, pas dans le
  dépôt. Les tests que tu gardes ont la taille de leurs voisins.
- Vérifie chaque écran nouveau à 320, 375 et 430 px de large, avec un superset,
  et avec les zones sûres de l'iPhone.

`app.js` fait plus de 10 000 lignes : modifie-le par petites retouches ciblées,
jamais en le réécrivant. Délègue à des sous-agents ce qui est indépendant (une
relecture d'un chantier fini par un agent qui ne l'a pas écrit, une recherche
dans le code) et continue pendant qu'ils tournent.

Avant de dire qu'une chose marche, vérifie-la contre un résultat d'outil de
cette session. Si un test échoue, dis-le avec la sortie. Si tu n'as pas pu
tester quelque chose (sur un vrai iPhone, par exemple), dis-le aussi.

## Ce que chaque changement met à jour

Les deux README quand c'est utile, la doc qui correspond dans `docs/fr/` et
`docs/en/`, `guide.html` (seulement ce qui n'est pas évident, en bon français),
`CHANGELOG.md`, `docs/design/DESIGN_SYSTEM.md` pour toute décision visuelle, et
la version du service worker dans `sw.js`. Les messages de commit se terminent
par la ligne de co-auteur habituelle.

## Le compte rendu

En français, court, en phrases complètes. D'abord ce qui est livré et poussé,
chantier par chantier, en une ligne chacun. Ensuite ce que tu n'as pas fait et
pourquoi. Ensuite ce que tu as remarqué sans le corriger. En dernier, s'il y a
du SQL, le bloc « ⚠️ À FAIRE » et le fichier joint. Pas de jargon : si tu cites
un fichier ou une fonction, dis en clair ce que c'est.
