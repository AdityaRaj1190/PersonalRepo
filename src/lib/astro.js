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

  const y = -Math.cos(ramcRad);
  const x = Math.sin(eps) * Math.tan(latRad) + Math.cos(eps) * Math.sin(ramcRad);
  const ascRad = Math.atan2(y, x);
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

    return {
      planet,
      longitude: sidereal,
      degreeInRashi: sidereal % 30,
      rashi,
      rashiName: RASHIS[rashi],
      house,
      nakshatra: NAKSHATRAS[nakshatraIndex],
      pada,
      retrograde: planet === 'Rahu' || planet === 'Ketu' ? true : isRetrograde(planet, utcDate),
    };
  });

  const houses = Array.from({ length: 12 }, (_, i) => {
    const rashi = (ascendantRashi + i) % 12;
    return { house: i + 1, rashi, rashiName: RASHIS[rashi] };
  });

  return {
    ayanamsa,
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
