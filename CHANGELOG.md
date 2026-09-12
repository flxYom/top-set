# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/) —
while it stays below `1.0.0`, breaking changes (in particular to the
`localStorage` schema) can still happen between minor versions.

## [Unreleased]

### Fixed

- **A stray tap on a set already logged overwrote it with last week's numbers.**
  The last-time column now only copies into an empty row; on a filled or
  finished set it is plain text, with no border and nothing to press.
- **The unknown-exercise box no longer appeared at all.** It was inserted
  relative to the muscle-group select, which moved into the card header with the
  new card. It is back at the top of the card body, and now states both ways
  out: « L'AJOUTER À MES EXERCICES » or « LE RELIER À UN EXERCICE EXISTANT ».
- **« + SÉRIE » sent the page back to the top on iPhone.** Tapping a button
  there leaves the focus in the field you were typing in; re-rendering the whole
  day panel deleted that field and Safari scrolled to the top. The new set is now
  appended to its card, without the keyboard; any remaining full redraw
  (`renderDayPanel`, `repeindreCarte`) leaves the field first and restores the
  scroll position. Two guards keep it that way (174).

### Added

- **The schema refuses to run in the wrong Supabase project.** This account also
  hosts Yom Nutrition, and pasting `schema.sql` there failed with
  `column "cree_le" does not exist` — an index on a table carrying the same name
  but another shape — which named neither the project nor the mistake. A guard
  at the top of the file now stops before the first write when it finds that
  database's tables, and says which project to switch to. Nothing is written
  there: the whole script is one transaction. Two tests cover it (17).
- **The end of a session.** `✓ TERMINER MA SÉANCE` at the bottom of the day,
  a confirmation (which counts the logged-but-unchecked sets), a one-second
  loading bar, then an animated recap: volume counting up from zero, sets,
  exercises, records, the top set of the day by estimated 1RM, the exercises
  that beat last time, this week against the one before, and a line of the day
  drawn from the date out of thirty. The day is then marked validated
  (`termine`, a timestamp) with a « revoir le bilan » banner; nothing is
  locked. New nullable `seances.terminee` column and `pousser_fin` RPC, on the
  model of the title: a database without the column cannot erase a local
  validation. Animations stop under `prefers-reduced-motion`.
- **Gym shorthand.** Around forty abbreviations and English names (`RDL`,
  `OHP`, `bench`, `deadlift`, `BSS`…) map to a name in the built-in list. While
  you type, the card offers the full name; accepting renames the exercise and
  keeps the abbreviation linked to it, so the history stays in one piece. The
  table only suggests — nothing is renamed without a tap.

### Changed

- **Titles, validations and exercise names are pushed even when no day
  changed.** `pousser()` used to return early on an empty day queue, so they
  waited for the next logged set.
- **The superset button is back under « + SÉRIE »**, where sets are added,
  instead of the `⋯` menu. Service worker cache `topset-v20` → `topset-v21`.
- **The last-time column is headed with its date** (« 8 SEPT. ») instead of
  « PRÉC. », which was not understood, and is hidden for an exercise with no
  history. Service worker cache `topset-v19` → `topset-v20`.
- **The exercise card, rebuilt around one row per set.** `SÉRIE · PRÉC. · KG ·
  REPS · RPE · ✓`, the layout of Strong and Hevy, replaces three rows per set
  (weight, then a full-width type menu, then RPE, rest and delete). The set
  number is the type menu (`TOP`, `B.O.`, `ÉCH.` take its place); `PRÉC.` shows
  the same set last time and copies weight, reps and type into that row; a done
  set loses its borders and reads like text. Only the open set — the first not
  done, or the one being edited — shows its tools: `−` `+`, rest, comment,
  delete. Checking a set folds it and opens the next. The muscle group becomes a
  header chip; timed mode, superset and delete move to a `⋯` menu. Under 310 px
  of card width (container query) the `PRÉC.` column gives way and *Dernière
  fois* lists last time's sets. Picking an RPE now shows its meaning (« RPE 8 —
  2 reps en réserve »), which was only a tooltip and never showed on a phone.
