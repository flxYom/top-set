> **English** · [Français](README.fr.md)

![Top Set](og-image.png)

# top-set

**Log a set in ten seconds. Watch your progress build over months.**

[![CI](https://github.com/flxYom/top-set/actions/workflows/ci.yml/badge.svg)](https://github.com/flxYom/top-set/actions/workflows/ci.yml)
![Status](https://img.shields.io/badge/status-beta-orange)
[![Licence](https://img.shields.io/badge/licence-all%20rights%20reserved-lightgrey)](LICENSE)

A weightlifting logbook that runs entirely in the browser. You log sets, weights,
reps and RPE during a session; it gives you volume, records and progression over
time.

No account. No sign-up. No server holding your data. Everything lives in the
browser's `localStorage`, on the device you use. That is a deliberate trade, and
it cuts both ways — see [Where your data lives](#where-your-data-lives).

The interface is in French.

**This is an early beta**, used and developed day to day by its author. Expect
rough edges and the occasional breaking change. If something is broken, confusing,
or missing, [open an issue](../../issues/new/choose) — that is exactly what this
repository is for right now.

<p align="center">
  <img src="screenshots/planning.png" width="240" alt="Weekly planning screen: day pills for the week, a chest-day summary banner, and a logged bench press exercise" />
  <img src="screenshots/session.png" width="240" alt="Logging a set: weight and rep steppers, RPE, rest, and the duplicated third set" />
  <img src="screenshots/recap.png" width="240" alt="Weekly recap: volume lifted, sessions, sets, an assiduity heatmap, and the muscle-group split" />
</p>
<p align="center"><sub>Planning · Logging a set · Weekly recap — real screens, seeded with placeholder numbers for these screenshots.</sub></p>

---

## Contents

- [What it does](#what-it-does)
- [Where your data lives](#where-your-data-lives)
- [Backup and recovery](#backup-and-recovery)
- [Privacy by construction](#privacy-by-construction)
- [Stack](#stack)
- [Project structure](#project-structure)
- [Running it locally](#running-it-locally)
- [Deploying](#deploying)
- [Installing on a phone](#installing-on-a-phone)
- [What it is not](#what-it-is-not)
- [Roadmap](#roadmap)
- [Licence](#licence)

---

## What it does

**Weekly planning.** A row of day pills is your week. Pick a day, add exercises,
add sets. Arrows move between weeks; an `AUJOURD'HUI` button jumps back to today
and turns orange as soon as you have navigated away from the current week.

**Set duplication.** `+ SÉRIE` copies the previous set — weight, reps, RPE, rest.
Only `fait` resets. Five identical sets means typing one and tapping four times.

**Steppers.** `−` and `+` add or remove 2.5 kg without opening the keyboard. It
is the most frequent action between two sets, so it costs one tap.

**RPE per set.** Reps-in-reserve scale, 10 down to 6 in half points: 10 is
failure, 9 leaves one rep, 8 leaves two. Optional — leave it empty and nothing
breaks.

**Rest per set**, not per exercise, and carried over when a set is duplicated.

**Exercise memory.** Type an exercise that is not in the built-in list and it is
remembered for next time, muscle group included. Saved on blur rather than on
each keystroke, so you do not end up with `B`, `Be`, `Ben`.

**Recap.** Total volume (weight × reps, summed), a training calendar, per-exercise
records and a muscle-group split — over a week, a month or a year.

**Progression chart** per exercise, drawn from your own history.

**Decimal input that actually works.** The weight field accepts both `62,5` and
`62.5`. A French keyboard offers a comma, and `<input type="number">` silently
rejects it — the field empties and the set loses its weight. That field is
`type="text"` with `inputmode="decimal"` for exactly this reason.

---

## Where your data lives

In `localStorage`, on one device, in one browser. Nowhere else.

**What that buys you:** no account, instant start, nothing to leak, no server
bill.

**What it costs you:** no sync between devices, and the logbook is *destroyed* by
clearing site data, switching phones, or browsing in a private window.

There is one storage key, `musculation_sessions`, holding a map of
`YYYY-MM-DD` → session. Custom exercises live under `topset_custom_exercises`.

---

## Backup and recovery

Since the browser is the only copy, the app takes losing it seriously.

**Export.** The `⇅` button gives you a JSON file containing every session and
your custom exercises. Download it, share it, or copy it as text. That file is
the only copy that survives a wiped browser.

**Import** is two-step: the first press shows what you have now and what the file
contains, the second applies it. Replacing is irreversible, so it asks twice.

**Overwrite guard.** `saveLocal()` rewrites the whole logbook on every save. If
`state.sessions` were empty at the wrong moment — a failed load, corrupted JSON —
that single call would erase everything, permanently and silently. So:

- The app **refuses** to replace a filled logbook with an empty one, and says so.
  The condition lifts on its own as soon as there is one real day again.
- Every save keeps the **previous version** under a recovery key.
- Unreadable JSON is **set aside** rather than overwritten.
- A `RÉCUPÉRER N JOURS` button appears in the `⇅` panel whenever a recoverable
  copy holds more than what is currently loaded.

---

## Privacy by construction

The privacy policy claims nothing leaves your device. That claim is enforced,
not just written:

**No third-party requests.** Bricolage Grotesque and Chart.js used to load from
Google Fonts and cdnjs, which sent every visitor's IP address to Google and
Cloudflare on each page load. Both are now served from the site itself.

**A strict CSP** in `vercel.json` — `default-src 'self'`, `connect-src 'self'` —
which is only possible *because* there are no external origins. It blocks
exfiltration at the browser level.

**No cookies, no analytics, no trackers.** The only processing that exists is the
host's own access logs, and the privacy page says so.

---

## Stack

No framework. No build step. No bundler. No dependencies to install.

One HTML file with inline CSS and JavaScript, plus static assets. `index.html` is
about 218 KB, of which roughly 119 KB is a base64 texture.

Chart.js 4.4.1 is the only library, loaded on demand the first time you open a
progression chart.

This is a deliberate choice for an app of this size: no toolchain to maintain, no
version drift, and the whole thing can be opened, read and edited in one file.

---

## Project structure

```
index.html               the entire app — markup, styles, logic
guide.html               how-to page
cgu.html                 terms of use              (French)
confidentialite.html     privacy policy            (French)
mentions-legales.html    legal notice              (French)
legal.css                shared styles for the pages above
chart.umd.js             Chart.js 4.4.1, loaded on demand
fonts/                   Bricolage Grotesque, self-hosted (latin + latin-ext)
screenshots/             README screenshots (planning, session, recap)
icon.svg                 primary favicon
favicon-16/32.png        fallbacks where SVG favicons are not supported
icon-180/192/512.png     home screen and PWA icons
og-image.png             social preview, 1200×630
manifest.webmanifest     PWA manifest
vercel.json              security headers and cache policy
robots.txt  sitemap.xml  indexing
set-domaine.mjs          replaces the placeholder domain everywhere
LICENSE  SECURITY.md  CONTRIBUTING.md  CHANGELOG.md
.github/                 issue templates, PR template, CI workflow
```

Icons and the social image are generated from geometry by a script rather than
drawn by hand, so changing a brand colour means changing one value and re-running
it.

---

## Running it locally

Any static file server. There is nothing to compile.

```bash
npx serve .
```

Opening `index.html` directly works too — the only thing that breaks over
`file://` is the web app manifest.

---

## Deploying

Built for static hosting. On Vercel: import the repository, pick **Other** as the
framework preset, deploy. `vercel.json` handles headers and caching.

The domain appears 23 times across the HTML, `robots.txt` and `sitemap.xml` —
Open Graph tags, canonical links, sitemap URLs. One command updates all of them:

```bash
node set-domaine.mjs yourdomain.com
```

It accepts `https://your.site/`, `www.your.site` or `your.site`, and refuses
anything that is not a domain.

---

## Installing on a phone

It is a PWA — it installs without a store, gets its own icon and opens full
screen.

**iOS (Safari)** — Share, then *Add to Home Screen*.
**Android (Chrome)** — menu, then *Install app*.

Worth doing on iOS for a reason beyond convenience: Safari may clear
`localStorage` for a site not visited in about a week, but not for a site
installed on the home screen.

**Not offline yet.** There is no service worker: opening the app still needs a
network connection (`index.html` is served `no-cache` on purpose, so you always
get the latest version). Once the page is loaded, whatever is already in
`localStorage` stays readable even if the connection drops mid-session — but
launching Top Set with no connection at all doesn't work today. Real offline
support is on the [roadmap](#roadmap).

---

## What it is not

- **Not a coaching app.** It records what you did; it does not tell you what to do.
- **Not a medical device.** Weights and RPE are what you typed. Nothing is checked,
  validated or advised.
- **Not multi-device.** There is no sync, by design, for now.
- **Not social.** No feed, no friends, no leaderboard.

---

## Roadmap

**Short term:** real offline support. There is no service worker yet (see
[Installing on a phone](#installing-on-a-phone)) — that is next, ahead of
anything below.

**Longer term:** accounts and sync are the obvious next step, and the schema for it already exists
and is tested — three relational tables (sessions → exercises → sets) with
row-level security, rather than one JSON blob per user.

It is deliberately not wired up yet. The current version needs no account, which
is the fastest way to find out whether people actually use the thing before
adding a backend, a login and a privacy policy that has to describe real data
processing.

When it lands, the privacy policy is rewritten, its version incremented, and
consent asked before anything leaves a device.

---

## Licence

All rights reserved. The code is public to read; it is not licensed for reuse.
