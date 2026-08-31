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

/**
 * Parashari graha drishti (aspect): every planet fully aspects the house
 * 7 signs from its own; Mars, Jupiter and Saturn additionally cast special
 * aspects (Mars: 4th/8th, Jupiter: 5th/9th, Saturn: 3rd/10th from itself).
 */
const SPECIAL_ASPECT_OFFSETS = { Mars: [3, 7], Jupiter: [4, 8], Saturn: [2, 9] };

function aspectedHouses(house, planet) {
  const offsets = new Set([6, ...(SPECIAL_ASPECT_OFFSETS[planet] ?? [])]);
  return [...offsets].map((offset) => ((house - 1 + offset) % 12) + 1).sort((a, b) => a - b);
}

/**
 * Dig Bala (directional strength): each graha is strongest in one
 * "home" house and weakest in the opposite one, tapering linearly
 * between them. Rahu/Ketu classically have no Dig Bala.
 */
const DIG_BALA_HOUSE = { Jupiter: 1, Mercury: 1, Sun: 10, Mars: 10, Saturn: 7, Moon: 4, Venus: 4 };

function digBalaScore(planet, house) {
  const home = DIG_BALA_HOUSE[planet];
  if (!home) return 0;
  const diff = Math.abs(house - home);
  const houseDistance = Math.min(diff, 12 - diff); // 0 (home) .. 6 (opposite)
  return 2 * (1 - houseDistance / 6);
}

/**
 * A simplified strength score for ranking the "strongest" planet in a
 * chart, combining three classical factors: Vargottama (+2), positive
 * Sthana Bala/positional strength - exalted (+3) or in its own sign
 * (+2) - and Dig Bala (0-2, see above). This is a teaching-oriented
 * approximation, not a full Shadbala calculation.
 */
function planetStrength(p) {
  const positional = p.rashi === EXALTATION_RASHI[p.planet] ? 3 : RASHI_LORDS[p.rashi] === p.planet ? 2 : 0;
  const digBala = digBalaScore(p.planet, p.house);
  const vargottama = p.vargottama ? 2 : 0;
  return { positional, digBala, vargottama, total: positional + digBala + vargottama };
}

