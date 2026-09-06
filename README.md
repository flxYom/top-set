# top-set

`top-set` is a weightlifting logbook that runs entirely in the browser. You log
sets, weights, reps and RPE during a session, and it shows you volume, records
and progression over time.

There is no account, no sign-up and no server holding your data. Everything
lives in the browser's `localStorage` on the device you use. That is a
deliberate trade, and it cuts both ways — see [Where your data lives](#where-your-data-lives).

The interface is in French.

## What it does

- **Weekly planning** — pick a day, add exercises, add sets.
- **Set duplication** — `+ SÉRIE` copies the previous set (weight, reps, RPE,
  rest). Five identical sets means typing one and tapping four times.
- **RPE per set** — reps-in-reserve scale, 10 down to 6 in half points.
  Optional; leave it empty and nothing breaks.
- **Rest per set**, not per exercise.
- **Exercise memory** — type an exercise that isn't in the built-in list and it
  is remembered for next time, muscle group included.
- **Recap** — total volume, training calendar, per-exercise records and muscle
  group split, over a week, a month or a year.
- **Progression chart** per exercise.
- **File backup** — export the whole logbook as JSON, import it back on another
  device. Two-step confirmation, because importing replaces everything.

## Where your data lives

In `localStorage`, on one device, in one browser. Nowhere else.

What that buys you: no account, instant start, nothing to leak, works offline.

What it costs you: no sync between devices, and the logbook is **destroyed** by
clearing site data, switching phones, or using a private window. The `⇅` button
exports a backup file — that is the only copy that survives any of those.

The app refuses to overwrite a filled logbook with an empty one, and keeps a
recoverable copy of the previous state. That guards against a failed load
wiping everything; it does not guard against you clearing site data.

## Stack

No framework, no build step, no bundler. One HTML file with inline CSS and
JavaScript, plus static assets:

| | |
|---|---|
| `index.html` | the whole app, ~218 KB |
| `guide.html` | how-to page |
| `cgu.html`, `confidentialite.html`, `mentions-legales.html` | French legal pages |
| `chart.umd.js` | Chart.js 4.4.1, loaded on demand for the progression chart |
| `fonts/` | Bricolage Grotesque, self-hosted |
| `vercel.json` | security headers and cache policy |

Fonts and Chart.js are served from the site itself rather than from Google
Fonts and a CDN. That removes a third-party request carrying every visitor's IP
address, and it is what makes the strict CSP in `vercel.json` possible.

## Running it

Any static file server will do. There is nothing to compile.

```bash
npx serve .
```

Or open `index.html` directly — the only thing that breaks over `file://` is
the web app manifest.

## Deploying

Built for static hosting. On Vercel, import the repo and pick "Other" as the
framework preset; `vercel.json` handles the rest.

The domain appears 23 times across the HTML, `robots.txt` and `sitemap.xml`
(Open Graph tags, canonical links, sitemap URLs). One command updates all of
them:

```bash
node set-domaine.mjs yourdomain.com
```

## Installing on a phone

It is a PWA. On iOS, Share → Add to Home Screen. On Android, menu → Install app.

Worth doing on iOS for a reason beyond convenience: Safari may clear
`localStorage` for a site not visited in about a week, but not for a site
installed on the home screen.

## What it is not

- Not a coaching app. It records what you did; it does not tell you what to do.
- Not a medical device. Weights and RPE are what you typed, nothing is checked
  or validated.
- Not multi-device. There is no sync, by design, for now.
- Not a social app. No feed, no friends, no comparison.
