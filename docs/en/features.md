> **English** · [Français](../fr/fonctionnalites.md)

# Features

Part of the [Top Set documentation](../../README.md#documentation).

## What it does

**The first screen.** On the very first visit, the app opens on
`COMMENCER SANS COMPTE` at the top, with the account form right below — no extra
step for anyone who wants one. It used to be the other way round: a sign-up
form, with the way out as a small underlined link at the very bottom, while the
site description and the product page promise "no account". The button hides
during a password reset or change, where it would abandon the operation halfway.

**Planning and sessions.** The app opens on **SÉANCES › DU JOUR**, the log where
you write: the day banner, then exercises and sets. **PLANNING** is a calendar
you look at: **SEMAINE** (default, one row per day: session title, exercises,
sets, done or planned, then the muscle groups of the week), **MOIS** (the grid,
a dot in the colour of the main muscle group, filled for a done session,
outlined for a planned one) and **JOUR** (one session in detail). Arrows move by
day, week or month; `AUJOURD'HUI` turns orange once you have moved away.
Tapping a session shows its sheet, filed under MES SÉANCES, and `‹ RETOUR`
brings you back to the calendar; an empty day opens in DU JOUR, where
`AUJOURD'HUI ›` brings you back to today. **SÉANCES** has three sections: DU JOUR, MES SÉANCES and
HISTORIQUE.

**One set, one row.** `SÉRIE · 8 SEPT. · KG · REPS · RPE · ✓`, the grid of Strong
or Hevy, kept because it is the one people know. Each set used to take three
rows — weight, then type, then RPE and rest — and a five-set exercise filled two
screens. The **number** carries the set type: tap it, the native menu opens, and
`TOP`, `B.O.` or `ÉCH.` takes its place. The **last-time column** is headed with
the previous session's date — « PRÉC. » was not understood — and shows the same set last time
(the 3rd facing the 3rd). It is **read**, it no longer copies anything: it used
to copy on tap, from a cell 4 px away from the weight field, and a stray tap
logged a set that was never lifted. The **date heading the column** is a real
button, outlined, with an arrow: it opens the previous session in DU JOUR,
and an orange bar at the bottom of the screen, `RETOUR À MA SÉANCE`, brings you
back to the day you left, on the exercise you left from. The bar tracks one
round trip, not a chain: from the previous session its own date leads further
back, but the return always targets the starting point. It hides on other tabs
and goes away once you are back on the starting day, through it or the
calendar. For an exercise with no history the column is not shown (`.sans-prec`).
A **done** set loses its borders and its row turns faintly green — you see where
you are without reading every check, as in Hevy — and one tap still edits it.

**The « Salle noire » redesign (September 2026).** A visual pass, not a
rewrite: same screens, same data, same logic. It lives in a single
`<style id="refonte">` block placed after the original styles — removing it
brings the old interface back. Near-black background, three surface levels
instead of cream borders, 10 to 26 px radii, one soft shadow and a single orange
glow for the main action; Bricolage Grotesque keeps headings and numbers, body
text moves to the phone's own font. Tabs move to the bottom on phones. An empty
day's banner and the welcome screen carry two ambient images generated with
Higgsfield (Seedream 5 Lite), as 22 and 23 KB WebP files; the photo encoded in
the page is gone, 86 KB less on every load. Decisions, sources and what was
ruled out (Pinterest, Canva), in French:
[`docs/design/direction-refonte-2026-09.md`](../design/direction-refonte-2026-09.md).

**The tab lens, muscle-group colours, waiting states (September 2026).** Under
the active tab sits a piece of glass (`#ongletLoupe`, placed by `placerLoupe()`
on every `montrerVue`): a highlight on top, a barely visible light rim.
Switching tabs, it slides, stretches in the direction of travel and a single
warm glint runs around the rim for the trip (0.46 s); the label stays above it,
sharp. It can also be **dragged with a finger**: past 8 px of horizontal
movement it lifts and follows the finger, the tab underneath lights up, and the
nearest one opens on release; a plain tap is still a click (Pointer Events,
`touch-action:none` on the bottom bar). **On phones the bottom bar follows
iOS 26**: a floating grey capsule, a grey pill under the active tab, lowercase
labels; on touch, while dragging or switching tabs, the pill turns into a glass
bubble that magnifies what it covers, with prism fringes (cyan, yellow,
magenta) near its edge. Safari cannot distort what lies behind an element, so
the bubble carries its own copy of the tabs (built by `app.js`), magnified,
plus three coloured copies slightly smaller or larger, shown only near the
edge; `suivreBulle()` re-aligns them every frame on the position actually
drawn during the trip. Desktop keeps the top bar. It is the app's only deliberate piece of glass, and it jumps without
animation when the device asks for reduced motion. **Muscle groups** no longer
reuse any meaning colour — orange (brand, action), yellow (record), green
(success), blue (information): Pectoraux `#ff7aa2`, Dos `#22b8a8`, Épaules
`#a99bff`, Bras `#d45fc4`, Jambes `#b3d236`, Abdos `#c99a6b`, Cardio `#6fd6f5`,
Autre `#8f887d`. `node scripts/palette-groupes.mjs` checks the distance to the
meaning colours, the distance between groups under the three common colour
vision deficiencies, and contrast; a guard refuses a group reusing a meaning
colour. **Waiting** speaks one language, loading a barbell: after « OUI, C'EST
PLIÉ » (3.2 s) and now also « REVOIR LE BILAN » (quick version, 2 s), one
plate per exercise in its group colour, orange collars snap on, the bar lifts
off, the plates follow a beat late and the floor shadow tightens; a tap skips
to the summary. The account loader plays the same scene in a loop with neutral
plates. Short waits (lists, chart, message thread, admin) show the bar small
(`attente()`) instead of a bare « Chargement… ». Rules and open decisions, in
French: [`DESIGN_SYSTEM.md`](../design/DESIGN_SYSTEM.md).

**44 px targets.** Measured on a 375 px screen, eight buttons on the card were
below Apple's recommended 44 points: the `⋯` menu (40), the suggestion copy
(36), the `−` `+` steps, rest, comment and bin (40), superset (40), and the
exercise name (22 px tall). All are now 44 px; the name, 40.

**The open set.** One per exercise, outlined in orange: by default the first one
not done yet. Under it, its tools — `−` `+` (2.5 kg, or 5 s for timed sets),
rest, comment, bin. Checking a set folds it and opens the next; focusing a field
of another set opens that one, without a re-render, so the keyboard stays up.
Only a field or a menu opens a set: a button that took focus moved the toolbar
between press and release, and the tap landed elsewhere. It is screen state,
kept in memory, never saved.

**The card.** The muscle group is a chip in the header (`PECS`, `DOS`…) with the
native menu laid over it. The superset button stays under `+ SÉRIE` — it is a
logging action, not a setting; timed mode and delete live in the `⋯` menu. The card is a container
(`container-type: inline-size`): under 310 px of usable width — small phone,
superset on a 360 px screen — the last-time column gives way to today's numbers, and
the *Dernière fois* line lists last time's sets instead.

**Set duplication.** `+ SÉRIE` copies the previous set — weight, reps, RPE, rest.
Only `fait` resets, and the comment is not copied. Five identical sets means
typing one and tapping four times. The row is added to the card without
re-rendering the screen, and without opening the keyboard: it is already
filled in, and `−` `+` fix the weight. Re-rendering the whole panel deleted the
field you had just typed in — on iPhone, tapping a button does not leave that
field — and Safari sent the page back to the top. When the screen still has to be
redrawn (`renderDayPanel`, `repeindreCarte`), the app leaves the field first and
puts the page back where it was.

**RPE per set.** Reps-in-reserve scale, 10 down to 6 in half points: 10 is
failure, 9 leaves one rep, 8 leaves two. Optional — leave it empty and nothing
breaks. The cell only fits the number, so the sentence (« RPE 8 — 2 reps en
réserve ») flashes at the bottom of the screen when you pick one: a tooltip
never shows on a phone.

**Timed exercises: planks, wall sits, dead hangs.** A hold is measured in
seconds. Typing « Planche » or « Gainage » switches the set to a duration as you
type — `−5` and `+5` replace the 2.5 kg steps — and the `⋯` menu switches any
other exercise. In the `DIFF.` column, a 1–10 *difficulty* replaces reps in reserve, which
mean nothing for a plank. The record is the longest hold, the exercise page
charts the best time session after session, the recap shows minutes.

The duration lives **in the reps field, written with its unit**: `45 s`. That
field is already free text, so the database, the sync, the backup and the CSV
carry it without any format change. The unit is mandatory: a bare `45` stays
45 reps — guessing would reinterpret sets already logged. A duration counts
toward no volume, no estimated 1RM and no rep record.

**A stopwatch for holds.** On a timed exercise, `▶ CHRONO` next to `+ SÉRIE`
starts the clock; one more tap pauses it, and the time held fills the first
empty set (a load already entered stays) and ticks it. The next tap starts
again from zero: one pause, one set. The start time is kept in `localStorage`
(`topset_chrono`), so an app the iPhone closed mid-plank finds its stopwatch
again, and the screen stays on while it runs (Wake Lock, where available). One
stopwatch at a time: starting another logs the running one first.

**Rest between sets.** Ticking a set, or pausing the stopwatch, starts the rest:
it counts up from zero in a pill at the bottom left, facing "back to top".
Ticking the next set, restarting the stopwatch or tapping the pill stops it and
writes its length into the REST field of the set that started it. Under 10 s
(sets ticked after the fact) or over 20 min (a forgotten rest), nothing is
written; unticking that set cancels it, validating the session drops it. Only
on today's session, kept in `localStorage` (`topset_repos`) like the
stopwatch, with the screen kept on.

**Cardio: minutes, speed, incline.** Treadmill, running, walking, bike,
rower… open as cardio: a set is a duration **in minutes** (`25`, `12,5`), plus
average speed (km/h) and incline (%), both optional; `−1′` and `+1′` replace
the steps. The duration lives in the reps field like a plank, so records, chart
and recap already read it. Speed and incline are two new set fields, absent
when empty, bounded (0–99.9 km/h, −30–99.9 %) and rounded to one decimal; in the
database, `series.vitesse` and `series.inclinaison`, where `pousser_jour` drops
an unreadable or out-of-range value instead of rejecting the day. Until
`schema.sql` is re-run, a database that doesn't return those keys doesn't wipe
them from the phone (`jourDistant`, as for comments). The CSV gains two columns
on the right, `Vitesse (km/h)` and `Inclinaison (%)`; an older CSV still
imports. A treadmill already logged in reps stays in reps: history wins over
the name.

**Redo last time.** Three gestures, never from the last-time column, which is
read and copies nothing:
- `↺ DERNIÈRE FOIS`, next to `+ SÉRIE`, while no set is filled: the sets of the
  last session on that exercise, the 3rd facing the 3rd (weight, reps, type,
  rest, speed and incline). Nothing is ticked, RPE is left for today, a set
  already filled is not touched (`repriseSerie`).
- `+ AJOUTER À MA SÉANCE DU JOUR`, under each exercise of a past, done session —
  in its page, or in DU JOUR when opened from the last-time date: the
  exercise lands in today's session with its sets, RPE included, nothing
  ticked. The same exercise already placed and still empty receives the sets
  instead of a duplicate (`ajouterAuJour`). "Done" means validated, or past
  with sets — otherwise no logbook from before validation would benefit
  (`seanceFaite`).
- On an empty day, `↺ REFAIRE CELLE DE LUNDI DERNIER` (same weekday, the week
  before) and `↺ REFAIRE MA DERNIÈRE SÉANCE` when it is a different one, with
  their title; everything is copied by `selectionnerSeance`.

**What went with it last week.** Under `+ AJOUTER UN EXERCICE`, as soon as an
exercise of the day has a name: the exercises of the same session last week
(same matching as the recap, one exercise in common is enough) that are not in
today's yet, four at most. A tap adds it empty, with as many sets as that day —
the last-time column and `↺ DERNIÈRE FOIS` do the rest. Nothing on a session
already done (`suggestionsExo`).

**Tools under the planning.** The 1RM calculator, the RPE table and the
spreadsheet template: three links at the bottom of the planning screen, on top
of the Learn tab.

**Rest per set**, not per exercise, and carried over when a set is duplicated.

**A comment per set.** For what the numbers don't say: « assisted », « with
bands », « a bit tired ». `+ COMMENTAIRE`, next to `+ SÉRIE`, adds one to the
last set done — right after is when you think of it — and the speech bubble in
the tools to any other set. It is written under the set, like text; emptied, it
disappears. Next time it shows under *Dernière fois* with its set number
(« S3 : assistée »); it also appears in the session sheet, the exercise history
and the logbook a coach reads. Copying a session copies the sets, not the
comments. At most 500 characters, in the app and in the database. A set's `note`
field only exists when filled in, and the CSV carries it as a last column,
`Commentaire`, on its set's row.

The comment was first **per exercise**: too vague to say which set had been
assisted. `normalizeExercise()` moves an old exercise comment onto its last set
(before that set's own, if it had one), where « assisted on the last one » meant
something; nothing is lost. An exercise with no set keeps its own, having
nowhere to put it.

**The day banner takes a drawing** from the session's dominant muscle group: a
bench for chest, a squat rack for legs, a bar and rings for back, dumbbells for
shoulders, an EZ bar for arms, an ab wheel for abs, a heartbeat trace and a
rope for cardio. Grey SVGs (`img/hero/`) that the group's tint colours over,
like the photo; « Autre » and an empty session keep the plates photo. They are
in the service worker's shell, so they work offline too.

**The end of a session.** At the bottom of today's session, once anything
is logged, `✓ TERMINER MA SÉANCE` asks for confirmation — pointing out sets
that are logged but unchecked, which still count — then shows a **recap**. First
**the same session last week**, recognised by its exercises (of the 14 days
before, the one sharing the most, ties going to the one closest to 7 days back,
at least half of them in common): how many exercises went up, counting from
zero, then one line per exercise with its badge ▲ / ▼ / = (estimated 1RM of the
top set, reps without load, total time for cardio, best hold for a plank). Then
sets, exercises, records broken, the **top set of the day** (highest estimated
1RM, not the heaviest raw load), the other exercises that beat **last time**,
and one line drawn from the date — the same all day, another one tomorrow. No
tonnage any more: the kilos lifted said nothing about progress.
Everything comes from the logged sets: no line appears without the numbers to
compute it.

Validation is a **timestamp** on the day (`termine`), not a boolean: the recap
shows the time, and two devices can compare them. It travels through its own
call, `pousser_fin`, modelled on the title — a database without the
`seances.terminee` column returns a day **without the key**, and the local
validation stays. Nothing is locked: sets remain editable afterwards.

**Exercise memory.** Type an exercise that is not in the built-in list and it is
remembered for next time, muscle group included. Saved on blur rather than on
each keystroke, so you do not end up with `B`, `Be`, `Ben`. The card then asks
the question in plain words: **add it to my exercises**, or **link it to an
existing one** (same movement, another name: the history stays in one piece). It
used to announce « ajouté à tes exercices » without showing that linking was
possible — and since the new card, the box was inserted next to an element that
had moved into the header, so it no longer appeared at all.

**Gym shorthand.** `RDL`, `OHP`, `bench`, `deadlift`, `BSS`…: some forty
abbreviations and English names point at a name in the built-in list
(`SYNONYMES`). No fuzzy match could find them — « RDL » and « Soulevé de terre
roumain » share no letter. While typing, the card offers the full name;
accepting **renames** the exercise and keeps the abbreviation **linked** to the
real name for next time. Nothing is decided without the user: the table only
suggests.

**Recap.** Total volume (weight × reps, summed), a training calendar, per-exercise
records and a muscle-group split — over a week, a month or a year.

**Progression chart** per exercise, drawn from your own history.

**Feedback.** A link at the bottom of every screen opens a form: a bug, an idea,
a question. It lands in the database, not in a mailbox, and the app takes you
straight to your conversation with the team, where the reply will arrive.

**Messages.** A speech bubble in the header opens every conversation in one
place — the Top Set team, your coach, your clients — with a badge counting what
is waiting. See [Messaging](coach-and-admin.md#messaging).

**Three doors in the header.** The messages bubble, the **profile** silhouette
(account, pseudonym, coach, sync) and `⇅` for **data** (backup, CSV, import).
Account and files used to share one sheet, which had become a catch-all.

**Built for the phone.** Below 900 px the tabs live **at the bottom**, under
the thumb, with icons; they tuck away while a field has the keyboard
(`body.clavier`) and make room for the composer in a conversation. On a
desktop they stay a segmented bar at the top. A
back-to-top arrow appears once you are a screen down. Double-tapping `+` adds
5 kg instead of zooming (`touch-action: manipulation`), and focusing a field no
longer zooms Safari: on iOS every field is at least 16 px, the size below which
Safari zooms in on its own — and never zooms back out. The redesign layer comes
after it but never touches those fields' size, which a guard checks. That rule is **the last
one among the original styles**: at equal specificity the rule written lower wins, and
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

## Sessions: two tabs

The **SÉANCES** view is split in two. *Mes séances* holds what is left to do —
sessions prepared but not yet logged, today's, and upcoming ones — sorted oldest
first, so a skipped session rises to the top instead of getting buried. The
*Créer ma séance* box lives there. *Historique* holds what is done, newest first,
grouped by month.

The boundary is whether the session has been logged, not the date alone: a
session logged today stays in *Mes séances* until tomorrow, because it is still
the one being worked on.