/** Attach a `strength` breakdown to each planet and report the strongest. */
function withStrength(planets) {
  const scored = planets.map((p) => ({ ...p, strength: planetStrength(p) }));
  const strongestPlanet = scored.reduce((best, p) => (p.strength.total > best.strength.total ? p : best)).planet;
  return { planets: scored, strongestPlanet };
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
    const degreeInRashi = sidereal % 30;
    const house = ((rashi - ascendantRashi + 12) % 12) + 1;
    const { index: nakshatraIndex, pada } = nakshatraOf(sidereal);
    // Rahu/Ketu are conventionally always retrograde in Vedic astrology, so
    // that state is never called out with "(R)" the way it is for other
    // planets.
    const retrograde = planet === 'Rahu' || planet === 'Ketu' ? false : isRetrograde(planet, utcDate);

    return {
      planet,
      longitude: sidereal,
      degreeInRashi,
      rashi,
      rashiName: RASHIS[rashi],
      house,
      nakshatra: NAKSHATRAS[nakshatraIndex],
      pada,
      retrograde,
      exalted: rashi === EXALTATION_RASHI[planet],
      debilitated: rashi === DEBILITATION_RASHI[planet],
      combust: planet === 'Sun' ? false : isCombust(planet, sidereal, sunSidereal, retrograde),
      // Vargottama: the planet occupies the same rashi in D1 and D9, a
      // classical marker of strengthened placement.
      vargottama: rashi === vargaRashi(rashi, degreeInRashi, 9),
      aspects: aspectedHouses(house, planet),
    };
  });

  const houses = Array.from({ length: 12 }, (_, i) => {
    const rashi = (ascendantRashi + i) % 12;
    return { house: i + 1, rashi, rashiName: RASHIS[rashi] };
  });

  const moonSidereal = planets.find((p) => p.planet === 'Moon').longitude;
  const tithi = tithiOf(moonSidereal, sunSidereal);
  const { planets: planetsWithStrength, strongestPlanet } = withStrength(planets);

  return {
    ayanamsa,
    tithi,
    strongestPlanet,
    ascendant: {
      longitude: ascendantSidereal,
      degreeInRashi: ascendantSidereal % 30,
      rashi: ascendantRashi,
      rashiName: RASHIS[ascendantRashi],
      nakshatra: NAKSHATRAS[nakshatraOf(ascendantSidereal).index],
      pada: nakshatraOf(ascendantSidereal).pada,
    },
    planets: planetsWithStrength,
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
 * Gochara (transit) favorable houses, counted from the Moon (Chandra
 * Rashi), per the classical Vedic transit rules. A transiting planet
 * sitting in one of its listed houses-from-Moon is read as broadly
 * favorable; any other house is read as challenging. This is the standard
 * teaching-level table (not the full Vedha/Ashtakavarga system).
 */
export const GOCHARA_FAVORABLE_HOUSES = {
  Sun: [3, 6, 10, 11],
  Moon: [1, 3, 6, 7, 10, 11],
  Mars: [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn: [3, 6, 11],
  Rahu: [3, 6, 11],
  Ketu: [3, 6, 11],
};

function gocharaEffect(planet, houseFromMoon) {
  return GOCHARA_FAVORABLE_HOUSES[planet].includes(houseFromMoon) ? 'favorable' : 'challenging';
}

/**
 * Tara Bala: the 9-fold nakshatra cycle counted from the birth (Janma)
 * nakshatra to a given nakshatra, cycling every 9 nakshatras (3x through
 * the 27). Odd-numbered groups (1,3,5,7) are classically inauspicious.
 */
const TARA_NAMES = [
  'Janma', 'Sampat', 'Vipat', 'Kshema', 'Pratyak', 'Sadhaka', 'Vadha', 'Mitra', 'Parama Mitra',
];
const TARA_NATURE = [
  'neutral', 'good', 'bad', 'good', 'bad', 'good', 'bad', 'good', 'good',
];

function taraBala(birthNakshatraIndex, currentNakshatraIndex) {
  const diff = (currentNakshatraIndex - birthNakshatraIndex + 27) % 27;
  const taraIndex = diff % 9;
  return { name: TARA_NAMES[taraIndex], nature: TARA_NATURE[taraIndex] };
}

/**
 * Gochara Effect (house-from-Moon) and Tara Bala (nakshatra-cycle) are two
 * independent classical readings of the same transit, and can disagree -
 * e.g. a planet can sit in a "favorable" house while its nakshatra falls
 * in a "bad" Tara. Rather than let a reader wonder why the two columns
 * contradict each other, this collapses them into one plain verdict:
 * they only read as clearly favorable/unfavorable when both systems
 * agree, otherwise it's called out as mixed.
 */
function overallReading(effect, taraNature) {
  const taraGood = taraNature === 'good' || taraNature === 'neutral';
  if (effect === 'favorable' && taraGood) return 'favorable';
  if (effect === 'challenging' && !taraGood) return 'use caution';
  return 'mixed signals';
}

/**
 * Latta ("kick") dosha: a commonly-taught rule (Tamil/Kannada panchangam
 * tradition) marking specific nakshatra distances - counted 1-27 from the
 * natal Moon's (Janma) nakshatra - at which the three "cruel" grahas are
 * said to afflict rather than merely transit. Sources vary on the exact
 * counts; this is the version most often cited, kept as a simplified,
 * teaching-level flag rather than a canonical calculation.
 */
const LATTA_NAKSHATRA_COUNTS = {
  Sun: [6, 8, 12],
  Mars: [4, 8],
  Saturn: [3, 5, 7],
};

/**
 * Named malefic Gochara doshas, checked by house-from-Moon. Only the
 * well-established, widely-named ones are flagged - Saturn's Sade Sati /
 * Ashtama Shani / Kantaka Shani, and Mars's 4-8-12 transit rule - rather
 * than every possible weak placement, to keep this to doshas a reader
 * would recognize by name.
 */
function specificMaleficTransit(planet, houseFromMoon) {
  if (planet === 'Saturn') {
    if (houseFromMoon === 8) return 'Ashtama Shani';
    if ([12, 1, 2].includes(houseFromMoon)) return 'Sade Sati';
    if ([4, 7, 10].includes(houseFromMoon)) return 'Kantaka Shani';
  }
  if (planet === 'Mars' && [4, 8, 12].includes(houseFromMoon)) {
    return 'Kuja Gochara Dosha';
  }
  return null;
}

/**
 * Plain-language, one-line explanations for the named transits/Latta -
 * what the classical term means and what it practically suggests being
 * careful about, for a reader with no prior astrology vocabulary.
 */
export const MALEFIC_TRANSIT_EXPLANATIONS = {
  'Sade Sati':
    "Saturn's long transit through the signs around your Moon. A stretch of extra responsibility and " +
    'slow, grinding change - not misfortune by itself, but a good time to be disciplined, patient, and ' +
    'careful with health and finances rather than starting big new ventures.',
  'Ashtama Shani':
    'Saturn transiting the 8th house from your Moon, classically the most disruptive of its transits. ' +
    'Watch for sudden setbacks, health scares, or upheaval in routines - avoid risk-taking and lean on ' +
    'caution until it passes.',
  'Kantaka Shani':
    "Saturn in one of the 'thorn' houses from your Moon - a milder, background-level stress on daily " +
    'routines, health, or relationships. Worth noting, not worth worrying over.',
  'Kuja Gochara Dosha':
    'Mars transiting a house from your Moon classically linked to accidents, conflict, or impulsive ' +
    'decisions. Drive carefully, watch your temper, and avoid rushed financial calls this week.',
  Latta:
    "A classical 'kick' transit - a short, sharp burst of friction or minor obstacles rather than a " +
    'sustained affliction. Usually passes within days; nothing to plan around, just be a little more careful.',
};

/**
 * Broad classical significations (karakatva) of each house-from-Moon, used
 * to describe which area of life a transiting graha's current placement
 * is read as touching.
 */
const HOUSE_AREA_OF_INFLUENCE = {
  1: 'Self, health, physical vitality',
  2: 'Wealth, family, speech',
  3: 'Courage, effort, siblings',
  4: 'Home, mother, emotional comfort',
  5: 'Children, intellect, creativity',
  6: 'Health challenges, debts, rivals',
  7: 'Partnerships, marriage',
  8: 'Transformation, obstacles, longevity',
  9: 'Fortune, dharma, father',
  10: 'Career, status, public life',
  11: 'Gains, income, aspirations',
  12: 'Losses, expenses, spirituality',
};

/**
 * A single, everyday life-category label for each house-from-Moon - the
 * same significations as HOUSE_AREA_OF_INFLUENCE, but compressed to one
 * short tag so a weekly outlook can name 2-3 concrete things to focus on
 * instead of a long list of classical nouns.
 */
const HOUSE_CATEGORY = {
  1: 'Health',
  2: 'Savings',
  3: 'Effort & Communication',
  4: 'Happiness',
  5: 'Education & Speculation',
  6: 'Health & Debts',
  7: 'Marriage',
  8: 'Sudden Setbacks & Health Scares',
  9: 'Fortune & Growth',
  10: 'Career',
  11: 'Investment',
  12: 'Expenditure',
};

/** Geocentric apparent sidereal (Lahiri) longitude of a transiting graha at a given moment. */
function transitingSiderealLongitude(planet, date) {
  const jd = toJulianDay(date);
  const ayanamsa = lahiriAyanamsa(jd);
  let tropical;
  if (planet === 'Rahu') {
    tropical = meanLunarNodeLongitude(jd);
  } else if (planet === 'Ketu') {
    tropical = normalizeDegrees(meanLunarNodeLongitude(jd) + 180);
  } else {
    tropical = tropicalLongitude(planet, date);
  }
  return normalizeDegrees(tropical - ayanamsa);
}

/**
 * Compute the current (Gochara) transit positions of every graha against
 * an already-computed natal (D1) chart. Transit houses are counted two
 * ways, both standard in practice: from the natal Moon sign (the primary
 * Gochara reference) and from the natal Lagna. No new geolocation is
 * needed - transit house placement is read against the birth chart's
 * fixed houses, not a "chart cast for right now".
 * @param {ReturnType<typeof computeBirthChart>} natalChart
 * @param {Date} transitUtcDate - the moment to compute transits for
 */
export function computeTransitChart(natalChart, transitUtcDate) {
  const ayanamsa = lahiriAyanamsa(toJulianDay(transitUtcDate));
  const natalMoon = natalChart.planets.find((p) => p.planet === 'Moon');
  const natalMoonRashi = natalMoon.rashi;
  const natalMoonNakshatraIndex = NAKSHATRAS.indexOf(natalMoon.nakshatra);
  const natalAscRashi = natalChart.ascendant.rashi;

  const planets = PLANETS.map((planet) => {
    const sidereal = transitingSiderealLongitude(planet, transitUtcDate);
    const rashi = rashiOf(sidereal);
    const degreeInRashi = sidereal % 30;
    const houseFromMoon = ((rashi - natalMoonRashi + 12) % 12) + 1;
    const houseFromLagna = ((rashi - natalAscRashi + 12) % 12) + 1;
    const { index: nakshatraIndex, pada } = nakshatraOf(sidereal);
    const retrograde = planet === 'Rahu' || planet === 'Ketu' ? false : isRetrograde(planet, transitUtcDate);
    const nakshatraFromMoon = ((nakshatraIndex - natalMoonNakshatraIndex + 27) % 27) + 1;
    const effect = gocharaEffect(planet, houseFromMoon);
    const tara = taraBala(natalMoonNakshatraIndex, nakshatraIndex);

    return {
      planet,
      longitude: sidereal,
      degreeInRashi,
      rashi,
      rashiName: RASHIS[rashi],
      houseFromMoon,
      houseFromLagna,
      nakshatra: NAKSHATRAS[nakshatraIndex],
      nakshatraFromMoon,
      pada,
      retrograde,
      effect,
      tara,
      overall: overallReading(effect, tara.nature),
      latta: LATTA_NAKSHATRA_COUNTS[planet]?.includes(nakshatraFromMoon) ?? false,
      maleficTransit: specificMaleficTransit(planet, houseFromMoon),
      areaOfInfluence: HOUSE_AREA_OF_INFLUENCE[houseFromMoon],
      category: HOUSE_CATEGORY[houseFromMoon],
    };
  });

  const transitMoon = planets.find((p) => p.planet === 'Moon');
  const tara = transitMoon.tara;
  const favorableCount = planets.filter((p) => p.effect === 'favorable').length;

  return {
    ayanamsa,
    generatedAt: transitUtcDate,
    natalMoonRashiName: RASHIS[natalMoonRashi],
    natalMoonNakshatra: natalMoon.nakshatra,
    planets,
    tara,
    favorableCount,
    totalCount: planets.length,
  };
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CATEGORIES_SHOWN = 2;

const listFormatter =
  typeof Intl !== 'undefined' && Intl.ListFormat ? new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }) : null;

function joinFriendly(words) {
  if (words.length === 0) return '';
  return listFormatter ? listFormatter.format(words) : words.join(', ');
}

/**
 * Natural-language, category-specific advice, phrased for what that area
 * of life actually means to act on - rather than a generic "make progress
 * on X" template stapled onto every category (which reads oddly for
 * something like Marriage). `planets` names which grahas are driving the
 * read, so two windows pointing at the same category still read as
 * distinct if a different graha is behind it.
 */
const CATEGORY_ADVICE = {
  Health: {
    lean: (planets) => `Energy favors health and fitness routines, with ${planets} in support`,
    care: (planets) => `Go easy on your body - with ${planets} in play, don't overdo it physically`,
  },
  Savings: {
    lean: (planets) => `A good stretch to build up savings, helped along by ${planets}`,
    care: (planets) => `With ${planets} in play, avoid impulsive spending that eats into savings`,
  },
  'Effort & Communication': {
    lean: (planets) => `Effort and clear communication pay off, with ${planets} in your corner`,
    care: (planets) => `Conversations may take extra effort under ${planets} - choose words carefully`,
  },
  Happiness: {
    lean: (planets) => `Home life and personal happiness get a lift from ${planets}`,
    care: (planets) => `Domestic harmony needs a little extra patience while ${planets} is in the mix`,
  },
  'Education & Speculation': {
    lean: (planets) => `A good window for learning or a calculated bet, backed by ${planets}`,
    care: (planets) => `With ${planets} in play, steer clear of big speculative risks or hasty exam/study calls`,
  },
  'Health & Debts': {
    lean: (planets) => `Good time to tackle health routines or chip away at debts, with ${planets} helping`,
    care: (planets) => `Watch for health dips or financial obligations creeping up under ${planets}`,
  },
  Marriage: {
    lean: (planets) => `A warm stretch for your marriage or closest relationship - make time for it while ${planets} supports it`,
    care: (planets) => `Be patient with your spouse or partner - with ${planets} in play, it's not the moment to force a hard conversation`,
  },
  'Sudden Setbacks & Health Scares': {
    lean: (planets) => `Even sudden turns tend to work in your favor now, with ${planets} softening the edges`,
    care: (planets) => `Stay alert to sudden setbacks or health scares - with ${planets} in play, avoid unnecessary risks`,
  },
  'Fortune & Growth': {
    lean: (planets) => `Fortune leans your way for bigger-picture plans, with ${planets} behind it`,
    care: (planets) => `Bigger plans may hit friction under ${planets} - keep ambitions modest for now`,
  },
  Career: {
    lean: (planets) => `Career visibility and progress are supported by ${planets}`,
    care: (planets) => `Go easy at work - with ${planets} in play, sidestep office politics or big asks`,
  },
  Investment: {
    lean: (planets) => `A good window to make investment or income moves, with ${planets} on your side`,
    care: (planets) => `With ${planets} in play, hold off on big investment decisions for now`,
  },
  Expenditure: {
    lean: (planets) => `A fine time to spend on things that matter to you, eased by ${planets}`,
    care: (planets) => `Keep an eye on expenditure - ${planets} in play means it's easy to overspend`,
  },
};

/**
 * Net the favorable and challenging planet lists down to their top few
 * life categories, one bucket per direction. A category with planets on
 * both sides (e.g. the Moon favoring Marriage while the Sun sits
 * unfavorably in the same house) is resolved by majority rather than
 * printed as both "lean into" and "take care with" - which read as
 * self-contradictory - and dropped entirely on an exact tie.
 */
function netCategoryAdvice(favorablePlanets, challengingPlanets, limit = MAX_CATEGORIES_SHOWN) {
  const byCategory = (planets) => {
    const map = new Map();
    for (const p of planets) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category).push(p.planet);
    }
    return map;
  };
  const favMap = byCategory(favorablePlanets);
  const careMap = byCategory(challengingPlanets);

  const lean = [];
  const care = [];
  for (const category of new Set([...favMap.keys(), ...careMap.keys()])) {
    const favList = favMap.get(category) ?? [];
    const careList = careMap.get(category) ?? [];
    if (favList.length > careList.length) lean.push({ category, planets: favList });
    else if (careList.length > favList.length) care.push({ category, planets: careList });
  }

  const topN = (entries) =>
    entries.sort((a, b) => b.planets.length - a.planets.length).slice(0, limit);

  return { leanEntries: topN(lean), careEntries: topN(care) };
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const TIER_HEADLINES = {
  favorable: [
    'Conditions stay broadly favorable and steady.',
    'A comfortable stretch overall - momentum stays on your side.',
    'Skies stay mostly clear around this time.',
  ],
  mixed: [
    'A mixed stretch - some support, some friction.',
    'A balancing act around this time - progress needs a bit more effort.',
    'Give and take here; be selective about where you push.',
  ],
  demanding: [
    'A demanding stretch - move carefully and avoid big new commitments.',
    'A patch that asks for patience - keep plans flexible.',
    "Proceed cautiously here - it's not the time to force things.",
  ],
};

