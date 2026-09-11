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

The account is optional. Without one, everything lives in the browser's
`localStorage`, on the device you use, and no server sees anything. With one,
the logbook is also copied to Supabase and follows you from device to device,
and messaging opens up: the team, your coach, your clients. See
[Where your data lives](#where-your-data-lives).

The interface is in French.

**This is an early beta**, used and developed day to day by its author. Expect
rough edges and the occasional breaking change. If something is broken, confusing,
or missing, [open an issue](../../issues/new/choose) — that is exactly what this
repository is for right now.

<p align="center">
  <img src="screenshots/planning.png" width="240" alt="Weekly planning: the header's messages, profile and data buttons, today's chest-day banner, the week's day pills and the muscle groups trained" />
  <img src="screenshots/session.png" width="240" alt="Logging the bench press: last time's sets, the suggested load, then the top set with its steppers, RPE and rest" />
  <img src="screenshots/recap.png" width="240" alt="Weekly recap: volume lifted, sets, sessions, movements, and the assiduity strip" />
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
- [Search engines](#search-engines)
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

**Timed exercises: planks, wall sits, dead hangs.** A hold is measured in
seconds. Typing « Planche » or « Gainage » switches the set to a duration as you
type — `−` and `+` then step by 5 s — and a card button switches any other
exercise. Under the set, a 1–10 *difficulty* replaces reps in reserve, which
mean nothing for a plank. The record is the longest hold, the exercise page
charts the best time session after session, the recap shows minutes.

The duration lives **in the reps field, written with its unit**: `45 s`. That
field is already free text, so the database, the sync, the backup and the CSV
carry it without any format change. The unit is mandatory: a bare `45` stays
45 reps — guessing would reinterpret sets already logged. A duration counts
toward no volume, no estimated 1RM and no rep record.

**Rest per set**, not per exercise, and carried over when a set is duplicated.

**A comment per exercise.** An optional field under the sets, for what the
numbers don't say: « last set assisted », « with bands », « a bit tired ». Next
time it shows under *Dernière fois*, next to the numbers it explains; it also
appears in the session sheet, the exercise history and the logbook a coach
reads. It belongs to the day: copying a session copies the sets, not the
comment. At most 500 characters, in the app and in the database. The `note`
field only exists when filled in, so older logbooks have nothing to migrate;
the CSV carries it as a last column, `Commentaire`, repeated on every set of
the exercise so sorting the sheet never separates it from its numbers. A CSV
without that column imports as before.

**Exercise memory.** Type an exercise that is not in the built-in list and it is
remembered for next time, muscle group included. Saved on blur rather than on
each keystroke, so you do not end up with `B`, `Be`, `Ben`.

**Recap.** Total volume (weight × reps, summed), a training calendar, per-exercise
records and a muscle-group split — over a week, a month or a year.

**Progression chart** per exercise, drawn from your own history.

**Feedback.** A link at the bottom of every screen opens a form: a bug, an idea,
a question. It lands in the database, not in a mailbox, and the app takes you
straight to your conversation with the team, where the reply will arrive.

**Messages.** A speech bubble in the header opens every conversation in one
place — the Top Set team, your coach, your clients — with a badge counting what
is waiting. See [Messaging](#messaging).

**Three doors in the header.** The messages bubble, the **profile** silhouette
(account, pseudonym, coach, sync) and `⇅` for **data** (backup, CSV, import).
Account and files used to share one sheet, which had become a catch-all.

**Built for the phone.** Tabs stay at the top while scrolling — including in
the installed iPhone app, where they used to slide under the status bar. A
back-to-top arrow appears once you are a screen down. Double-tapping `+` adds
5 kg instead of zooming (`touch-action: manipulation`), and focusing a field no
longer zooms Safari: on iOS every field is at least 16 px, the size below which
Safari zooms in on its own — and never zooms back out. That rule is **the last
one in the stylesheet**: at equal specificity the rule written lower wins, and
placed higher it lost to the message field, which stayed at 14 px. A guard
checks it.

Sheets (data, profile, feedback) and the welcome screen leave room for the
clock and the battery, and their header — with the close button — stays at the
top while they scroll. In the installed app a tall sheet slid its × under the
status bar, where it could not be tapped.

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

Eleven tables. Five carry the logbook — `seances`, `exercices`, `series`,
`exercices_perso`, `consentements` — and no one ever sees another person's row,
except the coach you opened your logbook to, read-only. The others came later:

- **`profils`** — pseudonym, role, sign-up date, last-seen date. The pseudonym
  still lives in the account metadata; this column is a queryable mirror of it,
  because Supabase's `auth` schema is not readable from a browser. No logbook
  data, no email address.
- **`retours`** — user feedback. Deleting an account does not erase the
  feedback, it anonymises it (`on delete set null`): leaving is a right,
  erasing a bug you reported is not.
- **`liens_coach`** — who coaches whom, and since when. See
  [The coach link](#the-coach-link).
- **`messages_support`** and **`messages_coach`** — the two halves of
  messaging. See [Messaging](#messaging).
- **`notifications_admin`** — what the team should see go by, written only by
  triggers.

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

**Importing adds, it no longer replaces.** Replacing wiped the logbook in place
with the file's: an old backup imported by mistake erased months of sessions.
`fusionnerCarnets()`, in `intelligence.js` and therefore tested, adds what is
missing and never touches what is there:

- a missing day arrives whole, with its title;
- in an existing day, an exercise is matched by id, or by name and filled sets —
  which is what lets the CSV, which has no ids, double nothing;
- it is a multiset, not a set: two « Pompes × 20 » cards on the same day are two
  exercises done, and stay two;
- an id already used elsewhere in the logbook is replaced. In the database an
  exercise is unique per person across all days: a duplicate would block that
  day's sync forever.

The first press shows what will arrive — « 25 séries sur 4 jours (dont 3 que tu
n'avais pas) » — the second applies it, redoing the merge on the logbook as it
is at that moment. Only the days that changed are sent to the account.
Importing the same file twice adds nothing.

**The CSV imports back.** `lireCsvCarnet()` reads the exported CSV, and what
Excel makes of it when it re-saves it: commas instead of semicolons, DD/MM/YYYY
dates. It then goes through exactly the same cleaning as a JSON file. The
`Commentaire` column is read once per exercise: the first non-empty one wins, so
a hand-made sheet can write it just once.

**Overwrite guard.** `saveLocal()` rewrites the whole logbook on every save. If
`state.sessions` were empty at the wrong moment — a failed load, corrupted JSON —
that single call would erase everything, permanently and silently. So:

- The app **refuses** to replace a filled logbook with an empty one, and says so.
  The condition lifts on its own as soon as there is one real day again.
- Every save keeps the **previous version** under a recovery key.
- Unreadable JSON is **set aside** rather than overwritten.
- A `RÉCUPÉRER N JOURS` button appears in the `⇅` panel whenever a recoverable
  copy holds more than what is currently loaded. Recovering means importing that
  copy: what is missing comes back, what is there does not move.

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

What the privacy policy states is enforced technically, not just written:

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
209 KB and is fetched only when a session already exists, or at the moment you
sign in.

**Row Level Security on every table.** Each row carries its owner's id, and the
database refuses any read or write that does not match the authenticated user.
Foreign keys are composite `(user_id, id)`, so a row cannot even structurally
belong to someone else's session. The client never sends a `user_id`: it comes
from the JWT, server-side.

**No cookies, no trackers today.** Without an account, the only processing that
exists is the host's own access logs. The policy no longer promises « no
analytics »: measuring the site's performance is planned, and it will be
described on the page before it starts.

**The privacy policy follows the app.** Version 3.1 names the publisher and
everyone involved — Vercel, Supabase, Resend for account emails, OVH for the
domain, and Claude (Anthropic), which helps write the code and the pages without
being connected to the app — and adds comments to the logbook. Like 3.0, it asks
nothing again of existing accounts. Version 3.0 already stated, feature by feature,
what an account records, who sees it — yourself, your coach, the team — on what
legal basis and for how long. The accepted version is stored with every
consent: at sign-up, and with every coaching request. The latter used to be
sent without a number, and the database recorded « 1 », a version that never
existed.

**Admin notifications leave with the account.** They were `on delete set null`,
to keep a trace without the person being identifiable — but a notification
carries the pseudonym or the first 200 characters of a message, so an orphaned
one still was. They now cascade, and the schema deletes those already
orphaned. Only feedback survives a deleted account, without its author.

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

### The coach ↔ client conversation

A table of its own, `messages_coach`, rather than a reuse of support messaging:
there, the other side is "the team", the same for everyone; here it is two
accounts, and the right to write is read **from the link**, not from a role.

- **Writing** requires an *active* link, and the declared author must match the
  real side: a client cannot sign as coach, a coach cannot write to someone they
  do not coach, and nobody can create a thread between two strangers.
- **Reading**: the client keeps the history even after cutting access — it is
  their conversation. The coach loses read access on the break, as with the
  logbook. The administrator does not see it.
- **Rewriting** is impossible: the update privilege is limited to the `lu`
  column. **Deleting** too: there is no `delete` policy.

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

A trigger, `accuser_retour()`, copies every feedback into its author's thread,
then adds an acknowledgement signed `systeme` rather than `admin` — nobody has
read it yet. No policy lets anyone write a `systeme` message, administrator
included: only the trigger can, which is what makes it credible.

### Messaging

One thread per member, the same from both sides: a message written by the
administrator still carries the member's `user_id`, otherwise there would be no
conversation, only two lists. **The insert policy checks that the declared
author matches the caller's real role** — a member cannot insert a message
signed `admin`, even by crafting the request by hand.

Support and coaching each had their own thread, in two different sheets, and a
ticket reached the admin space with nothing to reply with. There is now **one
inbox**, behind the header bubble. Two tables underneath, because the right to
write is decided differently — a role on one side, a link on the other — but a
single door on screen:

| Who is looking | Table | With whom |
|---|---|---|
| a member | `messages_support` | the Top Set team |
| the team | `messages_support` | every member who wrote |
| a client | `messages_coach` | their coach |
| a coach | `messages_coach` | each of their clients |

The team can write to anyone from the admin space (**ÉCRIRE**, **RÉPONDRE**).
**Two strangers cannot write to each other**, and it is the database that
refuses, not the screen. New messages are fetched every 10 s while a
conversation is open and visible, every 30 s in the inbox, never while the tab
is hidden. The badge is two `head:true` counts — numbers, not hundreds of
messages — at most once every 8 s, and zero on error.

**The count waits for the profile.** It used to run before `toucher_profil()`
answered, so the administrator was counted as a member, on their own support
thread — the one holding their test feedback, which their inbox never shows and
nothing therefore marked read. The badge stayed lit on a message nobody could
open, and the real count, held back by the 8 s limit, arrived a minute later.
`profilConnu()` now waits for the role, opening the inbox recounts, and a token
stops a count started before a read from relighting the badge after it.
Opening a member's thread also marks that member's message and feedback
notifications read; sign-ups and coaching requests stay.

### The admin space

Restricted to the `admin` role. Ten counters (sign-ups, new and active at 7 and
30 days, sessions, sets, pending feedback, unread messages, notifications), the
notifications, a way into the inbox, the feedback list — each with
**RÉPONDRE**, **MARQUER LU** and **TRAITÉ** — and the member list sorted by last
visit, each with **ÉCRIRE**.

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
favicon-16/32/48.png     fallbacks where SVG favicons are not supported; 48 px is
                         the size Google asks for in its results
favicon.ico              16 + 32 + 48 px, for browsers that request it on their own
icon-180/192/512.png     home screen and PWA icons
og-image.png             social preview, 1200×630
manifest.webmanifest     PWA manifest
vercel.json              security headers and cache policy
robots.txt               indexing
sitemap.xml              sitemap, generated by scripts/contenu.mjs
carnet-de-musculation.html  product page (generated)
methode-editoriale.html  who writes, sources, AI, review (generated)
apprendre.html           the main section: every section and its pages (generated)
documentation/  entrainement/  exercices/  outils/
                         content pages and their sections (generated, committed)
404.html                 error page (generated, not indexed)
contenu.css              styles for the content pages
outils/outils.js         calculators (external file: the CSP refuses inline scripts)
outils/tableau-rpe.js    the RPE table: % of 1RM or kg, same formula as the log
outils/*.csv             blank and sample log templates in the export format (re-importable, tested)
img/                     app screenshots for the product page (WebP)
supabase.umd.js          supabase-js 2.115.0, loaded on demand
supabase-config.js       project URL + public anon key (see Accounts)
supabase/schema.sql      tables, RLS policies and sync functions
supabase/test/           the schema tested on a real Postgres (PGlite): RLS (239),
                         upgrade from every past version (12)
test/                    business logic (161), hardening guards (171), links (119), content templates (15)
LICENSE  SECURITY.md  CONTRIBUTING.md  CHANGELOG.md
.github/                 issue templates, CI workflow
.vercelignore            what the site does not publish: docs, schema, tests, content sources
docs/seo/                SEO and content strategy: topic matrix, research, inventory
contenu/                 content page sources, bibliography, sections (not published)
scripts/                 content page generator and its template (not published)
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
framework preset, deploy. `vercel.json` handles headers and caching,
`.vercelignore` what must not be published.

The site lives on `top-set.fr`, which redirects to `www.top-set.fr`. The domain
is written out in the Open Graph tags, canonical links, `robots.txt` and
`sitemap.xml`; the script that replaced it everywhere served once, when the
placeholder domain gave way to the real one, and has been removed.

**On every release that touches the app**, the service worker version
(`VERSION` in `sw.js`) moves up one notch: that is what tells phones to replace
the cached shell.

---

## Search engines

What code can do is done: a **title** that says what the app is (« Top Set —
carnet de musculation gratuit ») rather than just its name, which is also the
name of a training method; a **description** under 160 characters, where Google
cuts; the **site name** declared as `WebSite` structured data; a 48 px
**favicon** and a `favicon.ico`; `robots.txt` and `sitemap.xml`; one canonical
URL per page, with `top-set.fr` redirecting to `www.top-set.fr`. The guards in
`test/gabarits.test.mjs` check the title and description length, the
`WebSite` block, the favicon and the sitemap.

The content strategy lives in [`docs/seo/content-strategy.md`](docs/seo/content-strategy.md)
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
(`/apprendre`). In the app, Apprendre is a fourth tab next to PLANNING,
SÉANCES and RÉCAP: a static screen of six cards and a button to `/apprendre`;
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

Still no framework and no build step on Vercel. Each page's source lives in
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
