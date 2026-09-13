# Refonte « Salle noire » — direction artistique (septembre 2026)

Passe de refonte visuelle et d'ergonomie de l'app. Même contenu, mêmes écrans,
mêmes données, même logique : seules les surfaces, la typographie, la navigation
et les micro-interactions changent.

## Point de départ

L'interface d'origine est néo-brutaliste : bordures crème de 2 à 2,5 px, ombres
décalées de couleur sous chaque bloc (35 règles), gros blocs orange pleins,
libellés en capitales partout, une seule police. C'est une vraie identité, mais
tout crie au même volume : sur un écran de téléphone, rien ne ressort parce que
tout ressort.

## Ce que font les apps haut de gamme (sources lues)

- **Hevy, Strong** (fiches App Store) : fond sombre uni, une série par ligne, la
  dernière fois en gris, la série faite teintée de vert, navigation en bas.
- **Tendances 2026 des apps fitness sombres** ([Canvas Builder](https://canvasbuilder.co/blog/fitness-website-design-trends-2026),
  [Envato](https://elements.envato.com/learn/color-scheme-trends-in-mobile-app-design)) :
  fond quasi noir, **un seul accent énergique** réservé aux actions et à la
  progression, gros chiffres, espacement généreux, navigation au pouce en bas.
- **Dribbble**, recherche « dark mode fitness app » : cartes arrondies, surfaces
  étagées plutôt que bordures, gros chiffres, puces translucides.
- **Pinterest** n'a pas pu servir : la recherche exige un compte, et je ne me
  connecte pas à la place du propriétaire.

## Décisions

| Sujet | Choix | Pourquoi |
|---|---|---|
| Fond | `#0c0b0a`, légère lueur orange en haut | quasi noir, garde la chaleur de la marque |
| Surfaces | trois niveaux `#151412` / `#1d1b19` / `#27241f`, traits à 8 % | la profondeur vient des surfaces, pas des bordures |
| Accent | l'orange `#ff5c38`, en dégradé, **seul** | les actions, l'onglet actif, le jour choisi |
| Couleurs de sens | vert = fait, jaune = record, bleu = commentaire | inchangées ; les couleurs de groupes musculaires aussi |
| Titres et chiffres | Bricolage Grotesque, déjà auto-hébergée | c'est la voix de Top Set |
| Texte courant | police du système (SF Pro sur iPhone) | plus lisible en petit, aucun téléchargement |
| Formes | rayons 10 / 14 / 20 / 26 px, traits de 1 px | fini des blocs taillés à la hache |
| Ombres | une ombre douce, et une lueur orange pour l'action principale | une seule chose se soulève à la fois |
| Navigation | barre d'onglets **en bas** sur téléphone, avec icônes ; barre segmentée en haut sur ordinateur | le pouce, pas l'index ; elle se range quand le clavier sort |
| En-tête | wordmark léger (TOP clair, SET orange), boutons ronds | l'en-tête ne vole plus la vedette au bandeau |
| Mouvement | appui qui s'enfonce, vue qui glisse de 6 px, rien si l'appareil demande moins d'animations | vivant sans être bavard |

## Outils

- **Higgsfield** : compte gratuit, 10 crédits. Utilisé pour une image d'ambiance,
  pas plus ; les dessins du bandeau restent des SVG (légers, hors ligne, teintés
  par le groupe).
- **Canva** : écarté pour l'interface. Son générateur propose des candidats à
  choisir à la main, et des icônes en image seraient moins nettes et plus lourdes
  que les icônes SVG en ligne. Rien à y produire que le code ne fasse mieux ici.

## Mise en œuvre

Une couche CSS posée **après** les styles d'origine (`<style id="refonte">`),
quelques icônes dans les onglets, et une ligne de JavaScript qui range la barre
du bas quand le clavier sort. Retirer la couche rend l'ancienne interface.