/**
 * Render one direction's (lean-into or take-care) category entries into
 * sentences, collapsing an entry into a short "still true" note instead of
 * repeating its full sentence when the exact same category + graha
 * combination already appeared in the previous period - the situation
 * that produced two panels reading almost word-for-word the same.
 */
function renderCategoryEntries(entries, direction, previousState) {
  return entries.map(({ category, planets }) => {
    const planetsList = joinFriendly(planets);
    const key = `${direction}:${category}`;
    const continuing = previousState.get(key) === planetsList;
    previousState.set(key, planetsList);
    if (continuing) {
      return direction === 'lean'
        ? `${category} continues to work in your favor (still ${planetsList})`
        : `${category} still needs the same care as before (${planetsList})`;
    }
    return CATEGORY_ADVICE[category]?.[direction](planetsList) ?? category;
  });
}

/**
 * Build a plain-language advice narrative for one checkpoint's transit
 * snapshot: an overall headline based on the favorable/challenging
 * balance, what to lean into, what to be careful with, and one explained
 * sentence per named dosha/Latta in play - written for a reader with no
 * prior astrology vocabulary. `variantIndex`, `previousWatchLabels`, and
 * `previousCategoryState` let the same underlying situation (which often
 * repeats from one period to the next, since most grahas don't change
 * houses within a couple of weeks) get worded differently, or collapsed
 * to a short "still true" note, instead of printing an identical
 * paragraph over and over.
 */
