> **English** · [Français](../fr/technique.md)

# Technical

Part of the [Top Set documentation](../../README.md#documentation).

## Stack

No framework. No bundler. No dependencies to install. Nothing to compile to work
on it: the source is served as is locally. A single deploy-time step, minification
(see [Deploying](#deploying)).

One HTML file carrying the markup and inline CSS, plus static assets.
`index.html` is about 204 KB, of which roughly 119 KB is a base64 texture; the
app's JavaScript sits beside it in `app.js` (237 KB), and the tested business
logic in `intelligence.js` (31 KB).

**Why the JS is not inline.** It was, until the security audit. An inline script
forces `script-src 'self' 'unsafe-inline'` in the Content-Security-Policy — and
that permission also allows injected event handlers. An XSS found during that
audit executed precisely because of it. With no build step there is no way to
emit a nonce on static hosting, so moving the script out is the only route to
`script-src 'self'`. It loads from the same position at the end of `<body>`, so
execution order is unchanged.

`style-src` keeps `'unsafe-inline'` on purpose: the cards carry a
`style="--card-color:…"` attribute, style injection cannot execute script, and
extracting the stylesheet would not remove the need.

Two libraries, each loaded only when it is needed: Chart.js 4.4.1 the first time
you open a progression chart, supabase-js 2.115.0 when an account comes into
play.

This is a deliberate choice for an app of this size: no toolchain to maintain, no
version drift, and the whole thing can be opened, read and edited in one file.

---

## Project structure

```
index.html               app markup and styles
app.js                   all the app logic (kept out of the HTML for the CSP)
intelligence.js          pure business logic: top set, records, 1RM, signals
sw.js                    service worker — cached shell, offline
supabase-config.js       project URL + public key (see Accounts and Supabase)
manifest.webmanifest     PWA manifest
vercel.json              security headers, caching, redirects from old paths
robots.txt  sitemap.xml  indexing; the sitemap is produced by scripts/contenu.mjs
favicon.ico              16 + 32 + 48 px, at the root where browsers look for it

guide.html  cgu.html  confidentialite.html  mentions-legales.html
                         static pages, styled by css/legal.css
apprendre.html  carnet-de-musculation.html  methode-editoriale.html  404.html
documentation/  entrainement/  exercices/  outils/
                         content pages and their sections (generated from contenu/, committed)
outils/*.js              calculators (external files: the CSP refuses inline scripts)
outils/*.csv             blank and example logbook templates, in the export format

css/                     legal.css (static pages) and contenu.css (content pages)
icons/                   icon.svg, 16/32/48 px favicons, 180/192/512 px icons (home screen, PWA)
img/                     og-image.png (share preview, 1200×630), product page screenshots,
                         hero/ (banner drawings, SVG), ambiance/ (mood images, WebP)
fonts/                   Bricolage Grotesque, self-hosted (latin + latin-ext)
vendor/                  Chart.js 4.4.1 and supabase-js 2.115.0, loaded on demand

contenu/                 content page sources, bibliography, sections (not published)
scripts/                 content page generator, palette checker (not published)
supabase/schema.sql      tables, RLS policies and sync functions
supabase/test/           the schema tested on a real Postgres (PGlite): RLS, upgrade from every version
test/                    business logic, security guards, links, content templates
docs/                    detailed documentation (fr/, en/), design system, SEO, audits, screenshots
.github/                 CI, issue templates, CONTRIBUTING.md, SECURITY.md
README.md  README.fr.md  CHANGELOG.md  LICENSE
```

Icons and the social image are generated from geometry by a script rather than
drawn by hand, so changing a brand colour means changing one value and re-running
it. That script lives outside the repository, with the logo sources.

Not everything in the repository is a page of the site: `.vercelignore` keeps
the docs, the schema, the tests and the content sources (`contenu/`,
`scripts/`) off it — only the generated pages are served. `top-set.fr/supabase/schema.sql` used
to be readable by anyone — nothing secret, security rests on RLS and not on the
schema being hidden, but nothing to serve either.

---

## Accounts and Supabase

Accounts are **optional**. Without `supabase-config.js` — or with
`window.TOPSET_SUPABASE` set to `null` — the profile says accounts are not
available, the messages bubble disappears, and the app is a pure local logbook.
Nothing breaks, no dead buttons.

There are **no runtime environment variables** (the build step only minifies): a
static site has
no server to read them. The two values live in `supabase-config.js`, committed to
this repository, and that is correct — both are public by design:

```js
window.TOPSET_SUPABASE = {
  url:     'https://<project-ref>.supabase.co',
  anonKey: '<the anon / publishable key>'
};
```

The anon key identifies the project, it does not grant access: every request is
filtered by Row Level Security against the authenticated user. What must **never**
appear here, or anywhere in Git, is the `service_role` (or `secret`) key, which
bypasses RLS, and the database password.

### Setting up your own project

1. **supabase.com/dashboard → New project.** Pick a region close to your users.
2. **SQL Editor → New query** → paste [`supabase/schema.sql`](../../supabase/schema.sql)
   → Run. The script is idempotent: re-running it changes nothing and deletes
   nothing.
3. **Authentication → Sign In / Providers → Email**: enable the provider. Turn
   *Confirm email* off while Supabase's default mailer is in use — it sends 2
   messages an hour, which will block sign-ups. Turn it back on once a real SMTP
   sender is configured.
4. **Project Settings → API**: copy the Project URL and the anon key into
   `supabase-config.js`.
5. Add your Supabase origin to `connect-src` in `vercel.json`, otherwise the CSP
   blocks every request — silently, as CSP does.

### Testing the schema

The database rules are tested against a real Postgres (PGlite), not mocked:

```bash
cd supabase/test && npm install && npm test
```

`test-rls.mjs` attacks the rules from the `authenticated` role, as the browser
would: writes, replaying a day without duplicates, isolation between users, the
coach link, messaging, notifications, anonymous visitors, cascade on account
deletion.

`test-montee.mjs` installs **every past version** of the schema on a fresh
database, adds data, then applies the current one twice. The production database
is never empty, and that is where things break: a function whose return columns
change passes on a fresh database, and Postgres refuses to "replace" it on the
real one. In the Supabase SQL editor that single error rolls back the whole
script, silently. It happened once; table-returning functions are now dropped
before being recreated, and this test runs in CI with the full history.

The same file refuses to run anywhere but in the Top Set project. This Supabase
account also hosts Yom Nutrition, and pasting the schema there raised a
missing-column error that named neither the project nor the mistake. A guard at
the top of the file now stops before the first write as soon as it recognises
the other database's tables: the whole script is a single transaction, so
nothing is written there and the other project is left intact.

---

## Running it locally

Any static file server. There is nothing to compile: the source is served as is.
To see the site exactly as it is online (minified JavaScript), run
`node build.mjs` then `npx serve dist`.

```bash
npx serve .
```

Opening `index.html` directly works too — the only thing that breaks over
`file://` is the web app manifest.

---

## Deploying

Built for static hosting. On Vercel: import the repository, pick **Other** as the
framework preset, deploy. `vercel.json` handles headers and caching,
`.vercelignore` what must not be published.

**The build step (2026-09-18).** Vercel runs `node build.mjs` and serves
`dist/` (`buildCommand` and `outputDirectory` in `vercel.json`). The script
copies exactly the served files — the repository minus `.vercelignore` and the
configuration — then minifies `app.js`, `intelligence.js`, `mesure.js` and
`supabase-config.js` with esbuild (version pinned in the script). `app.js`
goes from 92 to 51 KB gzipped. Nothing else is rewritten: no bundling, no
transpiling, the global names shared between files are kept, and `sw.js` is left
alone (its `VERSION` stays readable online). If the build fails, Vercel keeps the
previous version live. To test before pushing: `node build.mjs && npx serve dist`.

The site lives on `top-set.fr`, which redirects to `www.top-set.fr`. The domain
is written out in the Open Graph tags, canonical links, `robots.txt` and
`sitemap.xml`; the script that replaced it everywhere served once, when the
placeholder domain gave way to the real one, and has been removed.

**On every release that touches the app**, the service worker version
(`VERSION` in `sw.js`) moves up one notch: that is what tells phones to replace
the cached shell.

---

## Installing on a phone

It is a PWA — it installs without a store, gets its own icon and opens full
screen.

**iOS (Safari)** — Share, then *Add to Home Screen*.
**Android (Chrome)** — menu, then *Install app*.

Worth doing on iOS for a reason beyond convenience: Safari may clear
`localStorage` for a site not visited in about a week, but not for a site
installed on the home screen.

**Offline.** A service worker keeps the app's shell: it opens with no network,
in a basement gym, and the logbook is in `localStorage`. The page goes to the
network first so you always get the latest version, and nothing coming from
Supabase is ever cached.

**Screenshots in the manifest.** `manifest.webmanifest` lists the product
page's three screenshots (`screenshots`, `form_factor: narrow`), an `id` and
categories: on Android, Chrome uses them for a richer install dialog, like a
store listing. iOS ignores them.

**Audit of 12 September 2026.** What works and what doesn't against Hevy,
Strong, StrengthLog and French sites, what was fixed and what remains (in
French): [`docs/audit-concurrence-2026-09-12.md`](../audits/concurrence-2026-09-12.md).
