import * as Astronomy from 'astronomy-engine';

export const RASHIS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

export const RASHI_LORDS = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];

export const NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

export const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

const BODY_MAP = {
  Sun: Astronomy.Body.Sun,
  Mercury: Astronomy.Body.Mercury,
  Venus: Astronomy.Body.Venus,
  Mars: Astronomy.Body.Mars,
  Jupiter: Astronomy.Body.Jupiter,
  Saturn: Astronomy.Body.Saturn,
};

function toJulianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/** Mean obliquity of the ecliptic (Meeus 22.2, truncated), in degrees. */
function meanObliquity(jd) {
  const T = (jd - 2451545.0) / 36525;
  return 23.4392911 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
}

/**
 * Lahiri (Chitrapaksha) ayanamsa approximation, in degrees.
 * T measured in Julian centuries from 1900-01-00.5 (JD 2415020.0); the
 * coefficients reproduce the officially published Lahiri value of ~23.85
 * degrees at J2000.0 to within a fraction of an arcminute.
 */
function lahiriAyanamsa(jd) {
  const t = (jd - 2415020.0) / 36525.0;
  return 22.460148 + 1.396042 * t + 0.000308 * t * t;
}

function normalizeDegrees(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

/** Sign (rashi index) of exaltation for each graha (classical uchcha rashi). */
const EXALTATION_RASHI = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
  Rahu: 2, Ketu: 8,
};

/** Sign (rashi index) of debilitation for each graha (classical neecha rashi). */
const DEBILITATION_RASHI = {
  Sun: 6, Moon: 7, Mars: 3, Mercury: 11, Jupiter: 9, Venus: 5, Saturn: 0,
  Rahu: 8, Ketu: 2,
};

/** Combustion orb (degrees from the Sun) when direct. */
const COMBUSTION_ORB = { Moon: 12, Mars: 17, Mercury: 14, Jupiter: 11, Venus: 10, Saturn: 15 };
/** Tighter combustion orb classically used for Mercury/Venus when retrograde. */
const COMBUSTION_ORB_RETROGRADE = { Mercury: 12, Venus: 8 };

function angularSeparation(a, b) {
  const diff = Math.abs(normalizeDegrees(a) - normalizeDegrees(b)) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function isCombust(planet, sidereal, sunSidereal, retrograde) {
  const orb = (retrograde && COMBUSTION_ORB_RETROGRADE[planet]) || COMBUSTION_ORB[planet];
  if (!orb) return false;
  return angularSeparation(sidereal, sunSidereal) <= orb;
}

/** Geocentric apparent tropical ecliptic longitude of a body, in degrees. */
function tropicalLongitude(planet, date) {
  if (planet === 'Sun') return Astronomy.SunPosition(date).elon;
  if (planet === 'Moon') return Astronomy.EclipticGeoMoon(date).lon;
  const vec = Astronomy.GeoVector(BODY_MAP[planet], date, true);
  return Astronomy.Ecliptic(vec).elon;
}

/** Mean lunar ascending node (Rahu), tropical longitude, Meeus 22.2-adjacent formula. */
function meanLunarNodeLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  return normalizeDegrees(omega);
}

/**
 * Ascendant (Lagna), tropical ecliptic longitude, in degrees.
 * Formula from Meeus, "Astronomical Algorithms", ch. 12.
 */
function tropicalAscendant(date, latitude, longitude) {
  const jd = toJulianDay(date);
  const gastHours = Astronomy.SiderealTime(date);
  const ramc = normalizeDegrees(gastHours * 15 + longitude);
  const eps = meanObliquity(jd) * (Math.PI / 180);
  const ramcRad = ramc * (Math.PI / 180);
  const latRad = latitude * (Math.PI / 180);

  // Solving "ecliptic point lies on the horizon" gives two antipodal
  // solutions (the ascendant and the descendant); atan2 alone doesn't tell
  // us which is which, so we disambiguate using the point's hour angle -
  // the ascendant is the one currently east of the meridian (negative H).
  const y = -Math.cos(ramcRad);
  const x = Math.sin(eps) * Math.tan(latRad) + Math.cos(eps) * Math.sin(ramcRad);
  const lambda0 = Math.atan2(y, x);

  const ra0 = Math.atan2(Math.sin(lambda0) * Math.cos(eps), Math.cos(lambda0));
  const hourAngle = normalizeDegrees(ramc - ra0 * (180 / Math.PI));
  const isDescendant = hourAngle < 180; // 0-180 => still-positive H => descendant

  const ascRad = isDescendant ? lambda0 + Math.PI : lambda0;
  return normalizeDegrees(ascRad * (180 / Math.PI));
}