function buildPeriodNarrative(
  transit,
  favorablePlanets,
  challengingPlanets,
  specialWatch,
  variantIndex,
  previousWatchLabels,
  previousCategoryState,
) {
  const ratio = favorablePlanets.length / transit.totalCount;
  const tier = ratio >= 0.6 ? 'favorable' : ratio >= 0.4 ? 'mixed' : 'demanding';
  const headline = TIER_HEADLINES[tier][variantIndex % TIER_HEADLINES[tier].length];

  const { leanEntries, careEntries } = netCategoryAdvice(favorablePlanets, challengingPlanets);
  const leanInto = renderCategoryEntries(leanEntries, 'lean', previousCategoryState).map((s) => `${capitalize(s)}.`);
  const takeCare = renderCategoryEntries(careEntries, 'care', previousCategoryState).map((s) => `${capitalize(s)}.`);

  const watchouts = specialWatch.map((p) => {
    const label = p.maleficTransit ?? 'Latta';
    const continuing = previousWatchLabels.get(p.planet) === label;
    return {
      planet: p.planet,
      label,
      advice: continuing
        ? `Still active from the earlier checkpoint above - see there for what ${label} means and why it matters.`
        : MALEFIC_TRANSIT_EXPLANATIONS[label],
    };
  });

  return { headline, leanInto, takeCare, watchouts };
}

