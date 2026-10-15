> **English** · [Français](../fr/donnees.md)

# Your data

Part of the [Top Set documentation](../../README.md#documentation).

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

Fourteen tables. Five carry the logbook — `seances`, `exercices`, `series`,
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
  [The coach link](coach-and-admin.md#the-coach-link).
- **`messages_support`** and **`messages_coach`** — the two halves of
  messaging. See [Messaging](coach-and-admin.md#messaging).
- **`notifications_admin`** — what the team should see go by, written only by
  triggers.
- **`liens_ami`** — who is friends with whom. One row per pair, either way
  round: the index is on `least`/`greatest` of the two ids, so two crossed
  requests cannot create two friendships.
- **`partages`** and **`partages_recus`** — what people send each other, and to
  whom. The content is a **frozen copy** (`jsonb`): a friend never reads
  `seances`, `exercices` or `series`, and no policy opens them. Neither table
  has any direct write right — apart from deleting your own share — because RLS
  filters rows, not columns: "everyone edits their own received rows" would have
  allowed an `update` making you the recipient of a share addressed to somebody
  else. See [Sharing your numbers with friends](features.md).

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
focus. **A day only leaves the queue once the server has confirmed it, and
only if nothing has changed since the push left.**

That second half cost a session (2026-10-14). Marking a day wrote a plain `1`,
and the confirmation cleared the flag without asking which version it was
answering. On gym wi-fi a push takes twenty seconds: sets logged meanwhile did
raise the flag, which the confirmation then wiped. The day passed for sent
while the cloud only held its older version — and the next pull, on returning
to the app, wrote that older version over the good one. Each marking now writes
**a distinct stamp** (`Date.now()` plus a counter); a confirmation only releases
the day if the stamp is still its own, otherwise the day stays dirty and leaves
again straight away. All five queues follow the rule: days, titles, cycles,
session notes, validations, exercise names.

Two guards surround it. A call that never returns — wi-fi that accepts the
connection and routes nothing — **gives up after 25 seconds** instead of
blocking every later push until a reload. And a pull **never adopts a cloud day
holding fewer logged sets than the local one**: that can only be a push still
pending, so the local version wins, goes back in the queue, and the cloud's is
stashed in `topset_conflits`.

**A database that lags behind does not eat comments.** Comments needed two
columns, `exercices.note` then `series.note`, added when `schema.sql` is re-run.
A database without them yet returns rows **without the** `note` **key**:
`jourDistant()` reads that as "the database doesn't know", not "comment deleted",
and keeps the phone's — the exercise found by id, else by position and name (the
database mints its own ids), the set by id, else by position. An up-to-date
database returns `note: null`, and then it is followed.

Storage keys: `musculation_sessions` (the logbook), `topset_custom_exercises`
(remembered exercises), `topset_sync` (queue and sync cursor), `topset_conflits`
(the losing side of a conflict, never discarded silently — capped at twenty
since 2026-10-14: it grew without bound and could end up filling the phone's
storage).

**Full storage no longer fails silently.** `localStorage.setItem()` throws when
the quota is reached, and the `catch` swallowed it: nothing was written until a
reload, while the app kept showing a session that existed nowhere. A write now
frees space with whatever is disposable, least useful first — conflicts, the
unreadable JSON set aside, the rollback copy — and retries each time. If
nothing helps, it says so: "phone storage full, export your logbook".

**Pending writes leave before you do.** A keystroke waits half a second before
being stored, so the app does not save on every letter. The iPhone can close
the app inside that window: `pagehide`, `beforeunload` and going to the
background now flush that queue.

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

**Titles, cycles, words, session validations and names now go out on their
own.** `pousser()` returned early when no day had changed, so a renamed
session, a validated session or a new exercise name waited for the next logged
set — sometimes for days. The six queues are now checked together, the
session's cycle and word included (`pousser_cycle`, `pousser_commentaire`, by
the same path as `pousser_titre`: a queue of dates, one call per date, and a
date only leaves the queue once the server confirms).

**A column the database does not have yet must erase nothing.** The cycle and
the word live locally from now on; until `schema.sql` is re-run, the database
returns the day **without** those keys, and the merge then keeps what is here.
An up-to-date database returns `cycle:null`, and there we follow. Same rule as
« session finished », and it is what lets the app ship before the SQL.

**The CSV imports back.** `lireCsvCarnet()` reads the exported CSV, and what
Excel makes of it when it re-saves it: commas instead of semicolons, DD/MM/YYYY
dates. It then goes through exactly the same cleaning as a JSON file. The
`Commentaire` column is read onto the set of its row, as the export writes it.
On 2026-10-10 the same trap was found on three more fields: `clean[ds]` is a
**whitelist**, and anything not named there is lost. « Finished » had always
been lost — restoring a backup turned a validated session into a merely done
one — and the cycle and the word would have gone the same way. All four are
read back.

**One page of the app does not overwrite another's logbook.** The local logbook
lives under a single key shared by the whole device: the installed PWA, a Safari
tab left open on the site, a page iOS kept suspended since yesterday. Each one
holds its own logbook in memory and rewrites the **whole** logbook on every
save — so the last one to save erased the sets noted in the others, with nobody
having deleted anything. That is the quietest way to lose yesterday's session
(14/10/2026).

`saveLocal()` therefore no longer trusts its own memory: **it re-reads before
writing**. If the stored text is no longer the one this page left there
(`dernierEcrit`), another page has written, and `TS.fusionnerEcritures()` takes
its days, exercises and sets back before the write, then marks them for the
account. When nothing has moved — the normal case — the write goes straight
through: **deleting a set is still a deletion**, not a conflict.

`fusionnerEcritures()` is the counterpart of `fusionnerCarnets()` for two writes
of the *same* logbook: neither side is "an older snapshot", so it also takes
back sets added to an exercise both sides know, which an import never does. Like
an import, it leaves the original logbook untouched and ignores empty cards.

**Overwrite guard.** `saveLocal()` rewrites the whole logbook on every save. If
`state.sessions` were empty at the wrong moment — a failed load, corrupted JSON —
that single call would erase everything, permanently and silently. So:

- The app **refuses** to replace a filled logbook with an empty one, and says so.
  The condition lifts on its own as soon as there is one real day again.
- Every save keeps the **previous version** under a recovery key.
- Unreadable JSON is **set aside** rather than overwritten.
- A `RÉCUPÉRER N JOURS` button appears in the `⇅` panel whenever a reserve holds
  a session **missing from the loaded logbook**. Recovering means importing that
  reserve: what is missing comes back, what is there does not move.

**The logbook repairs itself at startup** (15/10/2026). A read can fail without
destroying anything: `getItem` throwing, truncated JSON, a key iOS has emptied.
The app then showed an empty logbook although the sessions were still right
there — "I get to the gym and my history is gone", and then it comes back on its
own at the next reload. Sixty milliseconds after the first render,
`reparerAuDemarrage()` compares the loaded logbook with the reserves: if one
holds missing days, they are taken back immediately, without asking, and a
message says so. The merge never adds what is already there, so the message does
not come back next time.

There are **five reserves** on the phone, and until 14/10/2026 the button read
only two of them — so the others were being written for nothing:

1. the copy from before the last save (`musculation_sessions_secours`);
2. the text set aside when the logbook was unreadable (`…_illisible`);
3. the losing versions of a sync conflict (`topset_conflits`, a `date@time` →
   day map: per date, the one with the most sets is kept);
4. **its own** logbook parked per account — `topset_carnet_<their id>`, or
   `topset_carnet_anon` when nobody is signed in;
5. the **compact journal** (`topset_journal`), the only reserve that is not a
   copy of the logbook.

**The compact journal.** The first four reserves are copies of the whole
logbook: when storage fills up they all fail at the same time, for the same
reason. The journal keeps only the exercise name, weight, reps, RPE and the
day's title — no ids, no rest times, no formatting. Measured on a 60-day test
logbook: **121 KB for the logbook, 22 KB for the journal**. So it still goes
through when the logbook no longer does, which is exactly the moment that
worries us. It is written on every save, including right after the logbook's own
write failed, and it is never dropped to make room. The logbook can be rebuilt
from it alone; what it does not carry (comments, rest times, superset grouping)
does not come back.

The fourth reserve is only read under its own key, never by scanning
`topset_carnet_*`: a parked logbook is only recoverable by its owner, and
walking them all would have offered the previous account's logbook to the next
one on a shared phone.

The button offers the **union** of what those four hold in addition, and
announces what is missing rather than the size of the reserve. The old condition
compared the reserve to the whole logbook: it hid the button as soon as the
logbook had more sets in total, even when a whole day was missing from it.

**The storage diagnostic.** When a session is missing, the first question is not
"which bug" but "what is actually on this phone". The `DIAGNOSTIC DU STOCKAGE`
button in the `⇅` panel writes a readable report: the installed version (the
service worker's cache name), what is on screen, one line per key with its size
and what it holds — days, sets, date range — the total, and the room left,
measured by writing in 64 KB steps into a probe key that is always removed
afterwards. **No value is copied into it**: an account session key is a secret
(only its name appears), and a logbook has no business travelling inside a
report. The report goes out through the native share sheet, otherwise as a
download, and stays in the text box so it can be copied by hand.

For an account, a `TOUT RETÉLÉCHARGER DE MON COMPTE` button asks for the whole
logbook again without the new-since cursor: ordinary sync only asks for what
changed since last time, so nothing brought back a day that fell off this phone
after reaching the account. The pull's guard keeps the days that are more
complete here.

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
served from the site itself. So is audience measurement (since 18 September
2026): `mesure.js` loads Vercel Web Analytics from `/_vercel/insights/`, on
top-set.fr only, with no cookie and nothing from the logbook; the service worker
never caches those requests. Loading them from a CDN would send every visitor's IP
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
