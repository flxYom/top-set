# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/) —
while it stays below `1.0.0`, breaking changes (in particular to the
`localStorage` schema) can still happen between minor versions.

## [Unreleased]

### Added

- **Support messaging.** One thread per person, the same from both sides. The
  insert policy checks that the declared author matches the caller's real role,
  so a member cannot post a message signed `admin` even by hand-crafting the
  request. Write access is restricted to the `lu` column, so nobody rewrites the
  body of a message already sent.
- **Admin notifications**, written by triggers on `profils`, `messages_support`,
  `retours` and `liens_coach`. The table has *no* insert policy at all: nothing
  in the browser can fabricate one. The triggers read nothing from the client —
  what they record, they take from the row just written. That is the database
  version of "re-read the source instead of trusting the request body", obtained
  without a server.
- 31 more RLS tests (168 → 199).
- **The coach ↔ client link.** A coach generates an 8-character code, the
  client enters it, the coach accepts — the link exists only once both sides
  acted. The coach then *reads* the client's logbook: sessions, exercises, sets,
  RPE. They cannot change or delete anything, and never see the email address,
  the consent records or the feedback. One active coach per person, enforced by
  a partial unique index. Revocable from either side, effective immediately
  because the policy re-reads the status on every query. The client's consent is
  dated and versioned when they make the request.
- Three interfaces: `MON COACH` and `ÊTRE COACH` in the ⇅ panel, and a coach
  view listing pending requests and clients, with a read-only rendering of a
  client's logbook — deliberately unlike the editor, so nobody thinks they can
  change what they are looking at.
- 47 RLS tests for this mechanism alone (121 → 168): before the link, while
  pending, after acceptance, what the coach cannot do, the third party, the
  rejected second coach, revocation, ending the coaching, and `anon` throughout.