const OUTLOOK_WINDOW_DAYS = 10;
const OUTLOOK_WINDOW_COUNT = 2;

/**
 * Short-term Gochara outlook: a couple of computeTransitChart() snapshots,
 * one per 10-day window (today through +9 days, then +10 through +19),
 * each taken at the window's start. A multi-week outlook mostly repeats
 * itself - the slow grahas don't move houses in that span - so keeping
 * the window short (10 days) means the Moon, which changes sign and
 * nakshatra every day or two, has actually moved by the time the second
 * window is read, giving each panel a genuinely different picture rather
 * than a reworded copy of the first.
 * @param {ReturnType<typeof computeBirthChart>} natalChart
 * @param {Date} startDate - "today", the first window's start
 * @param {number} [windowCount] - how many 10-day windows to produce
 */
export function computeTransitOutlook(natalChart, startDate, windowCount = OUTLOOK_WINDOW_COUNT) {
  const previousWatchLabels = new Map();
  const previousCategoryState = new Map();
  return Array.from({ length: windowCount }, (_, i) => {
    const windowStart = new Date(startDate.getTime() + i * OUTLOOK_WINDOW_DAYS * DAY_MS);
    const windowEnd = new Date(windowStart.getTime() + OUTLOOK_WINDOW_DAYS * DAY_MS - 1);
    const transit = computeTransitChart(natalChart, windowStart);
    const favorablePlanets = transit.planets.filter((p) => p.effect === 'favorable');
    const challengingPlanets = transit.planets.filter((p) => p.effect === 'challenging');
    const specialWatch = transit.planets.filter((p) => p.maleficTransit || p.latta);
    const narrative = buildPeriodNarrative(
      transit,
      favorablePlanets,
      challengingPlanets,
      specialWatch,
      i,
      previousWatchLabels,
      previousCategoryState,
    );

    previousWatchLabels.clear();
    for (const p of specialWatch) previousWatchLabels.set(p.planet, p.maleficTransit ?? 'Latta');

    return {
      windowIndex: i,
      startDate: windowStart,
      endDate: windowEnd,
      transit,
      favorablePlanets,
      challengingPlanets,
      specialWatch,
      narrative,
    };
  });
}