function isRetrograde(planet, date) {
  if (planet === 'Rahu' || planet === 'Ketu') return true;
  if (planet === 'Sun' || planet === 'Moon') return false;
  const stepMs = 60 * 60 * 1000;
  const before = tropicalLongitude(planet, new Date(date.getTime() - stepMs));
  const after = tropicalLongitude(planet, new Date(date.getTime() + stepMs));
  let delta = after - before;
  if (delta > 180) delta -= 360;
  if (delta < -180) delta += 360;
  return delta < 0;
}

export function rashiOf(siderealLongitude) {
  return Math.floor(normalizeDegrees(siderealLongitude) / 30) % 12;
}

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi',
  'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi',
  'Trayodashi', 'Chaturdashi',
];

/**
 * Tithi (lunar day), from the Moon-Sun sidereal angular separation - each
 * of the 30 tithis spans 12 degrees of that separation, split evenly across
 * the waxing (Shukla) and waning (Krishna) paksha.
 */
export function tithiOf(moonSidereal, sunSidereal) {
  const separation = normalizeDegrees(moonSidereal - sunSidereal);
  const tithiNumber = Math.floor(separation / 12) + 1; // 1-30
  const paksha = tithiNumber <= 15 ? 'Shukla' : 'Krishna';
  const inPaksha = tithiNumber <= 15 ? tithiNumber : tithiNumber - 15;
  let name;
  if (inPaksha === 15) name = paksha === 'Shukla' ? 'Pournami' : 'Amavasya';
  else name = TITHI_NAMES[inPaksha - 1];
  return { index: tithiNumber, paksha, name };
}

export function nakshatraOf(siderealLongitude) {
  const span = 360 / 27;
  const lon = normalizeDegrees(siderealLongitude);
  const index = Math.floor(lon / span) % 27;
  const pada = Math.floor((lon % span) / (span / 4)) + 1;
  return { index, pada };
}

/**
 * Compute a full Vedic (sidereal, whole-sign) birth chart.
 * @param {Date} utcDate - birth moment as a UTC JS Date
 * @param {number} latitude - degrees, north positive
 * @param {number} longitude - degrees, east positive
 */
export function computeBirthChart(utcDate, latitude, longitude) {
  const jd = toJulianDay(utcDate);
  const ayanamsa = lahiriAyanamsa(jd);

  const ascendantTropical = tropicalAscendant(utcDate, latitude, longitude);
  const ascendantSidereal = normalizeDegrees(ascendantTropical - ayanamsa);
  const ascendantRashi = rashiOf(ascendantSidereal);

  const sunSidereal = normalizeDegrees(tropicalLongitude('Sun', utcDate) - ayanamsa);

  const planets = PLANETS.map((planet) => {
    let tropical;
    if (planet === 'Rahu') {
      tropical = meanLunarNodeLongitude(jd);
    } else if (planet === 'Ketu') {
      tropical = normalizeDegrees(meanLunarNodeLongitude(jd) + 180);
    } else {
      tropical = tropicalLongitude(planet, utcDate);
    }
    const sidereal = normalizeDegrees(tropical - ayanamsa);
    const rashi = rashiOf(sidereal);
    const house = ((rashi - ascendantRashi + 12) % 12) + 1;
    const { index: nakshatraIndex, pada } = nakshatraOf(sidereal);
    // Rahu/Ketu are conventionally always retrograde in Vedic astrology, so
    // that state is never called out with "(R)" the way it is for other
    // planets.
    const retrograde = planet === 'Rahu' || planet === 'Ketu' ? false : isRetrograde(planet, utcDate);

    return {
      planet,
      longitude: sidereal,
      degreeInRashi: sidereal % 30,
      rashi,
      rashiName: RASHIS[rashi],
      house,
      nakshatra: NAKSHATRAS[nakshatraIndex],
      pada,
      retrograde,
      exalted: rashi === EXALTATION_RASHI[planet],
      debilitated: rashi === DEBILITATION_RASHI[planet],
      combust: planet === 'Sun' ? false : isCombust(planet, sidereal, sunSidereal, retrograde),
    };
  });

  const houses = Array.from({ length: 12 }, (_, i) => {
    const rashi = (ascendantRashi + i) % 12;
    return { house: i + 1, rashi, rashiName: RASHIS[rashi] };
  });

  const moonSidereal = planets.find((p) => p.planet === 'Moon').longitude;
  const tithi = tithiOf(moonSidereal, sunSidereal);

  return {
    ayanamsa,
    tithi,
    ascendant: {
      longitude: ascendantSidereal,
      degreeInRashi: ascendantSidereal % 30,
      rashi: ascendantRashi,
      rashiName: RASHIS[ascendantRashi],
      nakshatra: NAKSHATRAS[nakshatraOf(ascendantSidereal).index],
      pada: nakshatraOf(ascendantSidereal).pada,
    },
    planets,
    houses,
  };
}