- **Comments are per set, not per exercise.** `+ COMMENTAIRE`, next to
  `+ SÉRIE`, adds one to the last set done; each set's tools add one to any
  other. They show under *Dernière fois* with their set number, in the session
  sheet, the history and the coach's view. A new nullable `series.note` column
  (≤ 500, trimmed and truncated by `pousser_jour`, returned by both pulls);
  `normalizeExercise()` moves an existing exercise comment onto its last set.
  The CSV `Commentaire` column is now the comment of its row's set, on export
  and import; the published example follows. A database without the column
  cannot erase a set comment kept on the phone.
- **Guide and pages** describe the new card: steps 3 to 6 of the guide, and the
  « note it in Top Set » paragraphs of the back-off, failure, RIR, RPE, rest,
  plank and top set pages. New captures of the card on the product page and in
  both READMEs. Service worker cache `topset-v18` → `topset-v19`.

### Added

- **A comment per exercise.** An optional field under the sets — « last set
  assisted », « with bands », « a bit tired ». It shows again under *Dernière
  fois* next time, in the session sheet, the exercise history and the logbook a
  coach reads. Stored as an optional `note` field (absent when empty, so no
  migration), up to 500 characters, synced through a new nullable
  `exercices.note` column: `pousser_jour` trims and truncates it, `tirer_jours`
  and `tirer_jours_de` return it. Until `schema.sql` is re-run, a database
  without the column cannot erase a comment kept on the phone. The CSV export
  gains a last column, `Commentaire`, which the importer reads back; the
  published Excel template and example follow.

- **Content pages** (French), next to the app: the top set
  (`/documentation/top-set-musculation`), a 1RM calculator using the app's own
  Epley formula and 12-rep limit (`/outils/calculateur-1rm`), a product page
  (`/carnet-de-musculation`), a training log for school PE at the baccalauréat,
  written from the February 2026 official texts
  (`/entrainement/carnet-musculation-eps`), and the plank
  (`/exercices/planche-gainage`) — plus section hubs, a page on how the pages
  are made (`/methode-editoriale`) and a branded 404. 50 sources cited, each opened
  and labelled with what was read. Signed « Yom Industry × Claude
  (Anthropic) ». Everything sits under one main section, **Apprendre**
  (`/apprendre`, listing every section and page): a fourth app tab next to
  PLANNING, SÉANCES and RÉCAP opens a screen of six section cards, and every
  content page carries the same sections as a bar under its header. The guide
  now explains set types and the new tab, and links to the relevant pages.
- **Content generator** (`scripts/contenu.mjs`, no dependency): builds the
  pages, hubs, 404 and `sitemap.xml` from `contenu/`, and refuses unknown
  citations, broken internal links, out-of-bounds or duplicated titles and
  descriptions, pages over their weight budget, inline scripts, and pages whose
  topic is not published in the matrix. CI runs it in `--verifier` mode and
  validates the HTML of every section.
- **Page templates enforced by the generator.** A definition must have its
  « what it is », « how to use it », « examples » and « common mistakes »
  sections and at least three related terms, which link to their page on their
  own once it is published; an exercise must have its fiche (muscles,
  equipment, level, movement, breathing), shown before the table of contents,
  its setup, mistakes and variations sections, and a related notion. « À lire
  ensuite » now labels each linked page with its section. The top set page now
  covers top set vs straight sets and pyramids, RPE and RIR, choosing the load
  from a 1RM, advantages, limits, common mistakes and tracking over time (one
  new source: Helms et al. 2016, full text on PMC); the plank page gets its
  fiche. `test/contenu.test.mjs` (15 checks, run in CI) strips these parts from
  a copy of the site and checks the generator refuses.
- **Content, batch 1 — intensity** (French): the RPE scale
  (`/documentation/rpe-musculation`, the pillar: the scale, how to set the day's
  load, RPE vs Borg, what the app does with it), reps in reserve
  (`/documentation/rir-musculation`: how far off we are — about one rep on
  average — and how to learn) and muscle failure
  (`/documentation/echec-musculaire`: strength, hypertrophy, fatigue and
  recovery, when to use it). 10 new sources, each abstract read on PubMed and
  DOI checked on Crossref (Halperin 2022, Robinson 2024, Refalo 2023 read in full
  on PMC, Grgic 2022, Davies 2016, Vieira 2022…). The top set page's related
  terms now link to them on their own; the documentation hub, at four pages,
  becomes indexable.