/**
 * Exact-degree conjunctions and aspects (graha yuti/drishti) between
 * transiting grahas and natal planets/Ascendant - a sharper, degree-based
 * companion to the whole-sign Gochara reading above. A transiting planet
 * "aspects" a point ASPECT_ANGLE_STEPS*30 degrees ahead of its own exact
 * longitude (0deg = conjunction, 180deg = every planet's universal 7th
 * aspect, plus Mars/Jupiter/Saturn's classical special aspects); this
 * checks how close that aspected degree currently sits to each natal
 * point, in the same "degree-for-degree" style used by most sidereal
 * software for calling an aspect "exact" rather than just same-house.
 */
export const ASPECT_ORB_DEG = 6;
const ASPECT_TREND_SAMPLE_DAYS = 2;
const ASPECT_MIN_DAILY_RATE = 0.02; // deg/day; below this, treat the pairing as effectively stationary

function ordinal(n) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
}

function aspectLabel(offsetDeg) {
  if (offsetDeg === 0) return 'Conjunction';
  if (offsetDeg === 180) return 'Opposition (7th aspect)';
  return `${ordinal(offsetDeg / 30 + 1)} aspect`;
}

function aspectOffsetsFor(planet) {
  return [0, 180, ...(SPECIAL_ASPECT_OFFSETS[planet] ?? []).map((o) => o * 30)];
}

