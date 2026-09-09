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
- [Migrating an existing logbook](#migrating-an-existing-logbook)
- [Privacy by construction](#privacy-by-construction)
- [Accounts and Supabase](#accounts-and-supabase)
- [Sessions: two tabs](#sessions-two-tabs)
- [The coach link](#the-coach-link)
- [Feedback and administration](#feedback-and-administration)
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

**Without an account** — the default — in `localStorage`, on one device, in one
browser. Nowhere else.

**What that buys you:** no account, instant start, nothing to leak, no server
bill.

**What it costs you:** no sync between devices, and the logbook is *destroyed* by
clearing site data, switching phones, or browsing in a private window.

**With an account**, a copy also lives in Postgres at Supabase, so the same
logbook opens on any device. The phone keeps its copy either way: the account
does not replace local storage, it backs it up.

Seven tables. Five carry the logbook — `seances`, `exercices`, `series`,
`exercices_perso`, `consentements` — and no one ever sees another person's row.
Two came later:

- **`profils`** — pseudonym, role, sign-up date, last-seen date. The pseudonym
  still lives in the account metadata; this column is a queryable mirror of it,
  because Supabase's `auth` schema is not readable from a browser. No logbook
  data, no email address.
- **`retours`** — user feedback. Deleting an account does not erase the
  feedback, it anonymises it (`on delete set null`): leaving is a right,
  erasing a bug you reported is not.

### One logbook per account

The local logbook lives under a single key, shared by the whole device. As long
as one person means one device, that is invisible. The moment two accounts sign
in on the same phone, the second one saw the first one's logbook — and the app
offered to upload it to *their* account, which changed its owner for good.

So: **the logbook follows the account, not the device.** On sign-in, if the
logbook present belongs to a different id, it is filed away under
`topset_carnet_<user_id>` and the arriving account's own logbook is restored if
it had one here. The format does not change, and neither does the
`musculation_sessions` key — its contents are swapped.

Three properties worth noting:

- **Nothing is deleted.** Filing always precedes clearing, and a richer filed
  logbook is never overwritten by a poorer one.
- **The outbound queue travels with the logbook.** Keeping it would push one
  account's days into the other's on the next sync.
- **A filed logbook can only be retrieved by its owner.** That is also the right
  privacy rule: the other account must not be able to take it back.

Signing out applies the same rule. The code used to say that clearing the
logbook on sign-out would lose data — true while there was nowhere to put it.
Now there is: signing out files the logbook and leaves the app blank, so whoever
opens the phone next, account or not, sees nothing.

One email address, one logbook.

### How the sync works

`localStorage` stays the source of truth for the UI. Every change is written
locally first and immediately — the screen never waits for the network. Supabase
is a copy that follows.

The unit of sync is **the day**, because it is already the unit of the app:
`state.sessions` is a `date → session` map. `pousser_jour()` rewrites a whole day
atomically, which removes duplicates, partial merges and orphaned sets as a class
of bug rather than handling them case by case.

A change marks its day and the push waits 2.5 s of quiet, so typing does not fire
a request per keystroke. Offline, the queue of pending days lives in
`localStorage` and is replayed on the `online` event and when the tab regains
focus. **A day only leaves the queue once the server has confirmed it.**

Storage keys: `musculation_sessions` (the logbook), `topset_custom_exercises`
(remembered exercises), `topset_sync` (queue and sync cursor), `topset_conflits`
(the losing side of a conflict, never discarded silently).

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

## Migrating an existing logbook

Someone who has been using the app locally and then creates an account is asked
what to do — never migrated automatically, because the device may have belonged
to someone else.

```
local data → detected → migration offered → pushed → verified
```

The migration is **non-destructive by construction**: local storage is the app's
cache, so nothing there is ever deleted — that is a property of the design, not a
promise. When a day exists on both sides, the fuller one wins and the other is
kept aside in `topset_conflits`.

It is **idempotent**: pushing the same day twice produces the same rows, because
a day is replaced wholesale rather than appended to.

It only reports success after re-reading the cloud and counting the sets one by
one. Without that step, "migrated" would only mean "no request returned an
error".

---

## Privacy by construction

The privacy policy claims nothing leaves your device. That claim is enforced,
not just written:

**No third-party requests.** Bricolage Grotesque, Chart.js and supabase-js are all
served from the site itself. Loading them from a CDN would send every visitor's IP
address to Google or Cloudflare on each page load, whether or not they have an
account.

**A strict CSP** in `vercel.json` — `default-src 'self'`, `script-src 'self'`
with no `'unsafe-inline'`, `object-src 'none'`, `frame-ancestors 'none'`, and
`connect-src` limited to `'self'` plus the project's own Supabase origin. Nothing
else can be contacted, which blocks exfiltration at the browser level, and no
injected script can run even if an `esc()` were missed somewhere.

**Two layers of privileges, not one.** Supabase grants every table privilege to
`authenticated` by default on each new table. The schema revokes them and grants
back only what is used: consent records and feedback can be written and read
back, never edited or deleted. RLS already guaranteed that; the table privilege
says it again so the guarantee does not rest on a single layer.

**No `UPDATE` policy on `profils`, deliberately.** RLS filters rows, not columns:
"users may edit their own profile" would also have allowed
`update profils set role = 'admin' where user_id = auth.uid()`. Everything goes
through `toucher_profil()`.

**An imported file is treated as hostile.** Capped at 8 MB before it is read,
identifiers outside `[A-Za-z0-9_-]{1,64}` are replaced, the muscle group is
checked against the closed list, and remembered exercises are re-validated key by
key. No legitimate data is rewritten: `test/gabarits.test.mjs` asserts that every
historical identifier passes the filter.

**Nothing is downloaded for people who do not have an account.** supabase-js is
209 KB and is fetched only when a session already exists or the account panel is
opened.

**Row Level Security on every table.** Each row carries its owner's id, and the
database refuses any read or write that does not match the authenticated user.
Foreign keys are composite `(user_id, id)`, so a row cannot even structurally
belong to someone else's session. The client never sends a `user_id`: it comes
from the JWT, server-side.

**No cookies, no analytics, no trackers.** The only processing that exists is the
host's own access logs, and the privacy page says so.

---

## Sessions: two tabs

The **SÉANCES** view is split in two. *Mes séances* holds what is left to do —
sessions prepared but not yet logged, today's, and upcoming ones — sorted oldest
first, so a skipped session rises to the top instead of getting buried. The
*Créer ma séance* box lives there. *Historique* holds what is done, newest first,
grouped by month.

The boundary is whether the session has been logged, not the date alone: a
session logged today stays in *Mes séances* until tomorrow, because it is still
the one being worked on.

---

## The coach link

The only opening in the logbook wall, and it is four `SELECT` policies added
*beside* the existing ones rather than modifying them: two permissive policies
add up, so the owner keeps every right and the coach gets read access only.

**The link exists only if both sides acted.** The coach generates an 8-character
code (alphabet without `O`/`0` or `I`/`1` — it gets read out loud), the client
enters it, the coach accepts. A hand-typed nickname would hand a whole logbook to
a stranger on one typo; a code is either right or wrong, never almost.

**What a coach can do:** read their client's sessions, exercises, sets and
remembered exercises, and see their nickname.
**What they cannot:** change or delete anything, see the email address, the
consent records or the feedback. There is no function for it.

**One active coach** per person, enforced by a partial unique index rather than
an application rule someone could forget. **Revocable from both sides**, taking
effect immediately: the policy re-reads the status on every query, so there is no
token to expire and no cache to clear. The client's **consent** is dated and
versioned in `consentements` at the moment they make the request.

### The design point that matters

`tirer_jours_de(client)` is `security invoker` and **checks no permission at
all**. It asks for that client's sessions and RLS answers. With no active link
the result is empty — not because an `if` decided so, but because the database
has nothing to show. There is no check to forget in that function, and a test
asserts it never becomes `security definer`.

47 tests cover this mechanism alone: before the link, while pending, after
acceptance, what the coach cannot do, the third party who is neither side, the
rejected second coach, revocation, ending the coaching, and `anon` throughout.

---

## Feedback and administration

### Feedback

A "Nous faire un retour" link in the footer opens a sheet: three kinds — `bug`,
`idee`, `question` — a body capped at 4,000 characters, and the list of what you
already sent with its status. An account is required: that is what makes a reply
possible, and what keeps a bot from filling the table.

Sent along with the message: the current view, the screen size, the user agent
truncated to 160 characters, and a "running as a PWA" flag. Enough to reproduce a
bug, nothing from the logbook. The screen says so before you send.

The bounds live in the database, not in the form — `check` constraints on the
kind, the status, the body length and the context size. You do not defend a table
with JavaScript.

### The admin space

Restricted to the `admin` role. Eight counters (sign-ups, new and active at 7 and
30 days, sessions, sets, pending feedback), the feedback list with controls to
mark items read or handled, and the member list sorted by last visit.

**What it does not show:** no email address, and no logbook row. The four
functions return aggregates only. An administrator sees *how many* sessions are
logged, never what is in them — a direct `select` on `seances` is denied to them
like to anyone else, and a test asserts it on every run.

The role check lives **inside the functions**, as their first statement, not in
the interface: hiding a button has never protected anything.

### Granting yourself the admin role

There is deliberately no function for it. It is done once, by hand, after opening
the app at least once so the profile row exists — Supabase → SQL Editor:

```sql
update public.profils set role = 'admin'
where user_id = (select id from auth.users where email = 'you@example.com');
```

---

## Stack

No framework. No build step. No bundler. No dependencies to install.

One HTML file carrying the markup and inline CSS, plus static assets.
`index.html` is about 182 KB, of which roughly 119 KB is a base64 texture; the
app's JavaScript sits beside it in `app.js` (166 KB).

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

Chart.js 4.4.1 is the only library, loaded on demand the first time you open a
progression chart.

This is a deliberate choice for an app of this size: no toolchain to maintain, no
version drift, and the whole thing can be opened, read and edited in one file.

---

## Project structure

```
index.html               the app's markup and styles
app.js                   all of the app's logic (moved out of the HTML for CSP)
intelligence.js          pure business logic: top set, PRs, 1RM, signals
sw.js                    service worker — cached shell, offline support
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
supabase.umd.js          supabase-js 2.115.0, loaded on demand
supabase-config.js       project URL + public anon key (see Accounts)
supabase/schema.sql      tables, RLS policies and sync functions
supabase/test/           the schema's RLS test bench (PGlite) — 124 tests
test/                    business logic (87), hardening guards (50), links (19)
set-domaine.mjs          replaces the placeholder domain everywhere
LICENSE  SECURITY.md  CONTRIBUTING.md  CHANGELOG.md
.github/                 issue templates, PR template, CI workflow
```

Icons and the social image are generated from geometry by a script rather than
drawn by hand, so changing a brand colour means changing one value and re-running
it.

---

## Accounts and Supabase

Accounts are **optional**. Without `supabase-config.js` — or with
`window.TOPSET_SUPABASE` set to `null` — the account panel disappears and the app
is a pure local logbook. Nothing breaks, no dead buttons.

There is **no build step and no runtime environment variables**: a static site has
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
2. **SQL Editor → New query** → paste [`supabase/schema.sql`](supabase/schema.sql)
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

39 checks: writes, replaying a day without duplicates, incremental pull, isolation
between two users, refusing to graft a row onto someone else's session, anonymous
visitors getting nothing, cascade on account deletion.

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

- **Not an automatic trainer.** It records what you did; it does not tell you what to do.
- **Not a medical device.** Weights and RPE are what you typed. Nothing is checked,
  validated or advised.
- **Not multi-device.** There is no sync, by design, for now.
- **Not social.** No feed, no friends, no leaderboard.

---

## Roadmap

**Shipped:** optional accounts and cloud sync on Supabase, the service worker and
offline support, the business logic extracted and tested in `intelligence.js`,
the per-exercise progression page, user feedback and the admin space.

**In progress:** the coach ↔ client relationship. An invite code generated by the
coach, accepted on both sides, consented to and revocable; then session templates
filed in folders and assignable into a client's logbook; then a message thread
and a per-session debrief. `profils` is the foundation for all of it — that is
why it was written first.

**Still open:** the return leg of the password-reset link has never been
exercised with a real email. Resend's DNS records are published on `top-set.fr`;
what remains is wiring the API key into Supabase's SMTP settings and doing a full
round trip.

---

## Licence

All rights reserved. The code is public to read; it is not licensed for reuse.