- **Content, batch 2 — load** (French): the 1RM (`/documentation/1rm-musculation`,
  the pillar: testing or estimating it, what it is for, loads for strength or
  muscle), the back-off set (`/documentation/back-off-set`: how much to drop,
  how many sets, back-off vs drop set) and an **RPE table**
  (`/outils/tableau-rpe`): % of 1RM for 1–10 reps at RPE 6–10, turned into kg
  when a 1RM is entered, computed with the app's own Epley formula and 12-rep
  limit (`outils/tableau-rpe.js`, reads `TS.epley`), and shown next to what
  a 269-study meta-regression actually measured. 6 new sources (Nuzzo 2024 read
  in full on PMC, Grgic 2020, Lopez 2021, Steele 2022, Sødal 2023, Havers
  2026).
- **Content, batch 3 — progression** (French), in `/entrainement`: progressive
  overload (the pillar: the levers, load vs reps, double progression), how many
  reps to build muscle (the « 8–12 » rule against the evidence) and how many
  sets per muscle per week (how to count, the dose-response, how the app's recap
  counts). Built on the American College of Sports Medicine's 2026 position
  stand, read in full on PMC, and 6 more sources (Pelland 2026, Plotkin 2022,
  Schoenfeld 2021 read on PMC, Baz-Valle 2022…). The training hub, at four
  pages, becomes indexable. The guide's recap section now says the muscle-group
  count includes warm-ups, and that the exercise chart plots the top set's
  estimated 1RM (it said « your loads »).
- **Content, batch 4 — tracking** (French), in `/entrainement`: rest between
  sets, getting past a plateau (a diagnosis read from one's own log), and
  tracking one's progress (the pillar of the tracking cluster: why log —
  a 138-trial meta-analysis on progress monitoring —, what to note, which
  numbers to follow, how to read them). 7 new sources (Singer 2024, Grgic 2017
  and 2018, Harkin 2016, Michie 2009, Coleman 2024, Craven 2022). The plateau
  page says plainly that nutrition is not covered yet rather than advise
  without sources.
- **Content, batch 5 — exercises and tools** (French): the bench press
  (`/exercices/developpe-couche`, the full exercise template: fiche, drawn
  profile diagram, setup from the IPF 2026 rulebook, EMG review, incline study,
  Valsalva review, shoulder-load study), how much the bar weighs
  (`/documentation/poids-de-la-barre`: 20 kg per the IPF, other bars left
  unquantified rather than guessed) and a spreadsheet log template
  (`/outils/modele-carnet-musculation`, two CSV files in the app's exact export
  format; 8 new logic tests prove the published files re-import). The outils
  hub, at three pages, becomes indexable. The 15 selected topics are all
  published. The generator now asks for a related exercise only once three
  other exercise pages exist, so it no longer forces an irrelevant link.
- **SEO and content strategy** (`docs/seo/`, not published). An audit of the
  real site — the home page shows Googlebot 118 words and a sign-up screen, no
  page answers a search — research from Google autocomplete (155 seed queries,
  1,036 suggestions), the organic top 10 of 32 queries, and PubMed review
  counts per theme; 83 topics scored on eight explicit criteria, 20 selected, a
  5-page pilot. `matrice.mjs` computes the scores and refuses two active pages
  on the same URL or query; CI runs it.
- **Search engine basics.** The page title now says what the app is
  (« Top Set — carnet de musculation gratuit ») instead of « Top Set » alone —
  also the name of a training method whose forum threads outrank it. A real
  description under 160 characters replaces a 51-character stub, the site name
  is declared as `WebSite` structured data, and a 48 px favicon plus a
  `favicon.ico` (16/32/48 PNGs, generated like the other icons) join the SVG.
  Sitemap dates updated. 12 guards check all of it.