/** The natal chart's fixed points (every graha plus the Ascendant) that a transit can aspect. */
function natalAspectPoints(natalChart) {
  return [
    ...natalChart.planets.map((p) => ({ name: p.planet, longitude: p.longitude })),
    { name: 'Ascendant', longitude: natalChart.ascendant.longitude },
  ];
}

/** Each graha's classical domain, in a few plain words - the building blocks for a combination's "what to watch for". */
const PLANET_THEME = {
  Sun: 'identity, authority, and father',
  Moon: 'mind, emotions, and mother',
  Mars: 'drive, courage, and conflict',
  Mercury: 'communication, intellect, and commerce',
  Jupiter: 'wisdom, growth, and fortune',
  Venus: 'relationships, pleasure, and finances',
  Saturn: 'discipline, limitation, and long-term structure',
  Rahu: 'ambition, obsession, and the unconventional',
  Ketu: 'detachment, release, and the unseen',
  Ascendant: 'your sense of self and physical body',
  'Lunar Nodes (Rahu/Ketu)': 'your karmic axis - ambition and obsession paired with detachment and release',
};

const BENEFICS = new Set(['Moon', 'Mercury', 'Jupiter', 'Venus']);

/**
 * A few alternate phrasings per combination "nature", so two different
 * transiting-to-natal pairings that happen to land in the same nature
 * bucket (there are only three buckets) don't read as the exact same
 * sentence with the theme words swapped. Picked deterministically per
 * pairing (not randomly) so the same row reads the same way every time
 * it's recomputed.
 */
const NATURE_PHRASES = {
  supportive: [
    'generally supportive - good timing for growth and forward movement here',
    "a favorable combination - things tend to flow with less resistance than usual here",
  ],
  mixed: [
    'a mixed combination - real opportunity paired with real friction, so expect both an opening and a cost',
    "a two-sided combination - progress is possible, but rarely without a trade-off attached",
  ],
  intense: [
    'an intense combination - pressure, restriction, or abrupt change are more likely, so move carefully',
    'a demanding combination - this area gets tested rather than eased, so patience matters more than speed',
  ],
};

function stringHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * A plain-language "what to watch for" sentence for a transiting-to-natal
 * pairing: names both grahas' classical domains, then characterizes the
 * combination's general nature (benefic-benefic, mixed, or malefic-
 * malefic) - the same shape as a manual reading ("Jupiter conjoining Ketu
 * brings a mix of detachment and unexpected material shifts..."), built
 * from a formula rather than hand-written per pairing since there are too
 * many transiting-planet x natal-point combinations to author individually.
 */
function aspectMeaning(transitingPlanet, natalPointName) {
  const transitingTheme = PLANET_THEME[transitingPlanet];
  const natalTheme = PLANET_THEME[natalPointName];
  const transitingIsBenefic = BENEFICS.has(transitingPlanet);
  const natalIsBenefic = natalPointName === 'Ascendant' || BENEFICS.has(natalPointName);

  const natureKey = transitingIsBenefic && natalIsBenefic ? 'supportive' : transitingIsBenefic !== natalIsBenefic ? 'mixed' : 'intense';
  const phrases = NATURE_PHRASES[natureKey];
  const nature = phrases[stringHash(`${transitingPlanet}:${natalPointName}`) % phrases.length];

  return `Blends ${transitingTheme} with ${natalTheme} - ${nature}.`;
}

/**
 * Rahu and Ketu sit exactly 180deg apart by construction, so a transiting
 * planet's conjunction with natal Ketu is mathematically the same sky
 * event as its opposition to natal Rahu (identical orb, always) - not two
 * separate things worth two rows. Collapse any such pair into one entry
 * naming both nodes, keeping the Conjunction-labeled framing when there's
 * a choice since it reads more naturally than "opposition to the other node".
 */
function mergeNodalDuplicates(results) {
  const isNode = (name) => name === 'Rahu' || name === 'Ketu';
  const merged = [];
  const consumed = new Set();

  for (let i = 0; i < results.length; i++) {
    if (consumed.has(i) || !isNode(results[i].natalPoint)) {
      if (!consumed.has(i)) merged.push(results[i]);
      continue;
    }
    const partnerIndex = results.findIndex(
      (r, j) =>
        j !== i &&
        !consumed.has(j) &&
        r.planet === results[i].planet &&
        isNode(r.natalPoint) &&
        r.natalPoint !== results[i].natalPoint &&
        Math.abs(r.orbDeg - results[i].orbDeg) < 0.01,
    );
    if (partnerIndex === -1) {
      merged.push(results[i]);
      consumed.add(i);
      continue;
    }
    const primary = results[i].label === 'Conjunction' ? results[i] : results[partnerIndex];
    merged.push({ ...primary, natalPoint: 'Lunar Nodes (Rahu/Ketu)' });
    consumed.add(i);
    consumed.add(partnerIndex);
  }

  return merged;
}

/** A one-line, plain-language read on where a pairing sits in its cycle. */
function aspectTimingLabel(orbDeg, applying, stationary, exactDate) {
  if (stationary) return "Nearly stationary right now - too slow-moving to say when it's exact";
  if (applying && exactDate) {
    return `Tightening toward exact around ${exactDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
  }
  if (applying) return 'Tightening toward exact';
  return orbDeg < 1 ? 'At its closest point now, about to separate' : 'Already past its closest point, separating';
}

/**
 * How far ahead an applying pairing's projected exact date is allowed to
 * be before it's left out - matches the 2x10-day span the Overview tab's
 * outlook covers, so this tab stays scoped to "the same near-term window"
 * rather than surfacing conjunctions that won't perfect for months.
 */
const ASPECT_HORIZON_DAYS = OUTLOOK_WINDOW_DAYS * OUTLOOK_WINDOW_COUNT;

/**
 * Find every transiting-graha-to-natal-point pairing currently within
 * ASPECT_ORB_DEG of exact, alongside whether it's applying (tightening) or
 * separating, and - for applying pairs with a measurable rate - roughly
 * when it goes exact. Slow, near-stationary pairings (a planet near a
 * station) are flagged rather than given a speculative date. Applying
 * pairings projected to go exact beyond ASPECT_HORIZON_DAYS are left out,
 * so this stays scoped to the same near-term window as the Overview tab's
 * outlook rather than surfacing things that won't perfect for months.
 * @param {ReturnType<typeof computeBirthChart>} natalChart
 * @param {Date} fromDate - the moment to evaluate current orbs from
 */
export function computeExactAspects(natalChart, fromDate) {
  const points = natalAspectPoints(natalChart);
  let results = [];

  for (const planet of PLANETS) {
    const sampleDates = [-ASPECT_TREND_SAMPLE_DAYS, 0, ASPECT_TREND_SAMPLE_DAYS].map(
      (d) => new Date(fromDate.getTime() + d * DAY_MS),
    );
    const sampleLongitudes = sampleDates.map((d) => transitingSiderealLongitude(planet, d));

    for (const offsetDeg of aspectOffsetsFor(planet)) {
      for (const point of points) {
        const orbs = sampleLongitudes.map((lon) => angularSeparation(normalizeDegrees(lon + offsetDeg), point.longitude));
        const orbNow = orbs[1];
        if (orbNow > ASPECT_ORB_DEG) continue;

        const rate = (orbs[2] - orbs[0]) / (2 * ASPECT_TREND_SAMPLE_DAYS); // deg/day, negative = tightening
        const stationary = Math.abs(rate) < ASPECT_MIN_DAILY_RATE;
        const applying = !stationary && rate < 0;
        const daysToExact = applying ? orbNow / -rate : null;
        if (applying && daysToExact > ASPECT_HORIZON_DAYS) continue;
        const exactDate = applying ? new Date(fromDate.getTime() + daysToExact * DAY_MS) : null;

        results.push({ planet, natalPoint: point.name, label: aspectLabel(offsetDeg), orbDeg: orbNow, applying, stationary, exactDate });
      }
    }
  }

  results = mergeNodalDuplicates(results);

  return results
    .map((r) => ({
      ...r,
      timingLabel: aspectTimingLabel(r.orbDeg, r.applying, r.stationary, r.exactDate),
      meaning: aspectMeaning(r.planet, r.natalPoint),
    }))
    .sort((a, b) => a.orbDeg - b.orbDeg);
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
      // Vargottama is a fixed D1-vs-D9 fact about the birth, not something
      // that varies per varga, so it's carried over as-is.
      vargottama: p.vargottama,
      aspects: aspectedHouses(house, p.planet),
    };
  });

  const { planets: planetsWithStrength, strongestPlanet } = withStrength(planets);

  return {
    varga,
    strongestPlanet,
    ascendant: { rashi: ascendantRashi, rashiName: RASHIS[ascendantRashi] },
    planets: planetsWithStrength,
  };
}
