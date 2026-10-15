import { useMemo, useState } from 'react';
import { completedYearsAt, computeVarshaphal } from '../lib/astro';
import ChartDisplay from './ChartDisplay';
import InfoNote from './InfoNote';

function ordinal(n) {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${suffixes[(v - 20) % 10] ?? suffixes[v] ?? suffixes[0]}`;
}

function formatDateTime(date) {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(date) {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const MUNTHA_VERDICT = { favorable: 'Supportive house', challenging: 'Testing house' };
const YEAR_LORD_VERDICT = { favorable: 'Well placed', neutral: 'Moderately placed', challenging: 'Weakly placed' };

/**
 * Varshaphal: the Tajika annual chart for the year of life currently
 * running, with one-tap navigation to the years either side. Leads with a
 * plain-language read of the year (year lord and Muntha), then the chart,
 * then the five office-bearers the year lord was chosen from.
 */
export default function VarshaphalPanel({ natalChart, birthUtcDate, location }) {
  const currentYears = useMemo(
    () => completedYearsAt(natalChart, birthUtcDate, new Date()),
    [natalChart, birthUtcDate],
  );
  const [completedYears, setCompletedYears] = useState(currentYears);

  const varsha = useMemo(
    () => computeVarshaphal(natalChart, birthUtcDate, location.lat, location.lon, completedYears),
    [natalChart, birthUtcDate, location, completedYears],
  );
  const isCurrent = completedYears === currentYears;
  const { yearLord, muntha } = varsha;

  return (
    <div className="transit-panel varsha-panel">
      <div className="transit-panel-header">
        <h3>Varshaphal (Annual Chart)</h3>
        <div className="varsha-year-nav" role="group" aria-label="Choose year">
          <button
            type="button"
            className="transit-refresh"
            onClick={() => setCompletedYears((n) => n - 1)}
            disabled={completedYears === 0}
            aria-label="Previous year"
          >
            &larr; Prev
          </button>
          {!isCurrent && (
            <button type="button" className="transit-refresh" onClick={() => setCompletedYears(currentYears)}>
              This year
            </button>
          )}
          <button
            type="button"
            className="transit-refresh"
            onClick={() => setCompletedYears((n) => n + 1)}
            aria-label="Next year"
          >
            Next &rarr;
          </button>
        </div>
      </div>
      <p className="transit-meta">
        Your {ordinal(varsha.yearNumber)} year (age {varsha.completedYears}) &middot; {formatDate(varsha.startDate)}{' '}
        &ndash; {formatDate(varsha.endDate)}
        {isCurrent && <span className="dasha-current-tag">Now</span>}
      </p>

      <div className="dasha-current-callout">
        <p className="dasha-current-label">The year at a glance</p>
        <p className="dasha-current-value">
          Year lord {yearLord.planet} &middot; Muntha in the {ordinal(muntha.house)}
        </p>
        {varsha.summary.map((sentence) => (
          <p className="varsha-summary-line" key={sentence}>
            {sentence}
          </p>
        ))}
      </div>

      <div className="varga-reading-pointers varsha-pointers">
        <div className="varga-reading-pointer">
          <p className="varga-reading-pointer-role">Year lord &middot; {yearLord.planet}</p>
          <p className={`varga-reading-pointer-verdict varga-reading-tone-${yearLord.verdict}`}>
            {YEAR_LORD_VERDICT[yearLord.verdict]}
          </p>
          <p className="varga-reading-pointer-body">
            In the {ordinal(yearLord.house)} house ({yearLord.rashiName}); chosen as {yearLord.roles.join(' and ')}.
          </p>
          <p className="varga-reading-entry-detail">Theme of the year: {yearLord.theme}.</p>
        </div>
        <div className="varga-reading-pointer">
          <p className="varga-reading-pointer-role">Muntha &middot; {muntha.rashiName}</p>
          <p className={`varga-reading-pointer-verdict varga-reading-tone-${muntha.nature}`}>
            {MUNTHA_VERDICT[muntha.nature]}
          </p>
          <p className="varga-reading-pointer-body">
            In the {ordinal(muntha.house)} house, ruled by {muntha.lord}.
          </p>
          <p className="varga-reading-entry-detail">Area in focus: {muntha.area.toLowerCase()}.</p>
        </div>
        <div className="varga-reading-pointer">
          <p className="varga-reading-pointer-role">Varsha Lagna &middot; {varsha.chart.ascendant.rashiName}</p>
          <p className="varga-reading-pointer-body">
            The year began {varsha.isDayBirth ? 'by day' : 'by night'} on {formatDateTime(varsha.startDate)}.
          </p>
          <p className="varga-reading-entry-detail">
            The moment the Sun returned to its exact birth position, cast for your place of birth.
          </p>
        </div>
      </div>

      <ChartDisplay panels={[{ chart: varsha.chart, title: `Varsha chart · ${varsha.startDate.getFullYear()}` }]} />

      <h4 className="transit-outlook-title">Office-bearers (Pancha-adhikaris)</h4>
      <div className="planet-table-wrapper">
        <table className="planet-table transit-aspect-table">
          <thead>
            <tr>
              <th>Office</th>
              <th>Graha</th>
              <th>House</th>
              <th>Sees Lagna</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            {varsha.officeBearers.map((o) => (
              <tr key={o.role} className={o.planet === yearLord.planet ? 'strongest-row' : ''}>
                <td data-label="Office">{o.role}</td>
                <td data-label="Graha">{o.planet}</td>
                <td data-label="House">{o.house}</td>
                <td data-label="Sees Lagna">{o.seesLagna ? 'Yes' : 'No'}</td>
                <td data-label="Why" className="transit-aspect-meaning">
                  {o.detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <InfoNote className="transit-nakshatra-note">
        Varshaphal is the Tajika annual chart: it is cast for the moment each year the Sun comes back to the
        exact sidereal (Lahiri) degree it held at your birth, and it describes the year of life that runs
        until the next such return. Muntha starts in your birth Lagna sign and moves forward one sign per
        year; it marks the area of life the year keeps returning to, and is classically best in the 9th,
        10th or 11th house and hardest in the 4th, 6th, 7th, 8th or 12th. The year lord is picked from the
        five office-bearers in the table: the strongest one that casts a Tajika aspect on the Varsha Lagna
        (Tajika aspects skip the 2nd, 6th, 8th and 12th signs){yearLord.fallback ? ' - none did this year, so the strongest of all five was taken' : ''}.
        Strength here is a simplified check of dignity, house and combustion rather than the full
        Pancha-Vargiya Bala, so a close call between two candidates can come out differently in other
        software. The chart is cast for your place of birth; classical texts prefer the place you are
        living at the return, which can shift the Varsha Lagna if you have moved far east or west.
      </InfoNote>
    </div>
  );
}