- **One inbox for every conversation.** A speech-bubble button in the header
  opens every conversation the account has: the Top Set team, one's coach,
  one's clients — and, for the admin, every member who wrote. Each row shows
  the last message, its time and an unread count; a badge on the button totals
  what is waiting. A conversation is the page itself, with the input stuck to
  the bottom of the screen, day separators, and bubbles sized to their text.
  New messages are fetched every 10 s while a conversation is open and visible
  (every 30 s in the inbox), never while the tab is hidden. Two tables stay
  underneath — the right to write is a role on one side, a link on the other —
  and two strangers still cannot write to each other.
- **Timed exercises** (planks, wall sits, dead hangs). Typing « Planche » or
  « Gainage » switches the set to seconds as you type; a card button switches
  any other exercise. − and + step by 5 s, a 1–10 *difficulty* replaces reps in
  reserve, and the record is the longest hold. The duration is stored in the
  existing reps field as `45 s` — no column, no sync or export format change,
  readable as is on any device. A bare `45` stays 45 reps: nothing already
  logged is reinterpreted. Durations count toward no volume, 1RM or rep record.
  The exercise page, the session page and the recap show times.
- **Importing adds instead of replacing** (`fusionnerCarnets()`, pure and
  tested). A missing day arrives whole; in an existing day an exercise is
  matched by id, or by name and filled sets; identical cards on the same day
  stay distinct; an id already used elsewhere is replaced, since a duplicate
  would block that day's sync forever. The first tap shows exactly what will
  be added, the second applies it on the logbook as it is at that moment.
- **The CSV export can be imported back**, including after Excel re-saves it
  with commas and DD/MM/YYYY dates. It goes through the same cleaning as JSON.
- **Separate Profile and Data sheets**, behind two header buttons. The account,
  pseudo, coach and sync moved out of the data sheet, which had become a
  catch-all.
- **Back-to-top button**, shown once scrolled a screen down, bottom right.
- Replying to a feedback still marked new marks it read.

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
- **The thread now behaves like a thread.** It opens even when empty — while it
  hid itself for lack of messages, nobody could write the first one, so the
  conversation could only start if it had already started. Sender-aligned
  bubbles, the other party's name only above their own messages, a waiting
  bubble while no reply has come (built at render time, never stored), Enter to
  send and Shift+Enter for a new line on both sides, container-scoped smooth
  scrolling that honours `prefers-reduced-motion`, and a dot in the footer when
  a reply is waiting — counted with `head:true`, and returning zero on error,
  because a badge must never keep a page from rendering.
- 12 more static guards (68 → 80), one of them verified to fail when the
  hidden-empty-thread bug is put back.
- **Every feedback now opens a conversation.** A trigger copies the feedback
  into the member's thread — signed by them, tagged **RETOUR** — then adds an
  acknowledgement signed `systeme`, not `admin`: nobody has read it yet. No
  policy lets anyone write a `systeme` message, the admin included. Both rows
  get explicit timestamps, because `now()` does not move inside a transaction
  and the acknowledgement could otherwise sort before the question. The copy
  raises no notification of its own (one action, one notification), and
  insert rights on `messages_support` are now limited to `user_id`, `auteur`
  and `corps`, so nobody can set `retour_id` by hand to silence their own.
  After sending, the sheet scrolls down to the thread.
- **Reply from anywhere in the admin space**: a RÉPONDRE button on every
  feedback that still has an author, an ÉCRIRE button on every member — a
  thread can be opened with someone who never wrote.
- **Coach ↔ client conversation**, in its own table `messages_coach`. Writing
  requires the active link and an author that matches the caller's real side.
  The client keeps the history after ending the link; the coach loses it, as
  with the logbook. Rows can be marked read, never rewritten or deleted. One
  sheet serves both directions, reachable from *Mon coach*, from each card in
  *Mes coachés*, and from the logbook being read; an orange dot on the account
  button flags unread messages either way.
- `admin_retours()` now returns `user_id` — without it a feedback could be
  read but not answered.
- **The coach ↔ client link.** A coach generates an 8-character code, the
  client enters it, the coach accepts — the link exists only once both sides
  acted. The coach then *reads* the client's logbook: sessions, exercises, sets,
  RPE. They cannot change or delete anything, and never see the email address,
  the consent records or the feedback. One active coach per person, enforced by
  a partial unique index. Revocable from either side, effective immediately
  because the policy re-reads the status on every query. The client's consent is
  dated and versioned when they make the request.
