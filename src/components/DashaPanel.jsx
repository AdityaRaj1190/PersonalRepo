import { Fragment, useMemo, useState } from 'react';
import { computePratyantardashas, computeVimshottariMahadashas, isDashaPeriodCurrent } from '../lib/astro';

const YEAR_MS = 365.2425 * 24 * 60 * 60 * 1000;

function formatDate(date) {
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDuration(startDate, endDate) {
  const totalMonths = Math.round(((endDate.getTime() - startDate.getTime()) / YEAR_MS) * 12);
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  if (years === 0) return `${months}mo`;
  if (months === 0) return `${years}y`;
  return `${years}y ${months}mo`;
}

function periodKey(period) {
  return `${period.lord}-${period.startDate.getTime()}`;
}

function isSamePeriod(a, b) {
  return Boolean(a && b && periodKey(a) === periodKey(b));
}

function PeriodRow({ period, isOpen, isCurrent, onToggle }) {
  return (
    <tr className={`dasha-row ${isCurrent ? 'dasha-row-current' : ''}`} onClick={onToggle}>
      <td className="dasha-caret">{isOpen ? '▾' : '▸'}</td>
      <td className="dasha-lord-cell">
        {period.lord}
        {isCurrent && <span className="dasha-current-tag">Now</span>}
      </td>
      <td>{formatDate(period.startDate)}</td>
      <td>{formatDate(period.endDate)}</td>
      <td>{formatDuration(period.startDate, period.endDate)}</td>
    </tr>
  );
}

export default function DashaPanel({ natalChart, birthUtcDate }) {
  const now = useMemo(() => new Date(), []);
  const mahadashas = useMemo(() => computeVimshottariMahadashas(natalChart, birthUtcDate), [natalChart, birthUtcDate]);

  const currentMahadasha = useMemo(() => mahadashas.find((m) => isDashaPeriodCurrent(m, now)), [mahadashas, now]);
  const currentAntardasha = useMemo(
    () => currentMahadasha?.antardashas.find((a) => isDashaPeriodCurrent(a, now)),
    [currentMahadasha, now],
  );

  const [expandedMaha, setExpandedMaha] = useState(() => (currentMahadasha ? periodKey(currentMahadasha) : null));
  const [expandedAntar, setExpandedAntar] = useState(() => (currentAntardasha ? periodKey(currentAntardasha) : null));

  const expandedAntarPeriod = useMemo(() => {
    const maha = mahadashas.find((m) => periodKey(m) === expandedMaha);
    return maha?.antardashas.find((a) => periodKey(a) === expandedAntar);
  }, [mahadashas, expandedMaha, expandedAntar]);

  const pratyantardashas = useMemo(
    () => (expandedAntarPeriod ? computePratyantardashas(expandedAntarPeriod, birthUtcDate) : []),
    [expandedAntarPeriod, birthUtcDate],
  );

  // Computed independently of what's expanded in the table (cheap - 9 items) so the
  // "Currently running" callout always reflects today's actual chain, not just whatever
  // Antardasha the user happens to have open.
  const currentPratyantardasha = useMemo(() => {
    if (!currentAntardasha) return null;
    const periods = computePratyantardashas(currentAntardasha, birthUtcDate);
    return periods.find((p) => isDashaPeriodCurrent(p, now));
  }, [currentAntardasha, birthUtcDate, now]);

  function toggleMaha(maha) {
    const key = periodKey(maha);
    if (expandedMaha === key) {
      setExpandedMaha(null);
      setExpandedAntar(null);
      return;
    }
    setExpandedMaha(key);
    const defaultAntar = maha.antardashas.find((a) => isDashaPeriodCurrent(a, now)) ?? maha.antardashas[0];
    setExpandedAntar(periodKey(defaultAntar));
  }

  function toggleAntar(antar) {
    const key = periodKey(antar);
    setExpandedAntar(expandedAntar === key ? null : key);
  }

  return (
    <div className="dasha-panel">
      <h3>Vimshottari Dasha</h3>
      <p className="transit-meta">
        The Mahadasha (major period), Antardasha (sub-period), and Pratyantardasha (sub-sub-period) running
        right now, with the full lifetime timeline below.
      </p>

      {currentMahadasha && (
        <div className="dasha-current-callout">
          <p className="dasha-current-label">Currently running</p>
          <p className="dasha-current-value">
            {currentMahadasha.lord}
            {currentAntardasha && <> &rarr; {currentAntardasha.lord}</>}
            {currentPratyantardasha && <> &rarr; {currentPratyantardasha.lord}</>}
          </p>
          {currentAntardasha && (
            <p className="dasha-current-detail">
              {currentMahadasha.lord} Mahadasha: {formatDate(currentMahadasha.startDate)} &ndash;{' '}
              {formatDate(currentMahadasha.endDate)} &middot; {currentAntardasha.lord} Antardasha:{' '}
              {formatDate(currentAntardasha.startDate)} &ndash; {formatDate(currentAntardasha.endDate)}
            </p>
          )}
        </div>
      )}

      <div className="planet-table-wrapper">
        <table className="planet-table dasha-table">
          <thead>
            <tr>
              <th></th>
              <th>Mahadasha</th>
              <th>Start</th>
              <th>End</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {mahadashas.map((maha) => {
              const mahaOpen = expandedMaha === periodKey(maha);
              return (
                <Fragment key={periodKey(maha)}>
                  <PeriodRow
                    period={maha}
                    isOpen={mahaOpen}
                    isCurrent={maha === currentMahadasha}
                    onToggle={() => toggleMaha(maha)}
                  />
                  {mahaOpen && (
                    <tr key={`${periodKey(maha)}-antardashas`}>
                      <td colSpan={5} className="dasha-nested-cell">
                        <table className="planet-table dasha-table dasha-sub-table">
                          <thead>
                            <tr>
                              <th></th>
                              <th>Antardasha</th>
                              <th>Start</th>
                              <th>End</th>
                              <th>Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {maha.antardashas.map((antar) => {
                              const antarOpen = expandedAntar === periodKey(antar);
                              return (
                                <Fragment key={periodKey(antar)}>
                                  <PeriodRow
                                    period={antar}
                                    isOpen={antarOpen}
                                    isCurrent={antar === currentAntardasha}
                                    onToggle={() => toggleAntar(antar)}
                                  />
                                  {antarOpen && expandedAntarPeriod === antar && (
                                    <tr key={`${periodKey(antar)}-pratyantardashas`}>
                                      <td colSpan={5} className="dasha-nested-cell">
                                        <table className="planet-table dasha-table dasha-sub-table">
                                          <thead>
                                            <tr>
                                              <th>Pratyantardasha</th>
                                              <th>Start</th>
                                              <th>End</th>
                                              <th>Duration</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {pratyantardashas.map((praty) => (
                                              <tr
                                                key={periodKey(praty)}
                                                className={isSamePeriod(praty, currentPratyantardasha) ? 'dasha-row-current' : ''}
                                              >
                                                <td className="dasha-lord-cell">
                                                  {praty.lord}
                                                  {isSamePeriod(praty, currentPratyantardasha) && (
                                                    <span className="dasha-current-tag">Now</span>
                                                  )}
                                                </td>
                                                <td>{formatDate(praty.startDate)}</td>
                                                <td>{formatDate(praty.endDate)}</td>
                                                <td>{formatDuration(praty.startDate, praty.endDate)}</td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </td>
                                    </tr>
                                  )}
                                </Fragment>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="transit-nakshatra-note">
        Vimshottari Dasha is a fixed 120-year cycle split among the 9 grahas, starting from wherever the
        Moon sat in its birth nakshatra - so the first Mahadasha shown is only its remaining balance, not
        a full period. Each level (Mahadasha, Antardasha, Pratyantardasha) is the same proportional split
        applied recursively to a shorter span. Click a Mahadasha to see its Antardashas, and an Antardasha
        to see its Pratyantardashas.
      </p>
    </div>
  );
}
