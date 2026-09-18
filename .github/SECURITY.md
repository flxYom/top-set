# Security Policy

Top Set is a static site with no backend of its own: there is no server
we operate and no build step. Everything runs in the visitor's browser,
and `localStorage` on their own device stays the source of truth.

Accounts are optional. When one exists, a copy of the logbook also lives
in Postgres at Supabase, reached straight from the browser with the
public anon key. Every table has Row Level Security keyed on
`auth.uid()`, and the sync functions are `security invoker`, so the
database — not the front end — is what enforces who reads what.
`supabase/test/test-rls.mjs` asserts this on every run.

Classes of issue that matter here:

- Cross-site scripting (XSS) or anything that lets a page bypass the
  Content-Security-Policy defined in `vercel.json`. The app builds its
  markup by string concatenation, so any value reaching HTML without
  `esc()` is a real finding — `test/gabarits.test.mjs` guards the forms
  that have already caused one.
- Anything that lets one account read, write or delete another's rows,
  or that lets a non-administrator reach the `admin_*` functions.
- Anything a crafted JSON backup or CSV file can do on import: the file
  is treated as hostile, and identifiers, muscle groups and remembered
  exercises are re-validated on the way in.
- Anything that lets someone write into a conversation they are not part
  of, or sign a message as someone else (`admin`, `coach`, `systeme`).
- Ways to read or exfiltrate another visitor's `localStorage` data.
- Supply-chain issues in the vendored assets (`vendor/chart.umd.js`,
  `vendor/supabase.umd.js`, the self-hosted fonts).
- Anything that defeats the "no third-party network requests" guarantee
  described in the privacy policy (`confidentialite.html`).

Cosmetic bugs, broken layout, or feature requests are not security
issues — please open a regular [issue](https://github.com/flxYom/top-set/issues) for those instead.

## Accepted linter warnings

Supabase's database linter reports warnings that are deliberate. They are
recorded here so they are not re-investigated every time the report is read.

**`toucher_profil` is `SECURITY DEFINER` and callable by signed-in users.** It
has to cross RLS to read `auth.users.created_at` and create the profile row. It
never writes anywhere but `auth.uid()` — the identity comes from the token, not
from a parameter. Making it `SECURITY INVOKER` would require an `INSERT` and an
`UPDATE` policy on `profils` plus column-level grants to stop someone writing
`role = 'admin'` — trading one narrow, tested door for two open ones.

**Four `admin_*` functions are `SECURITY DEFINER` and callable by signed-in
users** — `admin_apercu`, `admin_membres`, `admin_retours`,
`admin_marquer_retour`. (`admin_fils` is `INVOKER` and checks nothing, like
`tirer_jours_de`: RLS decides which threads come back.) They have to cross RLS to read beyond a single logbook, and they have to
live in `public` to be reachable from a static site with no server. Each one
refuses non-administrators as its first statement, and
`supabase/test/test-rls.mjs` asserts that refusal on every run. The check belongs
in the function, not in whether the function is visible: a hidden function
without a role check would be strictly worse than a visible one that refuses.

**Seven coach-link functions are `SECURITY DEFINER`.** `coach_de` and
`mon_coach_id` are called *from the policies*, so they must be executable by
`authenticated` — a policy is evaluated with the caller's privileges, and
revoking them makes every logbook read fail, including your own. Neither takes a
parameter that lets you ask about someone else's relationship. The five writes
(`devenir_coach`, `cesser_coach`, `demander_coach`, `repondre_demande`,
`revoquer_lien`) each check which side of the link the caller is on as their
first statement.

**`est_admin` is `SECURITY DEFINER` and executable by signed-in users**, for
the same reason as `coach_de`: the messaging policies call it, and a policy is
evaluated with the caller's privileges. It takes no parameter and only answers
about the caller.

**`notifier_admin` and `accuser_retour` are `SECURITY DEFINER` triggers.**
They write where no policy lets anyone write — admin notifications, and the
acknowledgement signed `systeme`. They return `trigger`, so they cannot be
called as an RPC, and they read nothing but the row that was just written.

The three coach *reads* — `tirer_jours_de`, `mes_coaches`, `mon_coach` — are
deliberately `SECURITY INVOKER` and check nothing at all: they ask for the rows
and RLS answers. Without an active link the result is empty, not because an
`if` decided so but because the database has nothing to show. A test asserts
they never become `DEFINER`.

**Leaked password protection is off.** It requires the Pro plan.

What would *not* be acceptable, and what the test suite guards against: a new
`SECURITY DEFINER` function appearing without justification, a sync function
switching from `INVOKER` to `DEFINER` (it would bypass every policy above it),
or any function without a pinned `search_path`.

---

## Hardening log

**18 September 2026.** Added: a per-hour cap on inserts into `retours`,
`messages_support` (member side) and `messages_coach`, enforced by a
`security definer` trigger (`plafond_envois`, not callable through the API).
Checked: only the `anon` key ships to the browser (JWT role `anon`), HTTPS
is forced (308 + HSTS), every external link resolves (47 DOIs checked through
the DOI handle API). Not verifiable from the repository: the Supabase Auth
rate limits and CAPTCHA settings in the dashboard.

**14 September 2026 audit.** Found and fixed:

- `retours`, `consentements` and `messages_coach` granted `insert` on every
  column. A member could send a feedback already marked `traite` (so it never
  showed in the admin queue), backdate a consent, or post a coach message
  already read. Inserts are now limited to the columns the app fills; status,
  dates and `lu` come from the database.
- The `update (lu)` policies let a sender mark their own messages read,
  removing them from the other side's unread count. Each side now marks only
  what the other side wrote.
- `devenir_coach()` built invite codes with `random()`, which is not a
  cryptographic generator. It now draws from `gen_random_uuid()`.
- Added `Cross-Origin-Opener-Policy: same-origin`. Two feedback labels reached
  HTML unescaped; their values were constrained by the database, so this was
  not exploitable, but they now go through `esc()` like everything else.

Checked and found sound: RLS on every table, `anon` without rights, admin and
coach functions checking the caller first, `search_path` pinned on every
function, no secret in the repository or its history, the CSP (no inline
script), escaping of every user-supplied value rendered as HTML.

Not verifiable from the repository: the Supabase dashboard settings (email
confirmation, leaked-password protection, Auth rate limits).

## Supported versions

This project has no long-term-support branches. Only the code currently
on `main` (and the latest deployed version of the site) is covered —
please make sure you can reproduce the issue there before reporting.

## Reporting a vulnerability

Please **do not** open a public issue for a security report. Instead,
use GitHub's private reporting form for this repository:

**[Report a vulnerability](https://github.com/flxYom/top-set/security/advisories/new)**
(Security tab → "Report a vulnerability")

Include what you found, the steps to reproduce it, and, if relevant,
which browser/OS you tested on. This is a solo, non-commercial project,
so there is no bug bounty and no guaranteed SLA, but reports are read
and real issues are fixed and credited in the release notes.