/**
 * Divisional (varga) rashi for a given D1 rashi + degree-in-rashi, per the
 * classical Parashari division rules.
 * - D2 (Hora): each sign's first/second half go to Cancer or Leo, which
 *   half maps to which alternates between odd and even signs.
 * - D3 (Drekkana): each 10° third of a sign maps to itself, +4 signs, or
 *   +8 signs.
 * - D9 (Navamsa): each sign's nine 3°20' parts map onto a run of 9 signs
 *   starting at the sign itself (movable), its 9th (fixed), or its 5th
 *   (dual) - equivalent to the closed-form (rashi*9 + part) % 12 used here.
 */
function vargaRashi(rashi, degreeInRashi, varga) {
  if (varga === 2) {
    const isOddSign = rashi % 2 === 0;
    const firstHalf = degreeInRashi < 15;
    if (isOddSign) return firstHalf ? 4 : 3; // Leo, Cancer
    return firstHalf ? 3 : 4; // Cancer, Leo
  }
  if (varga === 3) {
    const part = Math.floor(degreeInRashi / 10);
    return (rashi + part * 4) % 12;
  }
  if (varga === 9) {
    const part = Math.floor(degreeInRashi / (10 / 3));
    return (rashi * 9 + part) % 12;
  }
  throw new Error(`Unsupported varga: D${varga}`);
}

/**
 * Derive a divisional (varga) chart from an already-computed D1 chart.
 * Divisional charts are sign-based (no independent degree/nakshatra of
 * their own), so only rashi/house are meaningful; retrograde/combust state
 * is carried over from D1 since those describe the planet's motion, not
 * its sign placement.
 * @param {ReturnType<typeof computeBirthChart>} chart - a D1 chart
 * @param {2|3|9} varga - which divisional chart to derive
 */
export function computeDivisionalChart(chart, varga) {
  const ascendantRashi = vargaRashi(chart.ascendant.rashi, chart.ascendant.degreeInRashi, varga);

  const planets = chart.planets.map((p) => {
    const rashi = vargaRashi(p.rashi, p.degreeInRashi, varga);
    const house = ((rashi - ascendantRashi + 12) % 12) + 1;
    return {
      planet: p.planet,
      rashi,
      rashiName: RASHIS[rashi],
      house,
      retrograde: p.retrograde,
      exalted: rashi === EXALTATION_RASHI[p.planet],
      debilitated: rashi === DEBILITATION_RASHI[p.planet],
      // Combustion is a D1-only concept (angular closeness to the Sun's own
      // D1 position); a planet's varga placement is isolated from that, so
      // carrying the D1 combust flag into a divisional chart would be
      // showing a relationship the varga sign doesn't actually reflect.
      combust: false,
    };
  });

  return {
    varga,
    ascendant: { rashi: ascendantRashi, rashiName: RASHIS[ascendantRashi] },
    planets,
  };
}
