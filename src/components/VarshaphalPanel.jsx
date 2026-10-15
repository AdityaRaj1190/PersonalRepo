import { useMemo, useState } from 'react';
import { completedYearsAt, computeVarshaMonths, computeVarshaphal } from '../lib/astro';
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

function formatShort(date) {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'monthly', label: 'Month by Month' },
  { id: 'chart', label: 'Chart' },
];

const MUNTHA_VERDICT = { favorable: 'Supportive house', challenging: 'Testing house' };
const YEAR_LORD_VERDICT = { favorable: 'Well placed', neutral: 'Moderately placed', challenging: 'Weakly placed' };

/**
 * Varshaphal: the Tajika annual chart for the year of life currently
 * running, with one-tap navigation to the years either side. Split into
 * three views so a phone never has to scroll through all of it at once:
 * a plain-language overview of the year (year lord and Muntha), a
 * month-by-month reading tied to the running Antardasha and
 * Pratyantardasha, and the chart with the five office-bearers the year
 * lord was chosen from.
 */
export default function VarshaphalPanel({ natalChart, birthUtcDate, location }) {
  const currentYears = useMemo(
    () => completedYearsAt(natalChart, birthUtcDate, new Date()),
    [natalChart, birthUtcDate],
  );
  const [completedYears, setCompletedYears] = useState(currentYears);
  const [tab, setTab] = useState('overview');

  const varsha = useMemo(
    () => computeVarshaphal(natalChart, birthUtcDate, location.lat, location.lon, completedYears),
    [natalChart, birthUtcDate, location, completedYears],
  );
  const months = useMemo(
    () => computeVarshaMonths(natalChart, birthUtcDate, varsha),
    [natalChart, birthUtcDate, varsha],
  );
  const isCurrent = completedYears === currentYears;
  const now = new Date();
  const currentMonth = isCurrent ? months.find((m) => now >= m.startDate && now < m.endDate) : null;
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

      <div className="transit-tabs" role="tablist" aria-label="Varshaphal view">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="transit-tabpanel">
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

          <dl className="varsha-facts">
            <dt>Year lord</dt>
            <dd>
              {yearLord.planet}, {ordinal(yearLord.house)} house &middot;{' '}
              <span className={`varga-reading-tone-${yearLord.verdict}`}>{YEAR_LORD_VERDICT[yearLord.verdict]}</span>
            </dd>
            <dt>Muntha</dt>
            <dd>
              {muntha.rashiName}, {ordinal(muntha.house)} house &middot;{' '}
              <span className={`varga-reading-tone-${muntha.nature}`}>{MUNTHA_VERDICT[muntha.nature]}</span>
            </dd>
            <dt>Varsha Lagna</dt>
            <dd>
              {varsha.chart.ascendant.rashiName} &middot; began {varsha.isDayBirth ? 'by day' : 'by night'},{' '}
              {formatDateTime(varsha.startDate)}
            </dd>
            {currentMonth && (
              <>
                <dt>Dasha now</dt>
                <dd>
                  {currentMonth.mahaLord} &rarr; {currentMonth.antarLord} &rarr; {currentMonth.pratyLord}
                </dd>
              </>
            )}
          </dl>

          {currentMonth && (
            <button type="button" className="varsha-month-jump" onClick={() => setTab('monthly')}>
              <span>
                This month: <strong className={`varga-reading-tone-${currentMonth.tone}`}>{currentMonth.toneLabel}</strong>
              </span>
              <span className="varsha-month-jump-link">See month by month &rarr;</span>
            </button>
          )}

          <InfoNote className="transit-nakshatra-note">
            Varshaphal is the Tajika annual chart: it is cast for the moment each year the Sun comes back to
            the exact sidereal (Lahiri) degree it held at your birth, and it describes the year of life that
            runs until the next such return. Muntha starts in your birth Lagna sign and moves forward one sign
            per year; it marks the area of life the year keeps returning to, and is classically best in the
            9th, 10th or 11th house and hardest in the 4th, 6th, 7th, 8th or 12th. The year lord is picked
            from five office-bearers (see the Chart view): the strongest one that casts a Tajika aspect on the
            Varsha Lagna (Tajika aspects skip the 2nd, 6th, 8th and 12th signs)
            {yearLord.fallback ? ' - none did this year, so the strongest of all five was taken' : ''}. Strength
            here is a simplified check of dignity, house and combustion rather than the full Pancha-Vargiya
            Bala, so a close call between two candidates can come out differently in other software. The chart
            is cast for your place of birth; classical texts prefer the place you are living at the return,
            which can shift the Varsha Lagna if you have moved far east or west.
          </InfoNote>
        </div>
      )}

      {tab === 'monthly' && (
        <div className="transit-tabpanel">
          <div className="varsha-months">
            {months.map((m) => {
              const isNow = m === currentMonth;
              return (
                <details className={`varsha-month ${isNow ? 'varsha-month-current' : ''}`} key={m.index} open={isNow}>
                  <summary>
                    <span className="varsha-month-range">
                      {formatShort(m.startDate)} &ndash; {formatShort(m.endDate)}
                      {isNow && <span className="dasha-current-tag">Now</span>}
                    </span>
                    <span className={`varsha-month-tone varga-reading-tone-${m.tone}`}>{m.toneLabel}</span>
                    <span className="varsha-month-dasha">
                      {m.antarLord} &rarr; {m.pratyTimeline.map((t) => t.lord).join(' / ')}
                    </span>
                  </summary>
                  {m.pratyTimeline.length > 1 && (
                    <p className="varsha-month-dasha varsha-month-handover">
                      Pratyantardasha {m.pratyTimeline.map((t) => `${t.lord} ${t.label}`).join(', then ')}
                    </p>
                  )}
                  {m.lines.map((line) => (
                    <p className="varsha-month-line" key={line}>
                      {line}
                    </p>
                  ))}
                </details>
              );
            })}
          </div>
          <InfoNote className="transit-nakshatra-note">
            Each month is a Tajika solar month: it starts when the Sun has moved another 30 degrees on from
            its birth position, so month 1 opens at the solar return and the twelve months fill the year
            exactly (that is why they don't line up with calendar months). Each row shows the Antardasha
            &rarr; Pratyantardasha running through it, the same periods as the Dasha tab. The Pratyantardasha
            that covers most of the month leads the reading: its house in this year's chart says where the
            month's events gather, and whether it is well placed there counts most towards the month's tone.
            The Antardasha lord's house in the same chart is the backdrop, and the Pratyantardasha lord's own
            transit from your natal Moon at mid-month nudges the tone either way. The Sun's house shows which
            part of life is in the spotlight that month regardless of the dashas. Treat it as where to focus,
            not a prediction of specific events.
          </InfoNote>
        </div>
      )}

      {tab === 'chart' && (
        <div className="transit-tabpanel">
          <ChartDisplay
            panels={[{ chart: varsha.chart, title: `Varsha chart · from ${formatDate(varsha.startDate)}` }]}
          />

          <h4 className="transit-outlook-title">Office-bearers (Pancha-adhikaris)</h4>
          <div className="planet-table-wrapper">
            <table className="planet-table varsha-officer-table">
              <thead>
                <tr>
                  <th>Office</th>
                  <th>Graha</th>
                  <th>House</th>
                  <th>Sees Lagna</th>
                  <th className="varsha-officer-why">Why</th>
                </tr>
              </thead>
              <tbody>
                {varsha.officeBearers.map((o) => (
                  <tr key={o.role} className={o.planet === yearLord.planet ? 'strongest-row' : ''}>
                    <td>{o.role}</td>
                    <td>{o.planet}</td>
                    <td>{o.house}</td>
                    <td>{o.seesLagna ? 'Yes' : 'No'}</td>
                    <td className="varsha-officer-why">{o.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="varsha-officer-note">
            Highlighted: {yearLord.planet}, the year lord - the strongest office-bearer that aspects the Varsha
            Lagna.
          </p>
        </div>
      )}
    </div>
  );
}
