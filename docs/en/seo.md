> **English** · [Français](../fr/referencement.md)

# Search engines

Part of the [Top Set documentation](../../README.md#documentation).

## Search engines

**Home page: the font arrives before the first paint.** Lighthouse (mobile,
production, 12 September 2026) measured a layout shift of 0.101 on the home
page, just above the 0.1 "good" threshold: text was first laid out in the system
font, then re-set when Bricolage arrived. The latin font is now preloaded
(`<link rel="preload">`), and a guard checks it is the one the page asks for —
otherwise the browser would download it twice. Measured again after deploying,
three runs: CLS 0, then 0.088 and 0.088, performance 93 to 95 (was 92), first
contentful paint 1.9 to 2.0 s (was 2.3). The remaining shift comes from the day
panel. The home page keeps a single
`<h1>`: the header logo is a paragraph.

What code can do is done: a **title** that says what the app is (« Top Set —
carnet de musculation gratuit ») rather than just its name, which is also the
name of a training method; a **description** under 160 characters, where Google
cuts; the **site name** declared as `WebSite` structured data; a 48 px
**favicon** and a `favicon.ico`; `robots.txt` and `sitemap.xml`; one canonical
URL per page, with `top-set.fr` redirecting to `www.top-set.fr`. The guards in
`test/gabarits.test.mjs` check the title and description length, the
`WebSite` block, the favicon and the sitemap.

The content strategy lives in [`docs/seo/content-strategy.md`](../seo/content-strategy.md)
(French): audit, topic clusters and pillar pages, scoring method, the 20 topics
selected out of 83, the architecture, risks and the Search Console loop.
`docs/seo/sujets.json` is the source of truth; `node docs/seo/matrice.mjs`
derives the scores, regenerates the ranked matrix and the inventory, and refuses
two pages targeting the same URL or query. Research data is versioned and dated
in `docs/seo/recherche/`; no search volume is made up.

The rest is not code. Until the domain is declared in **Google Search Console**
(one DNS record at the registrar, then submitting the sitemap), Google only finds
it by chance. Indexing then takes days to weeks; ranking for generic queries
takes time, links from other sites, and pages that answer what people search.

### Content pages

Next to the app, static pages answer real searches (in French): one notion per
page in `/documentation`, guides in `/entrainement`, exercises in
`/exercices`, calculators in `/outils`, a product page
(`/carnet-de-musculation`) and a page on how they are made
(`/methode-editoriale`), all grouped under one main section, **Apprendre**
(`/apprendre`). In the app, Apprendre is a fourth tab next to SÉANCE,
CARNET and PROGRÈS: a static screen of six cards and a button to `/apprendre`;
it stores and computes nothing. Content pages carry a bar with the same
sections under the header, the current one lit like an app tab, and the
breadcrumb goes through Apprendre. The service worker is unchanged, and every
visited page stays readable offline. Published pages: the top set, a 1RM calculator, the product
page, the plank; then, in batches of
three, the RPE scale, reps in reserve (RIR) and muscle failure; the 1RM, the
back-off set and an RPE table; progressive overload, rep ranges and sets per
muscle; rest times, plateaus and tracking your progress; the bench press, bar
weights and a spreadsheet log template. A page on the log French high-school
students keep for PE (EPS) was published, then withdrawn: they are not Top Set's
audience. Its address now redirects permanently to `/carnet-de-musculation`
(`redirects` in `vercel.json`), and its topic is `RETIRED` in the matrix.

Still no framework, and the content pages are not built on Vercel (the only
deploy-time step minifies the app's JavaScript). Each page's source lives in
`contenu/`: an HTML file whose first comment holds JSON metadata.
`node scripts/contenu.mjs` turns them into the published pages, section hubs,
the 404 and `sitemap.xml`; generated pages are committed. In the body,
`[[/path|text]]` is a checked internal link and `[@key]` a numbered citation
resolved from `contenu/sources.json`, which only lists sources actually opened
(DOI checked on Crossref, abstract read on PubMed; a `lu` field says what was
read, and the page shows it). The template writes title, description, canonical,
Open Graph, breadcrumb, byline, sources and JSON-LD (`BreadcrumbList`,
`Article`, `SoftwareApplication` on the product page only, never `FAQPage`).

Each page type has a template the generator enforces. A **definition** needs
its « what it is », « how to use it », « examples » and « common mistakes »
sections — found by the `id` of their `<h2>`, the heading text stays free — and
at least three **related terms** (`termes`); a term whose topic is published in
the matrix links to its page on its own, the day that page ships. An
**exercise** needs its **fiche** (muscles, equipment, level, movement,
breathing), shown before the table of contents with its citations numbered
like the rest, its « setup and execution », « common mistakes » and
« variations » sections, at least one related notion, and a related exercise
once at least three other exercise pages exist (before that, the link would be
artificial: the bench press has nothing to do with the plank). « À lire ensuite » labels each linked page with its
section. `test/contenu.test.mjs` strips these from a copy of the site and
checks that the generator refuses, saying what is missing.

The generator — and CI, with `--verifier` — refuses an unknown or unexplained
citation, a link to a missing page, titles over 60 characters, descriptions
outside 110–160 or duplicated anywhere on the site, a page over 30 KB gzipped,
inline scripts or styles, a page whose topic is not `PUBLISHED` in the matrix
or targets another query, and stale generated files. A section hub is indexable
from three pages up. Pages are signed « Yom Industry × Claude (Anthropic) »: AI
help is stated plainly and explained on `/methode-editoriale`; structured data
names Yom Industry, the publisher, as author.
