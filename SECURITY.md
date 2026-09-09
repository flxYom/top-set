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
