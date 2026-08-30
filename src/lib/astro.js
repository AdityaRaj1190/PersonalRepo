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
  8: 'Unexpected Change',
  9: 'Fortune & Growth',
  10: 'Career',
  11: 'Investment',
  12: 'Expenditure',
};

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
  const jd = toJulianDay(transitUtcDate);
  const ayanamsa = lahiriAyanamsa(jd);

  const natalMoon = natalChart.planets.find((p) => p.planet === 'Moon');
  const natalMoonRashi = natalMoon.rashi;
  const natalMoonNakshatraIndex = NAKSHATRAS.indexOf(natalMoon.nakshatra);
  const natalAscRashi = natalChart.ascendant.rashi;

  const planets = PLANETS.map((planet) => {
    let tropical;
    if (planet === 'Rahu') {
      tropical = meanLunarNodeLongitude(jd);
    } else if (planet === 'Ketu') {
      tropical = normalizeDegrees(meanLunarNodeLongitude(jd) + 180);
    } else {
      tropical = tropicalLongitude(planet, transitUtcDate);
    }
    const sidereal = normalizeDegrees(tropical - ayanamsa);
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

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CATEGORIES_SHOWN = 3;

const listFormatter =
  typeof Intl !== 'undefined' && Intl.ListFormat ? new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }) : null;

function joinFriendly(words) {
  if (words.length === 0) return '';
  return listFormatter ? listFormatter.format(words) : words.join(', ');
}

/**
 * Reduce a list of planets down to their top few distinct life categories,
 * most-touched first (how many transiting grahas point at that category),
 * ties broken by house order. Capping at MAX_CATEGORIES_SHOWN keeps the
 * weekly advice to a short, actionable handful of things rather than
 * naming every house every planet happens to be sitting in.
 */
function topCategories(planets, limit = MAX_CATEGORIES_SHOWN) {
  const counts = new Map();
  for (const p of planets) {
    counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([category]) => category.toLowerCase());
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const TIER_HEADLINES = {
  favorable: [
    'A broadly favorable, steady week.',
    'A comfortable stretch overall - momentum stays on your side.',
    'Skies stay mostly clear this week.',
  ],
  mixed: [
    'A mixed week - some support, some friction.',
    'A balancing act this week - progress needs a bit more effort.',
    'Give and take this week; be selective about where you push.',
  ],
  demanding: [
    'A demanding week - move carefully and avoid big new commitments.',
    'A week that asks for patience - keep plans flexible.',
    "Proceed cautiously this week - it's not the time to force things.",
  ],
};

const LEAN_INTO_TEMPLATES = [
  (list) => `Good week to make progress on ${list}.`,
  (list) => `${capitalize(list)} are where the energy favors you right now.`,
  (list) => `Worth prioritizing ${list} while the support lasts.`,
];

const TAKE_CARE_TEMPLATES = [
  (list) => `Go easy on ${list} - avoid rushing decisions here.`,
  (list) => `Keep expectations modest around ${list} this week.`,
  (list) => `${capitalize(list)} need extra patience right now - don't force outcomes.`,
];

/**
 * Build a plain-language advice narrative for one week's transit snapshot:
 * an overall headline based on the favorable/challenging balance, what to
 * lean into, what to be careful with, and one explained sentence per
 * named dosha/Latta in play - written for a reader with no prior
 * astrology vocabulary. `weekIndex` and `previousWatchLabels` let the same
 * underlying situation (which often repeats week to week, since most
 * grahas don't change houses within a month) get worded differently
 * instead of printing an identical paragraph three times running.
 */
function buildWeekNarrative(transit, favorablePlanets, challengingPlanets, specialWatch, weekIndex, previousWatchLabels) {
  const ratio = favorablePlanets.length / transit.totalCount;
  const tier = ratio >= 0.6 ? 'favorable' : ratio >= 0.4 ? 'mixed' : 'demanding';
  const headline = TIER_HEADLINES[tier][weekIndex % TIER_HEADLINES[tier].length];

  const leanIntoList = joinFriendly(topCategories(favorablePlanets));
  const leanInto = leanIntoList
    ? LEAN_INTO_TEMPLATES[weekIndex % LEAN_INTO_TEMPLATES.length](leanIntoList)
    : '';

  const takeCareList = joinFriendly(topCategories(challengingPlanets));
  const takeCare = takeCareList
    ? TAKE_CARE_TEMPLATES[weekIndex % TAKE_CARE_TEMPLATES.length](takeCareList)
    : '';

  const watchouts = specialWatch.map((p) => {
    const label = p.maleficTransit ?? 'Latta';
    const continuing = previousWatchLabels.get(p.planet) === label;
    return {
      planet: p.planet,
      label,
      advice: continuing
        ? `Still in effect from last week - see week 1 for what ${label} means and why it matters.`
        : MALEFIC_TRANSIT_EXPLANATIONS[label],
    };
  });

  return { headline, leanInto, takeCare, watchouts };
}

/**
 * Week-by-week Gochara outlook: one computeTransitChart() snapshot taken at
 * the start of each week, read against the natal chart. Snapshotting
 * (rather than tracking every sign/nakshatra change within the week) is a
 * deliberate simplification - the slow grahas (Jupiter onward, plus
 * Rahu/Ketu) don't move houses within a 3-week span anyway, and the
 * fast ones (Sun, Moon, Mercury, Venus, Mars) are summarized by where
 * they stand as the week begins.
 * @param {ReturnType<typeof computeBirthChart>} natalChart
 * @param {Date} startDate - first day of week 1
 * @param {number} [weeks] - how many weekly snapshots to produce
 */
export function computeTransitForecast(natalChart, startDate, weeks = 3) {
  const previousWatchLabels = new Map();
  return Array.from({ length: weeks }, (_, i) => {
    const weekStart = new Date(startDate.getTime() + i * WEEK_MS);
    const weekEnd = new Date(weekStart.getTime() + WEEK_MS - 1);
    const transit = computeTransitChart(natalChart, weekStart);
    const favorablePlanets = transit.planets.filter((p) => p.effect === 'favorable');
    const challengingPlanets = transit.planets.filter((p) => p.effect === 'challenging');
    const specialWatch = transit.planets.filter((p) => p.maleficTransit || p.latta);
    const narrative = buildWeekNarrative(transit, favorablePlanets, challengingPlanets, specialWatch, i, previousWatchLabels);

    previousWatchLabels.clear();
    for (const p of specialWatch) previousWatchLabels.set(p.planet, p.maleficTransit ?? 'Latta');

    return {
      weekIndex: i,
      startDate: weekStart,
      endDate: weekEnd,
      transit,
      favorablePlanets,
      challengingPlanets,
      specialWatch,
      narrative,
    };
  });
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
