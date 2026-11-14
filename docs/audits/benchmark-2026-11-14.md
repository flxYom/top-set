# Benchmark Top Set — 14 novembre 2026

Comparé à Strong, Hevy, Setgraph, Alpha Progression, Fitbod et Boostcamp. Les
fonctions des concurrents viennent de leurs fiches et de comparatifs publiés en
2026 (sources en bas). Beaucoup de ces comparatifs sont écrits par un
concurrent : ce qui suit sert à choisir quoi construire, pas à faire des
affirmations publiques sur les autres apps.

## Là où Top Set est déjà devant

- **Sans compte, hors ligne, gratuit, sans plafond.** Hevy limite son offre
  gratuite (4 routines d'après son aide en ligne) et demande une connexion pour
  synchroniser. Top Set marche entièrement sans compte et sans réseau.
- **La vitesse de saisie.** Abréviations de salle (RDL, OHP), fautes de frappe
  corrigées, PRÉC. qui se recopie d'un appui, plein écran avec glissement pour
  valider, repos qui part tout seul. C'est au niveau de Strong et Hevy, et plus
  tolérant aux fautes.
- **Elle explique ce qu'elle affiche.** « QUE FAIRE ? », « D'OÙ ÇA VIENT ? », le
  repère hebdomadaire de séries, l'onglet Apprendre et ses pages sourcées. Strong
  et Hevy notent et comptent, mais ne disent jamais ce que les chiffres veulent
  dire.
- **En français, pour de vrai**, et avec un mode coach.

## Ce qui manque, classé selon tes priorités

L'ordre suit la règle de la mission premium : d'abord la vitesse pendant la
séance, puis la lisibilité des chiffres, la progression, l'ergonomie, la
fiabilité, et seulement ensuite le décor.

| # | Manque | Qui l'a | Ce que ça coûte chez nous |
|---|--------|---------|---------------------------|
| 1 | **Les disques dans la série ouverte** : toucher les kg affiche « 25 + 5 + 1,25 de chaque côté ». | Strong, Hevy | Petit. Le calcul `TS.chargerBarre` existe déjà, il ne vit que sur une page web. |
| 2 | **Les séries d'échauffement proposées** à partir de la charge de travail (barre vide, 50 %, 70 %, 85 %). | Strong | Petit. Le type « échauffement » existe déjà et ne compte ni dans les records ni dans le volume. |
| 3 | **Des séances modèles** : enregistrer « Push A » et la relancer d'un appui. Aujourd'hui il y a « refaire la dernière fois » et le cycle, pas de modèles nommés. | Strong, Hevy, Boostcamp | Moyen. Nouvelle donnée à synchroniser, donc un SQL à coller. |
| 4 | **La prochaine charge dite clairement** : « la prochaine fois : 82,5 kg × 8 », d'après la double progression et le RPE. La suggestion existe, elle n'est pas encore aussi directe. | Hevy Trainer, Alpha Progression, Fitbod | Moyen. Ça touche `intelligence.js`, qui a déjà ses tests. |
| 5 | **Le poids du corps** (et les mensurations en option), avec sa courbe et la force relative au poids du corps. | Strong, Hevy | Moyen. Nouvelle donnée, donc un SQL. |
| 6 | **Une silhouette des muscles travaillés**, dans la séance et dans le récap. Le récap par groupe existe déjà, mais pas en image. | Hevy | Moyen. Un dessin SVG fait main, sans photo, avec les couleurs de groupe. |
| 7 | **La régularité comptée en semaines** (objectif de N séances par semaine, et le nombre de semaines tenues d'affilée). Jamais en jours, pour ne pas punir un repos. | Hevy et la plupart des apps grand public | Petit. Tout se calcule à partir du carnet. |
| 8 | **Une image de séance à partager** (une story Instagram : exercices, records, durée). C'est le levier pour que l'app soit vue, puisque l'audit de septembre la trouvait invisible. | Hevy, Strava | Moyen. Une image dessinée en canvas, puis le partage natif. |
| 9 | **« Envoyer à Claude / ChatGPT »** : la séance ou le mois copiés en texte propre, prêts à coller dans une IA. | Hevy (septembre 2026) | Petit. |
| 10 | **Le bilan de l'année**, façon « Wrapped » : à sortir avant la mi-décembre. | Strava, Hevy | Moyen. Une page de récap animée, qui réutilise les bilans. |
| 11 | **Comment faire l'exercice**, en un lien depuis la carte vers sa page dans Apprendre quand elle existe. | Hevy, Strong (animations) | Petit. Les pages existent déjà. |
| 12 | **La fin du repos annoncée écran verrouillé.** | Strong, Hevy (montre, écran verrouillé) | Gros, et à décider. Voir plus bas. |

## Ce qu'une PWA sur iPhone ne peut pas faire

- **Pas d'Apple Watch, pas d'Apple Santé, pas de chrono sur l'écran verrouillé
  (Live Activities), pas de widgets.** C'est la vraie avance de Strong et Hevy.
  Seule une app native ou un emballage natif (Capacitor) y donne accès. C'est une
  décision de produit, pas une correction.
- **Les notifications web marchent sur une PWA installée depuis iOS 16.4**, mais
  elles partent d'un serveur. Pour annoncer la fin d'un repos, il faudrait un
  envoi programmé côté Supabase. Un comparatif dit qu'elles ne marchent pas dans
  l'Union européenne : je ne l'ai pas vérifié, il faut le tester sur ton iPhone
  avant de construire quoi que ce soit.
- **Le retour haptique** : Safari sur iPhone n'a pas l'API de vibration. Une
  astuce passe par la case à cocher `switch` d'iOS 18. Elle est à tester sur un
  vrai téléphone avant d'en dépendre.

## L'interface et le téléphone

Rien n'a été mesuré de nouveau aujourd'hui. Les points à reprendre viennent du
code tel qu'il est :

- `app.js` fait 10 532 lignes et `index.html` 3 986, avec la couche « Salle
  noire » posée par-dessus les styles d'origine. Ça marche, mais chaque ajout
  doit passer par la couche `refonte` sinon les spécificités se battent.
- Les nouveaux écrans doivent garder les cibles de 44 px, une ligne par série,
  et les actions rares dans le menu `⋯`. Ce sont les règles de la carte
  d'exercice.

## Sources

- [Hevy, mises à jour de juillet 2026](https://www.hevyapp.com/community-updates/july-26/)
- [Hevy Trainer](https://www.hevyapp.com/announcing-hevy-trainer/)
- [Hevy sur l'App Store](https://apps.apple.com/sa/app/id1458862350)
- [Revue Hevy 2026 : limites de l'offre gratuite](https://aitoolsbakery.com/blog/hevy-review/)
- [Hevy contre Strong (Setgraph)](https://setgraph.app/ai-blog/hevy-vs-strong-app-comparison-2026)
- [Alternatives à Hevy (LastLift)](https://lastlift.pages.dev/articles/best-hevy-alternatives/)
- [Alpha Progression contre Fitbod](https://alphaprogression.com/en/blog/alpha-progression-vs-fitbod)
- [Boostcamp contre Fitbod](https://www.boostcamp.app/alternatives/fitbod)
- [Limites des PWA sur iOS (MagicBell)](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- [Notifications PWA sur iOS en 2026](https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en)
