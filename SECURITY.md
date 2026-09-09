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
- Anything a crafted JSON backup can do on import: the file is treated
  as hostile, and identifiers, muscle groups and remembered exercises
  are re-validated on the way in.
- Ways to read or exfiltrate another visitor's `localStorage` data.
- Supply-chain issues in the vendored assets (`chart.umd.js`,
  `supabase.umd.js`, the self-hosted fonts).
- Anything that defeats the "no third-party network requests" guarantee
  described in the privacy policy (`confidentialite.html`).

Cosmetic bugs, broken layout, or feature requests are not security
issues — please open a regular [issue](../../issues) for those instead.

## Accepted linter warnings

Supabase's database linter reports five warnings that are deliberate. They are
recorded here so they are not re-investigated every time the report is read.

**`toucher_profil` is `SECURITY DEFINER` and callable by signed-in users.** It
has to cross RLS to read `auth.users.created_at` and create the profile row. It
never writes anywhere but `auth.uid()` — the identity comes from the token, not
from a parameter. Making it `SECURITY INVOKER` would require an `INSERT` and an
`UPDATE` policy on `profils` plus column-level grants to stop someone writing
`role = 'admin'` — trading one narrow, tested door for two open ones.

**The four `admin_*` functions are `SECURITY DEFINER` and callable by signed-in
users.** They have to cross RLS to read beyond a single logbook, and they have to
live in `public` to be reachable from a static site with no server. Each one
refuses non-administrators as its first statement, and
`supabase/test/test-rls.mjs` asserts that refusal on every run. The check belongs
in the function, not in whether the function is visible: a hidden function
without a role check would be strictly worse than a visible one that refuses.

**Leaked password protection is off.** It requires the Pro plan.

What would *not* be acceptable, and what the test suite guards against: a new
`SECURITY DEFINER` function appearing without justification, a sync function
switching from `INVOKER` to `DEFINER` (it would bypass every policy above it),
or any function without a pinned `search_path`.

---

## Supported versions

This project has no long-term-support branches. Only the code currently
on `main` (and the latest deployed version of the site) is covered —
please make sure you can reproduce the issue there before reporting.

## Reporting a vulnerability

Please **do not** open a public issue for a security report. Instead,
use GitHub's private reporting form for this repository:

**[Report a vulnerability](../../security/advisories/new)**
(Security tab → "Report a vulnerability")

Include what you found, the steps to reproduce it, and, if relevant,
which browser/OS you tested on. This is a solo, non-commercial project,
so there is no bug bounty and no guaranteed SLA, but reports are read
and real issues are fixed and credited in the release notes.
