# Security Policy

Top Set is a static, client-only app: there is no server, no database and
no account system. Everything runs in the visitor's browser and the only
persisted data is `localStorage`, on their own device. That shrinks the
attack surface a lot, but a few classes of issue are still meaningful:

- Cross-site scripting (XSS) or anything that lets a page bypass the
  Content-Security-Policy defined in `vercel.json`.
- Ways to read or exfiltrate another visitor's `localStorage` data.
- Supply-chain issues in the two vendored/self-hosted assets
  (`chart.umd.js`, the self-hosted fonts).
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
