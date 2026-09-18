> **English** · [Français](README.fr.md)

![Top Set](img/og-image.png)

# top-set

**Log a set in ten seconds. Watch your progress build over months.**

[![CI](https://github.com/flxYom/top-set/actions/workflows/ci.yml/badge.svg)](https://github.com/flxYom/top-set/actions/workflows/ci.yml)
![Status](https://img.shields.io/badge/status-beta-orange)
[![Licence](https://img.shields.io/badge/licence-all%20rights%20reserved-lightgrey)](LICENSE)

A weightlifting logbook that runs entirely in the browser. You log sets, weights,
reps and RPE during a session; it gives you volume, records and progression over
time.

The account is optional. Without one, everything lives in the browser's
`localStorage`, on the device you use, and no server sees anything. With one,
the logbook is also copied to Supabase and follows you from device to device,
and messaging opens up: the team, your coach, your clients. See
[Your data](docs/en/data.md#where-your-data-lives).

The interface is in French.

**This is an early beta**, used and developed day to day by its author. Expect
rough edges and the occasional breaking change. If something is broken, confusing,
or missing, [open an issue](https://github.com/flxYom/top-set/issues/new/choose) — that is exactly what this
repository is for right now.

<p align="center">
  <img src="docs/screenshots/planning.png" width="240" alt="Weekly planning: the header's messages, profile and data buttons, today's chest-day banner, the week's day pills and the muscle groups trained" />
  <img src="docs/screenshots/session.png" width="240" alt="Logging the bench press: the suggested load, then one set per row — type, last time, weight, reps, RPE, check — and the tools of the current set" />
  <img src="docs/screenshots/recap.png" width="240" alt="Weekly recap: volume lifted, sets, sessions, movements, and the assiduity strip" />
</p>
<p align="center"><sub>Planning · Logging a set · Weekly recap — real screens, seeded with placeholder numbers for these screenshots.</sub></p>

---

## At a glance

- **Log fast, mid-session.** The app opens on today's session: one row per set
  (weight, reps, RPE, check), a stopwatch for timed exercises, cardio (duration,
  speed, incline), and a rest timer that counts on its own.
- **Never start from scratch.** Redo last time, last week's exercises, a
  suggested load.
- **See where you stand.** A calendar planning (day, week, month), planned
  sessions and history, an end-of-session recap compared with the same session
  last week, weekly, monthly and yearly recaps, and each exercise's progression
  and records.
- **Keep your data.** Works offline, no account by default, JSON or spreadsheet
  export and import. An optional account syncs the logbook across devices.
- **Get coached.** Messaging with the team, and a coach ↔ client link: the coach
  reads the logbook, read-only, once both sides agree.
- **Learn.** Sourced pages on concepts, training and exercises, plus tools (1RM
  calculator, RPE table, logbook template). The interface and the pages are in
  French.

## Documentation

| Document | What's in it |
| --- | --- |
| [Features](docs/en/features.md) | everything the app does, screen by screen |
| [Your data](docs/en/data.md) | where it lives, sync, backup, migration, privacy |
| [Coach and administration](docs/en/coach-and-admin.md) | the coach ↔ client link, messaging, feedback, the admin space |
| [Technical](docs/en/technical.md) | stack, project structure, Supabase accounts, running, deploying, installing |
| [Search engines](docs/en/seo.md) | content pages and SEO |
| [Design system](docs/design/DESIGN_SYSTEM.md) | colours, type, interface rules, closed decisions (in French) |
| [Security](.github/SECURITY.md) · [Contributing](.github/CONTRIBUTING.md) · [Changelog](CHANGELOG.md) | |

The rest of `docs/`: the SEO strategy (`docs/seo/`), dated audits
(`docs/audits/`), the art direction (`docs/design/`) and this README's
screenshots (`docs/screenshots/`).

## Repository layout

```
index.html  app.js  intelligence.js  sw.js    the app
css/  icons/  img/  fonts/  vendor/           what the app and the pages load
documentation/  entrainement/  exercices/  outils/  *.html
                                              site pages (content pages are generated)
contenu/  scripts/                            content page sources and generator
supabase/                                     schema, RLS and its tests
test/                                         app and page tests
docs/  .github/                               documentation, CI, security
```

File-by-file details are in [Technical](docs/en/technical.md#project-structure).

## Running it locally

Nothing to compile, no dependencies to install:

```bash
npx serve .
```

The only build is at deploy time: `node build.mjs` copies the served files into
`dist/` and minifies the app's JavaScript (see
[Technical](docs/en/technical.md#deploying)). `npx serve dist` shows the site
exactly as it goes online.

The tests, as CI runs them:

```bash
node test/intelligence.test.mjs && node test/gabarits.test.mjs && node test/liens.test.mjs && node scripts/contenu.mjs --verifier && node test/contenu.test.mjs
```

---

## What it is not

- **Not an automatic trainer.** It records what you did; it does not tell you what to do.
- **Not a medical device.** Weights and RPE are what you typed. Nothing is checked,
  validated or advised.
- **Not social.** No feed, no friends, no leaderboard. You write to the team,
  your coach or your clients — to no one else.

---

## Roadmap

**Shipped:** optional accounts and cloud sync on Supabase, the service worker and
offline support, the business logic extracted and tested in `intelligence.js`,
the per-exercise progression page, user feedback and the admin space.

**Shipped since:** the coach ↔ client link (an invite code generated by the
coach, accepted on both sides, consented to and revocable, giving the coach
read access to the client's logbook); the support message thread — one thread
per person, the same from both sides, with sender-aligned bubbles, an automatic
read receipt on open, a waiting bubble while no reply has come, and Enter to
send — where every feedback now opens the conversation, followed by an
acknowledgement signed `systeme` rather than `admin` (nobody has read it yet);
and a coach ↔ client conversation in its own table, `messages_coach`, writable
only while the link is active, readable by the client even after they end it.

**Since then:** one inbox for every conversation in the app — the team, your
coach, your clients — with an unread badge in the header; timed exercises
(planks, wall sits) stored as `45 s` in the existing reps field, so no format
changes; imports that add what is missing and never replace; separate Profile
and Data sheets; sticky tabs that no longer slide under the iPhone status bar,
a back-to-top button, and no more accidental zoom. A schema upgrade test now
installs every past schema version before applying the current one.

**In progress:** session templates filed in folders and assignable into a
client's logbook, and a per-session debrief. `profils` is the foundation for
all of it — that is why it was written first.

**Still open:** the return leg of the password-reset link has never been
exercised with a real email. Resend's DNS records are published on `top-set.fr`
and the API key is wired into Supabase's SMTP settings (per the owner, 11
September 2026 — not verified from the repo); what remains is a full round trip.

---

## Licence

All rights reserved. The code is public to read; it is not licensed for reuse.