- SÉANCES view split into two tabs: *Mes séances* (not-yet-logged sessions,
  today's, and upcoming, oldest first, with the *Créer ma séance* box) and
  *Historique* (logged sessions, newest first, grouped by month).
- Feedback (`retours`): a footer link opens a sheet with three kinds
  (`bug`, `idee`, `question`), a 4,000-character body, and the list of what you
  already sent with its status. Requires an account. The context sent alongside
  is the current view, screen size, truncated user agent and a PWA flag — never
  logbook content.
- Admin space, restricted to the `admin` role: eight counters, the feedback list
  with read/handled controls, and the member list sorted by last visit. Returns
  aggregates only — no email address and no logbook row.
- `profils` table (pseudo, role, sign-up date, last-seen date), written by
  `toucher_profil()` on every app open. The pseudo stays in the account
  metadata; this column is a queryable mirror of it, because Supabase's `auth`
  schema is not readable from a browser.
- 47 new RLS tests (66 → 113), covering profiles, feedback and administration —
  including the guarantee that an administrator still cannot read anyone's
  logbook.
- Previous batch, not logged at the time: business logic extracted to
  `intelligence.js` with 87 unit tests, set types (warm-up / top set / working /
  back-off), the previous-performance block with one-tap copy, session
  create/edit, and the per-exercise progression page.

### Security

- **Signing out left the logbook on the device.** Opening the app with no
  account showed the last signed-in person's sessions — the same hole as below,
  from the other end, and the one that shows up first on a shared phone. Signing
  out now files the logbook under its owner and restores the anonymous one (or
  none), so a fresh open is blank. Nothing is lost: signing back in brings it
  back whole, unsent days included.
- **Two accounts on one device shared a logbook.** The local logbook lives under
  a single key for the whole device, and `tirer()` merges the cloud into it
  rather than replacing it — so signing in with a second account showed the
  first account's sessions, and the app then offered to upload them to the
  second account, changing their owner for good. The logbook now follows the
  account: on sign-in with a different id, the one present is filed under
  `topset_carnet_<user_id>` and the arriving account's own is restored. Nothing
  is deleted, the outbound queue travels with the logbook, and a filed logbook
  is only retrievable by its owner. Nine new guards assert the ordering — filing
  before clearing, clearing before restoring, and the swap happening before the
  upload prompt.
- `SECURITY.md` now records the five accepted Supabase linter warnings with the
  reason each is deliberate, so they are not re-investigated on every report.
- Supabase's database linter flagged `uuid_ou_neuf()` and `maintenant()` as
  having a mutable `search_path`. A function without one resolves its names
  using the caller's path, so anyone able to create an object in a schema ahead
  of `public` could hijack what it thinks it is calling. Both now pin it, like
  every other function in the file already did.
- `est_admin()` is no longer executable by `authenticated`, so it is gone from
  `/rest/v1/rpc`. The front end never called it — it reads the role returned by
  `toucher_profil()` — and the four admin functions call it internally, where
  they run as owner. One less callable surface.
- The four `admin_*` functions stay callable by `authenticated`, deliberately.
  They must live in `public` to be reachable from the app, and their first
  statement refuses anyone who is not an administrator. The check belongs in the
  function, not in whether it is exposed.
- New test section asserting that *every* function in `public` pins its
  `search_path`, that the SECURITY DEFINER list is exactly the six expected, and
  that the sync functions stay SECURITY INVOKER — in DEFINER they would bypass
  all of the RLS above them. 113 → 124 RLS tests.

### Fixed
- Trying to sign up without ticking the consent box said "Coche la case :
  creer un compte envoie tes seances sur un serveur" — which explains *why* an
  account sends data, not what the box actually accepts. Someone reading it
  looks for a box about servers and does not find one. It now names the real
  thing (the privacy policy and the terms), outlines the box in orange, sets
  `aria-invalid` on it and moves keyboard focus there. The highlight clears as
  soon as the box is ticked.
- Four error messages were missing their accents and apostrophes
  ("caracteres", "d au moins", "l adresse"), unlike the rest of the interface.
- Three `meta description` tags still claimed data never leaves the phone and
  that there is no account. The privacy policy's own body has distinguished the
  two modes correctly since sync shipped; the tags had not been updated —
  including the one on the privacy page itself, the worst possible place for a
  stale claim.
- **CI had never been green.** The `Check internal links` step (lychee-action)
  failed on every run going back weeks, and its failure could neither be
  reproduced locally nor read usefully from the log. Replaced by
  `test/liens.test.mjs`, which runs identically on a dev machine and in CI, and
  catches the two traps Windows hides: path case (`Guide.html` works locally,
  not on Linux) and anchors pointing at nothing. Verified by deliberately
  breaking a link and confirming the test fails.
- The RLS suite now runs in CI. Those 113 tests are the only thing proving one
  user cannot read another's logbook, and until now they only ever ran on the
  machine of whoever edited the schema — precisely where that guarantee should
  not rest. `supabase/test/package-lock.json` added so the install is
  reproducible.
- CI was red on every merge of this batch: the "Nous faire un retour" entry was
  written as `<a href="#">`, which the link checker rightly rejects. It is a
  control that opens a dialog, not a link — it is now a `<button>`, which also
  fixes how screen readers announce it and makes the space bar work on it.
- Both READMEs described a project that no longer existed: one file holding all
  the logic, no service worker, no `profils`/`retours` tables, no CSP change.
  `README.md` (the one GitHub renders) was the further behind of the two.
- "Not a coaching app" sat in the same document as a roadmap entry about the
  coach relationship. Reworded to "not an automatic trainer", which is what was
  actually meant.
- The admin entry never appeared for an administrator returning to the app.
  `toucher_profil()` was only called from `apresConnexion()`, which runs after
  an explicit sign-in — never on a restored session, which is how the app is
  opened almost every time. It is now also called when the session is restored,
  which fixes the same bug for `vu_le`: the "active in the last 7 days" counter
  would only ever have counted people who had just typed their password.
- The recap's period buttons used a global `.seg-btn` selector, which also
  deactivated the new SÉANCES tabs. Scoped to `#subTabs`.

### Security

- **Stored XSS via a crafted JSON backup (reproduced, then fixed).** Exercise
  and set identifiers were interpolated into HTML attributes verbatim. An
  imported file whose `id` was `x1" onmouseover="…` installed a live event
  handler on the card, and it fired. Fixed at both ends: every identifier is
  escaped at the sink, and `idSur()` rejects anything outside
  `[A-Za-z0-9_-]{1,64}` on the way in — the same rule `uuid_ou_neuf()` already
  applies server-side. No existing identifier is rewritten: `x1a2b3c`,
  `s1a2b3c` and UUIDs all pass.
- `esc()` now also escapes `'`. Every generated attribute uses double quotes
  today, so this was not exploitable — it removes the trap for the next
  single-quoted attribute someone writes.
- Muscle groups from an imported file are validated against `GROUPS`, and
  remembered exercises are re-validated key by key (`__proto__`,
  `constructor` and `prototype` are dropped). The legacy
  `"name": "Group"` string form is preserved as-is.
- CSV export no longer lets a cell become a spreadsheet formula. Text columns
  starting with `=`, `+`, `-`, `@`, tab or CR are prefixed with `'`. Numeric
  columns are exempt on purpose, so a legitimate negative load still exports
  as `-12,5` rather than turning into text.
- Imports are capped at 8 MB, checked before `FileReader` and before
  `JSON.parse`. A real two-year backup is under 1 MB.
- **`script-src` no longer allows `'unsafe-inline'`.** That permission is what
  let the injected `onmouseover` above actually run; without it the browser
  would have refused it even unpatched. The app's single inline `<script>`
  block moved to `app.js`, loaded from the same position at the end of
  `<body>`, so execution order is unchanged. There were no inline event
  handlers and no `javascript:` URLs to migrate. `style-src` keeps
  `'unsafe-inline'` on purpose: the cards carry `style="--card-color:…"`
  attributes, style injection cannot execute script, and extracting the
  stylesheet would not remove the need.
- `test/gabarits.test.mjs`: 50 static guards over the rendering, import, CSV
  and service-worker forms that have already caused a hole. Wired into CI.
- No `UPDATE` policy on `profils`. RLS filters rows, not columns: a
  "users may edit their own profile" policy would also have allowed
  `update profils set role = 'admin' where user_id = auth.uid()`.
- Table privileges revoked before being granted on `retours` and
  `consentements`. Supabase grants all privileges to `authenticated` by default
  on every new table; RLS was catching it, but silently and on one layer only.

### Changed

- Service worker cache version `topset-v2` → `topset-v11`.
- Offline, a clean URL (`/guide`, produced by Vercel's `cleanUrls`) fell back
  to the app instead of the requested page. The navigation fallback now retries
  once with `.html` before giving up.
- `SECURITY.md` described a threat model without accounts or a database, which
  stopped being true when Supabase sync landed.
- Guide: the install section no longer claims a connection is required — the
  service worker has made the app work offline since v2.


## [0.1.0] - 2026-09-06

Initial public release.

### Added

- Weekly session planning (day pills, week navigation, "AUJOURD'HUI").
- Set logging with weight, reps, RPE (10 → 6, half points) and rest per set.
- Set duplication (`+ SÉRIE`) and 2.5 kg steppers.
- Custom exercise memory, with muscle group.
- Recap view: total volume, training calendar, per-exercise records,
  muscle-group split, over a week/month/year.
- Per-exercise progression chart (Chart.js 4.4.1, loaded on demand).
- JSON export/import with a two-step, guarded overwrite flow and a
  same-device recovery key.
- Installable PWA (manifest, icons); self-hosted font and charting
  library so no request ever leaves the device.
- Legal pages (terms of use, privacy policy, legal notice) and a guide.

[Unreleased]: https://github.com/flxYom/top-set/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/flxYom/top-set/releases/tag/v0.1.0
