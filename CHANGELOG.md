# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/) —
while it stays below `1.0.0`, breaking changes (in particular to the
`localStorage` schema) can still happen between minor versions.

## [Unreleased]

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
