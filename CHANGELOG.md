# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/) —
while it stays below `1.0.0`, breaking changes (in particular to the
`localStorage` schema) can still happen between minor versions.

## [Unreleased]

### Added

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

- No `UPDATE` policy on `profils`. RLS filters rows, not columns: a
  "users may edit their own profile" policy would also have allowed
  `update profils set role = 'admin' where user_id = auth.uid()`.
- Table privileges revoked before being granted on `retours` and
  `consentements`. Supabase grants all privileges to `authenticated` by default
  on every new table; RLS was catching it, but silently and on one layer only.

### Changed

- Service worker cache version `topset-v2` → `topset-v3`.
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