- Three interfaces: `MON COACH` and `ÊTRE COACH` in the profile, and a coach
  view listing pending requests and clients, with a read-only rendering of a
  client's logbook — deliberately unlike the editor, so nobody thinks they can
  change what they are looking at.
- SÉANCES view split into two tabs: *Mes séances* (not-yet-logged sessions,
  today's, and upcoming, oldest first, with the *Créer ma séance* box) and
  *Historique* (logged sessions, newest first, grouped by month).
- Feedback (`retours`): a footer link opens a sheet with three kinds
  (`bug`, `idee`, `question`), a 4,000-character body, and the list of what you
  already sent with its status. Requires an account. The context sent alongside
  is the current view, screen size, truncated user agent and a PWA flag — never
  logbook content.
- Admin space, restricted to the `admin` role: ten counters, the feedback list
  with read/handled controls, and the member list sorted by last visit. Returns
  aggregates only — no email address and no logbook row.
- `profils` table (pseudo, role, sign-up date, last-seen date), written by
  `toucher_profil()` on every app open. The pseudo stays in the account
  metadata; this column is a queryable mirror of it, because Supabase's `auth`
  schema is not readable from a browser.
- Previous batch, not logged at the time: business logic extracted to
  `intelligence.js` with 87 unit tests, set types (warm-up / top set / working /
  back-off), the previous-performance block with one-tap copy, session
  create/edit, and the per-exercise progression page.

### Changed

- **Privacy policy 3.1.** Names the publisher and every party involved:
  Resend (account emails, Plus Five Five, Inc., SCCs and EU-U.S. DPF per its
  DPA), OVH (domain and DNS), and Claude (Anthropic), which helps write the
  code and pages and receives nothing from the app. Drops the « no analytics »
  promise, since measuring the site's performance is planned, and says the
  page will describe any new processing before it starts. Comments added to
  what an account records. The « What changed » section is gone: each change
  now sits in the section it concerns. `VERSION_POLITIQUE` → `3.1`.
- **READMEs.** The Resend API key is now wired into Supabase's SMTP settings,
  per the owner; only a full password-reset round trip remains open.
- **Guide.** Removes the timed-exercise section and the « two accounts on one
  phone » section; « Back up your data » becomes a short « Export your
  sessions » (JSON or CSV), placed after the account section; the coaching
  step loses « chacun de son côté »; explains the new comment field and that
  the message badge goes out once the conversation is open.
- Service worker cache `topset-v16` → `topset-v17`.

- **Privacy policy 3.0 and terms of use 2.0.** The policy described an account
  that only copied the logbook; it now says what messages, feedback, the
  profile and coaching record, who sees what, on which legal basis, for how
  long, and who the processors are (Vercel, Supabase Pte. Ltd.). It had also
  called the host's logs « the only processing that exists ». The terms said no
  personal data is ever asked and had no rule for messages or coaching. The
  legal notice now lists Supabase. `VERSION_POLITIQUE` → `3.0`; existing
  accounts are not asked again, as the new text describes processing people
  trigger themselves.
- The site no longer publishes what is only there for the repository.
  Vercel serves every file it is not told to skip, so
  `top-set.fr/supabase/schema.sql`, the tests and this changelog were
  readable online — nothing secret, nothing to serve either. `.vercelignore`
  now keeps the docs, `supabase/`, `test/`, `.github/` and the README
  screenshots off the site, and a guard checks none of them is something the
  service worker precaches.
- Both READMEs, `SECURITY.md`, `CONTRIBUTING.md` and the guide caught up with
  the app. `README.md` still said there was no service worker, no sync, and
  that importing replaces the logbook; `CONTRIBUTING.md` described a single
  file holding all the JavaScript; the guide said « pas de coach ».
- README screenshots retaken on the current interface — the three header
  buttons, the suggested load, the recap tiles.
- This changelog: one heading of each kind under Unreleased, instead of two
  *Fixed*, two *Security* and two *Changed*, and features that had been filed
  under *Tests*.
- The feedback sheet no longer embeds a thread: sending a feedback takes the
  member straight to the team conversation, where the acknowledgement already
  is and the reply will arrive. The coach sheet and the admin-space thread are
  gone too; every entry point opens the shared conversation page.
- The date box left the header to make room for the three buttons; the day is
  already written out in the hero band below.
- Service worker cache version `topset-v2` → `topset-v15`.
- Offline, a clean URL (`/guide`, produced by Vercel's `cleanUrls`) fell back
  to the app instead of the requested page. The navigation fallback now retries
  once with `.html` before giving up.
- `SECURITY.md` described a threat model without accounts or a database, which
  stopped being true when Supabase sync landed.
- Guide: the install section no longer claims a connection is required — the
  service worker has made the app work offline since v2.

### Removed

- **The school PE (EPS) page and every mention of it.** French high-school
  students are not Top Set's audience. `/entrainement/carnet-musculation-eps`
  is deleted along with its two official-text sources; its address redirects
  permanently to `/carnet-de-musculation` (the first `redirects` entry in
  `vercel.json`), its topic is `RETIRED` in the matrix, and the product page,
  the plank page, the editorial method, the Entraînement hub and the Apprendre
  card no longer mention school or the baccalauréat. The top set page also
  drops the sentence tying the app's name to the term: Top Set is the app's
  name, not a word for a logbook. Service worker cache `topset-v17` →
  `topset-v18`.
- `set-domaine.mjs`. It replaced the placeholder domain everywhere; it served
  once, when `top-set.fr` arrived, and a one-off tool left in the repository
  is one more thing to keep working for nothing.
- `interest-cohort=()` from `Permissions-Policy`. It opted out of Google's
  FLoC, abandoned in 2022; browsers now only log a warning about an unknown
  feature.
- Seven methods exposed by `Sync` that nothing outside it called, and CSS rules
  for a `.seance-item` class no screen uses any more.

### Fixed

- **The message badge stayed lit after reading.** It was counted before the
  profile arrived, so the administrator was counted as a member, on their own
  support thread (test feedback, never shown in their inbox, never marked
  read); the 8-second throttle then held back the correct count for a minute.
  The count now waits for the role (`profilConnu()`), opening the inbox
  recounts, a token stops a stale count from relighting the badge, and opening
  a member's thread marks that member's message and feedback notifications
  read.

- **CI was red on Linux.** A guard located the messaging section of `app.js`
  by searching for Windows line endings (CRLF); Git writes CRLF on Windows
  and LF on the CI runner, so the guard passed locally and failed in CI, which
  also skipped every step after it. The guards now normalise line endings
  when they read a file.
- **iPhone, installed app: the data sheet could not be closed.** Sheets were
  centred with a 16 px margin in a screen that starts under the status bar; a
  tall one put its × under the clock. Sheets and the welcome screen now leave
  room for the safe areas, and the sheet header stays pinned while the sheet
  scrolls. Verified in a headless browser with the safe areas and the iOS rules
  forced on: the × sits below the bar and a real tap closes the sheet.
- **iPhone: the inbox zoomed and stayed zoomed.** The iOS rule setting fields
  to 16 px came *before* `.conv-champ{font-size:14px}` in the stylesheet, so
  it lost, and Safari zoomed on focus. The rule is now the last in the sheet;
  every field of the logbook, sheets, inbox and admin space measures 16 px
  with it applied.
- A coaching request recorded its consent under policy version « 1 »: the app
  never sent the version, and the database fell back to its default.
- Without Supabase configured, the messages bubble still showed and led to a
  sign-in form that could not succeed — a dead button in the mode the README
  promises has none. It is now hidden whenever accounts are unavailable.
  Verified both ways in a headless browser.
- The privacy page sent readers to a « Télécharger le fichier » button that has
  been called « Sauvegarde complète (.json) » for a while.
- `SECURITY.md` counted six coach functions and « four writes » while listing
  five, and did not mention `est_admin()` or the two `SECURITY DEFINER`
  triggers.
- **The schema could not be applied to the production database.**
  `admin_retours()` gained a return column, Postgres refuses to replace a
  function whose return columns change, and the Supabase SQL editor then rolls
  back the *whole* script — so nothing of the previous release had reached the
  database, neither the coach conversation nor the REPLY button. The five
  table-returning functions are now dropped before being recreated. Feedback
  sent before the acknowledgement trigger existed is copied once into its
  author's thread, at its original date, without notification.
- In the installed iPhone app, the sticky tabs slid under the status bar and
  looked gone. They now stick below the safe area, over an opaque strip.
- Double-tapping − or + zoomed the page (`touch-action: manipulation`), and
  focusing any field under 16 px made iOS Safari zoom in and stay zoomed.
- Session titles in a backup file were never read back on import.
- Four button styles used `font: 800 10px/1 inherit`, an invalid shorthand the
  browser dropped entirely: admin, coach and feedback buttons fell back to the
  system font.
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

- **Deleting an account left identifiable admin notifications behind.** They
  were `on delete set null`, but carry the pseudonym or the start of a
  message. Now `on delete cascade`; the schema drops the constraint, recreates
  it and deletes notifications already orphaned. Tested on a fresh database and
  from every past schema version; both tests fail on the previous schema.
- `connect-src` no longer allows the project's `wss://` origin. Nothing in the
  app opens a realtime connection — messages are fetched, not pushed — so the
  permission was open for nothing. A guard fails if a `.channel(` appears
  while the CSP still lacks it, or the reverse.
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

### Tests

- RLS: a set comment makes the round trip in its set's place, is trimmed,
  truncated to 500, null when blank or absent, always returned as a key,
  refused over 500 by the table, and read by the coach (246). Upgrade test:
  13 past schema versions. Logic: the CSV comment lands on its row's set, and
  the published example's on the last bench set (162). Guards follow the new
  card: ids escaped once into `sid`/`eid`, the set comment field at 16 px on
  iOS (172).
- RLS: a comment makes the round trip, is trimmed, truncated to 500 without
  blocking the day, becomes null when blank, is always returned as a key, is
  refused over 500 by the table itself, and is read by the coach (239).
- Logic: the CSV comment column is read once per exercise and loses its
  anti-formula apostrophe, an old CSV without it still imports, and both
  published templates carry the export's columns, read from `app.js` (161).
- Guards: the badge count waits for the role, a stale count cannot relight it,
  opening the inbox recounts, and the comment field is 16 px on iOS (171).

- Links: the test now reads nested pages and clean URLs (`/guide`,
  `/documentation` → `documentation/index.html`), and checks that the app
  leads to `/apprendre`, that it lists every content page, and that each page
  carries the sections bar (19 → 63).
- Guards: the content sources are not published, the generated pages and what
  they load are; the 404 stays out of the sitemap; APPRENDRE is a main tab
  with its own view, rendered without falling back to the recap (152 → 167).

- 26 more static guards (125 → 151): search engine basics, what the site publishes, the realtime
  permission, the iOS rule staying last, sheets clearing the safe areas. The
  iPhone guards fail on the previous `index.html`.
- 2 more RLS tests (231 → 233): a deleted account's notifications go with it,
  everyone else's stay. The upgrade test now plants an orphaned notification in
  every past version and checks the constraint afterwards.
- `test-montee.mjs`: installs each of the 10 past schema versions, adds data,
  then applies the current one twice and checks the data survived. It failed
  on 5 of 10 before the fix. Runs in CI with full history.
- 59 more business tests (87 → 146): durations, the merge, CSV reading.
- Static guards rewritten for the single inbox and extended (93 → 125).
- 32 more RLS tests (199 → 231): the feedback copy and its ordering, one
  notification per action, nobody signing `systeme`, `retour_id` not settable,
  and the whole coach conversation — both sides, strangers, the admin, forged
  authors, a self-thread, rewrite, delete, `anon`, and what happens after the
  link ends.
- 13 more static guards (80 → 93).
- 47 RLS tests for this mechanism alone (121 → 168): before the link, while
  pending, after acceptance, what the coach cannot do, the third party, the
  rejected second coach, revocation, ending the coaching, and `anon` throughout.
- 47 new RLS tests (66 → 113), covering profiles, feedback and administration —
  including the guarantee that an administrator still cannot read anyone's
  logbook.


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
