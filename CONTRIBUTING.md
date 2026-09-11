# Contributing

Top Set is a solo, personal project (see [`LICENSE`](LICENSE) — the code
is public to read, all rights reserved). That shapes how contributions
work here:

## Bug reports & ideas — always welcome

The most useful contribution is a good [issue](../../issues/new/choose):
a clear bug report, a UX friction point, or a feature idea. Please
include your browser/OS and steps to reproduce for bugs.

## Pull requests

Because of the licence, this project isn't set up to accept large
external contributions (that would need a proper contributor
agreement, which doesn't exist yet). Small, low-risk fixes are still
welcome, for example:

- Typos or wording fixes in the UI or the docs.
- Accessibility fixes (labels, contrast, focus states).
- Fixes to a clearly broken link or a small bug, with a minimal diff.

For anything bigger — a new feature, a redesign, a refactor — please
open an issue first to discuss it before writing code. That avoids
spending time on a PR that doesn't fit the project's direction (see
"What it is not" and "Roadmap" in the [README](README.md)).

## Running the project locally

No build step, no dependencies to install:

```bash
npx serve .
```

Or just open `index.html` directly — see the README's
[Running it locally](README.md#running-it-locally) section for the one
caveat (the web app manifest needs an actual server, not `file://`).

## Project structure

The app is `index.html` (markup and CSS), `app.js` (the interface and the
sync) and `intelligence.js` (pure business logic, tested). Run the tests
before sending anything:

```bash
node test/intelligence.test.mjs && node test/gabarits.test.mjs && node test/liens.test.mjs && node scripts/contenu.mjs --verifier
```

`guide.html`, `cgu.html`, `confidentialite.html` and
`mentions-legales.html` are static pages sharing `legal.css`.

The content pages (`documentation/`, `entrainement/`, `exercices/`,
`outils/`, `apprendre.html`, `carnet-de-musculation.html`, `methode-editoriale.html`,
`404.html`) and `sitemap.xml` are **generated**: edit their source in
`contenu/`, then run `node scripts/contenu.mjs`. Never edit the generated
files by hand — CI fails when they differ from their source. A page may only
cite sources listed in `contenu/sources.json`, each one actually opened. See the
README's [Project structure](README.md#project-structure) section for
the full list.
