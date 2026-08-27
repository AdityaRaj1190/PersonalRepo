# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A client-only React + Vite app that generates a sidereal (Vedic) birth chart
("Kundli") from a name, geolocation-searched place of birth, date of birth,
and time of birth. There is no backend — all astronomy, geocoding-to-timezone
conversion, and chart rendering happen in the browser.

## Commands

```bash
npm install
npm run dev      # start dev server (Vite)
npm run build    # production build to dist/
npm run preview  # serve the production build locally
npm run lint     # oxlint
```

There is no test suite. When validating a change to the astrology math, the
practical approach used throughout this project's history is a disposable
Node script (`node some-script.mjs`, deleted after use) that imports
`computeBirthChart` from `src/lib/astro.js` directly and prints results for a
known birth (date/time/lat/lon), cross-checked against a third-party
reference chart.

## Architecture

**Calculation pipeline** (`src/lib/`):
- `geocode.js` — `searchLocations()` hits the free OSM Nominatim API for the
  place-of-birth autocomplete. `localToUtc()` takes the user's local
  date/time + lat/lon, resolves the IANA timezone via `tz-lookup`, and uses
  `luxon` to get the correct UTC instant (handles historical DST correctly;
  this step has to happen before any astronomy runs).
- `astro.js` — the core engine. `computeBirthChart(utcDate, lat, lon)` is the
  single entry point and returns `{ ayanamsa, ascendant, planets, houses }`.
  Internally: geocentric apparent tropical longitudes come from
  `astronomy-engine` (Sun via `SunPosition`, Moon via `EclipticGeoMoon`,
  others via `GeoVector` + `Ecliptic`); Rahu is the mean lunar node (Meeus
  formula), Ketu is +180°; all tropical longitudes are shifted by an
  approximate Lahiri ayanamsa (own polynomial fit, not from a library) to get
  sidereal positions; houses are whole-sign from the ascendant's rashi.
- `chartLayout.js` — pure layout data: fixed SVG polygon coordinates for the
  12 North Indian diamond-chart house shapes, and the fixed rashi→grid-cell
  map for the South Indian style, plus planet abbreviations.
- `format.js` — degree formatting (`12°34'56"`) shared by the table and chart.

**UI** (`src/components/`): `BirthChartForm` (+ `LocationAutocomplete`) feeds
`App.jsx`, which calls `localToUtc` then `computeBirthChart` and passes the
resulting chart object down to `ChartDisplay` (toggles between
`NorthIndianChart`/`SouthIndianChart`, both fixed-layout SVGs driven by
`chartLayout.js`) and `PlanetTable`. `PlanetGlyphs` renders the small
retrograde/exalted/debilitated/combust markers shared by both chart styles.

## Non-obvious gotchas (learned the hard way)

- **Ascendant math has a real ambiguity to watch for**: solving "where does
  the ecliptic cross the horizon" yields two antipodal solutions (ascendant
  and descendant). `tropicalAscendant()` in `astro.js` disambiguates using
  the candidate point's hour angle — don't simplify this away, an earlier
  version without that check silently returned the descendant (opposite
  zodiac sign) roughly half the time depending on sidereal time/latitude.
- **Rahu/Ketu are never marked retrograde** in the UI even though they
  technically always move backward — Vedic convention treats that as their
  default state, so `(R)` would be redundant. The `retrograde` field on
  their chart entries is hardcoded `false` for this reason.
- **Ayanamsa values will differ slightly (~0.1-0.2°) from other software** —
  there's no single universally agreed Lahiri formula. This is expected
  variance, not a bug, and shows up as a small constant offset across every
  planet when comparing to a reference chart.
- **Vite is pinned to v7, not v8** — v8's default bundler (Rolldown) pulls in
  a platform-specific native binary via `optionalDependencies`, which hits a
  known npm bug (npm/cli#4828) where the right platform binary silently
  fails to install (seen on Windows). Don't upgrade past v7 without checking
  that bug is actually fixed.
- **Theme is permanently light** — the `prefers-color-scheme: dark` variant
  was deliberately removed from `index.css` per explicit user preference;
  don't reintroduce a dark mode without being asked.
- **Deployment/branch workflow**: this repo deploys to Vercel tracking the
  `main` branch. Work happens on `claude/hindu-birthchart-generator-fkp7iw`
  and reaches production only once a PR from that branch is merged into
  `main`. If that branch's PR has already been merged and more commits get
  added to the same branch afterward, those commits are orphaned from
  `main`'s perspective — the fix is to reset the branch onto current `main`
  and replay only the not-yet-merged commits before opening a new PR (don't
  assume pushing to the branch alone gets anything deployed).
