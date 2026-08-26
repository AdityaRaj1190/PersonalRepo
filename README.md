# Hindu Birth Chart Generator

A client-only React app that generates a sidereal (Vedic) birth chart — a
Kundli — from a name, place of birth, date of birth and time of birth.

## Features

- Name text field
- Geolocation-based place-of-birth search (autocomplete dropdown backed by
  the OpenStreetMap Nominatim API)
- Date of birth and time of birth pickers
- Sidereal planetary positions (Sun, Moon, Mars, Mercury, Jupiter, Venus,
  Saturn, Rahu, Ketu) using the Lahiri (Chitrapaksha) ayanamsa
- Ascendant (Lagna), whole-sign houses, nakshatra and pada for every planet
- North Indian (diamond) and South Indian (grid) chart styles, toggleable
- A planetary position table with rashi, degree, house, nakshatra and pada

## How it works

- **Astronomy**: [`astronomy-engine`](https://github.com/cosinekitty/astronomy)
  computes geocentric apparent tropical ecliptic longitudes for the Sun,
  Moon and visible planets. The mean lunar node gives Rahu (Ketu is its
  opposite point). The ascendant is computed from local sidereal time,
  the observer's latitude and the obliquity of the ecliptic (Meeus,
  *Astronomical Algorithms*, ch. 12). All tropical longitudes are then
  shifted by an approximate Lahiri ayanamsa to get sidereal (nirayana)
  positions, from which rashi (sign), nakshatra, pada and whole-sign house
  are derived.
- **Location & time zone**: place search uses the free Nominatim geocoding
  API; `tz-lookup` maps the resulting latitude/longitude to an IANA time
  zone, and `luxon` converts the local birth date/time in that zone to the
  correct UTC instant (including historical DST) before any astronomical
  calculation runs.

All calculations run client-side — there is no backend.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL in your browser.

Other scripts:

```bash
npm run build    # production build
npm run preview  # preview the production build
npm run lint     # oxlint
```

## Disclaimer

Planetary positions and the ayanamsa used here are standard astronomical
approximations intended for informational and educational use, not
professional-grade ephemeris precision.
