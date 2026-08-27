import tzlookup from 'tz-lookup';
import { DateTime } from 'luxon';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

/**
 * Search for places matching a free-text query using the OpenStreetMap
 * Nominatim geocoding API.
 * @param {string} query
 * @param {AbortSignal} [signal]
 * @returns {Promise<Array<{label: string, lat: number, lon: number}>>}
 */
export async function searchLocations(query, signal) {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', trimmed);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');

  const response = await fetch(url.toString(), {
    signal,
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Location search failed (${response.status})`);
  }

  const results = await response.json();
  return results.map((r) => ({
    label: r.display_name,
    lat: parseFloat(r.lat),
    lon: parseFloat(r.lon),
  }));
}

/** IANA timezone name for a lat/lon pair. */
export function timezoneForLocation(lat, lon) {
  return tzlookup(lat, lon);
}

/**
 * Convert a local civil date/time at a given location into a UTC JS Date,
 * correctly accounting for that location's historical UTC offset (incl. DST).
 * @param {{year:number, month:number, day:number, hour:number, minute:number}} local
 * @param {number} lat
 * @param {number} lon
 * @returns {{ utcDate: Date, timezone: string, offsetMinutes: number }}
 */
export function localToUtc(local, lat, lon) {
  const timezone = timezoneForLocation(lat, lon);
  const dt = DateTime.fromObject(local, { zone: timezone });
  if (!dt.isValid) {
    throw new Error(`Invalid date/time: ${dt.invalidReason} ${dt.invalidExplanation ?? ''}`);
  }
  return { utcDate: dt.toUTC().toJSDate(), timezone, offsetMinutes: dt.offset };
}
