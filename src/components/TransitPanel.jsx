import { useEffect, useMemo, useRef, useState } from 'react';
import { computeTransitChart, computeTransitOutlook } from '../lib/astro';
import { formatDegree } from '../lib/format';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'positions', label: 'Planet Positions' },
];

function effectLabel(effect) {
  return effect === 'favorable' ? 'Favorable' : 'Challenging';
}

const OVERALL_LABELS = {
  favorable: 'Favorable',
  'use caution': 'Use Caution',
  'mixed signals': 'Mixed Signals',
};

const OVERALL_CLASSES = {
  favorable: 'transit-effect-favorable',
  'use caution': 'transit-effect-challenging',
  'mixed signals': 'transit-effect-mixed',
};

function formatWindowRange(start, end) {
  const opts = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

export default function TransitPanel({ natalChart }) {
  const [tab, setTab] = useState('overview');
  const [now, setNow] = useState(() => new Date());
  const [justRefreshed, setJustRefreshed] = useState(false);
  const refreshTimeoutRef = useRef(null);

  const transit = useMemo(() => computeTransitChart(natalChart, now), [natalChart, now]);
  const outlook = useMemo(() => computeTransitOutlook(natalChart, now), [natalChart, now]);

  useEffect(() => () => clearTimeout(refreshTimeoutRef.current), []);

  function handleRefresh() {
    setNow(new Date());
    setJustRefreshed(true);
    clearTimeout(refreshTimeoutRef.current);
    refreshTimeoutRef.current = setTimeout(() => setJustRefreshed(false), 1500);
  }

  return (
    <div className="transit-panel">
      <div className="transit-panel-header">
        <h3>Gochara (Current Transits)</h3>
        <button type="button" className="transit-refresh" onClick={handleRefresh}>
          Refresh
        </button>
      </div>
      <p className="transit-meta">
        As of {transit.generatedAt.toLocaleString()} &middot; Lahiri ayanamsa {formatDegree(transit.ayanamsa)}
        {justRefreshed && <span className="transit-refreshed-badge"> &middot; Updated</span>}
      </p>

      <div className="transit-tabs" role="tablist" aria-label="Transit view">
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
          <h4 className="transit-outlook-title">Next 20 Days</h4>
          <div className="transit-week-grid">
            {outlook.map((window) => (
              <div className="transit-week-card" key={window.windowIndex}>
                <p className="transit-week-range">{formatWindowRange(window.startDate, window.endDate)}</p>
                <p className="transit-week-headline">{window.narrative.headline}</p>

                {window.narrative.leanInto && (
                  <p className="transit-week-advice transit-effect-favorable">{window.narrative.leanInto}</p>
                )}

                {window.narrative.takeCare && (
                  <p className="transit-week-advice transit-effect-challenging">{window.narrative.takeCare}</p>
                )}

                {window.narrative.watchouts.map((w) => (
                  <div className="transit-week-watchout" key={w.planet}>
                    <p className="transit-week-watchout-title">
                      {w.planet}'s {w.label}
                    </p>
                    <p className="transit-week-watchout-body">{w.advice}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="transit-nakshatra-note">
            Each panel is a snapshot taken at its start - the slower grahas hold their house across the
            whole 10-day window, while the Moon (and to a lesser extent Mercury/Venus/Mars) can shift
            sign or nakshatra within it; check the Planet Positions tab on any given day for the exact
            picture.
          </p>

          <h4 className="transit-outlook-title">Grahas Right Now</h4>
          <p className="transit-summary">
            <strong>{transit.favorableCount}</strong> of <strong>{transit.totalCount}</strong> grahas are
            transiting a favorable house from your natal Moon ({transit.natalMoonRashiName}).
          </p>
          <div className="planet-table-wrapper">
            <table className="planet-table">
              <thead>
                <tr>
                  <th>Graha</th>
                  <th>Sign</th>
                  <th>House (from Moon)</th>
                  <th>Area of Influence</th>
                  <th>Effect</th>
                  <th>Watch For</th>
                </tr>
              </thead>
              <tbody>
                {transit.planets.map((p) => (
                  <tr key={p.planet}>
                    <td>
                      {p.planet}
                      {p.retrograde && <span className="legend-retrograde"> (R)</span>}
                    </td>
                    <td>{p.rashiName}</td>
                    <td>{p.houseFromMoon}</td>
                    <td>{p.areaOfInfluence}</td>
                    <td className={`transit-effect-${p.effect}`}>{effectLabel(p.effect)}</td>
                    <td className={p.maleficTransit || p.latta ? 'transit-effect-challenging' : ''}>
                      {p.maleficTransit ?? (p.latta ? 'Latta' : '–')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'positions' && (
        <div className="transit-tabpanel">
          <h4 className="transit-outlook-title">Where Each Graha Is</h4>
          <div className="planet-table-wrapper">
            <table className="planet-table">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Sign</th>
                  <th>Degree</th>
                  <th>House (from Moon)</th>
                  <th>House (from Lagna)</th>
                  <th>Nakshatra</th>
                  <th>Pada</th>
                </tr>
              </thead>
              <tbody>
                {transit.planets.map((p) => (
                  <tr key={p.planet}>
                    <td>
                      {p.planet}
                      {p.retrograde && <span className="legend-retrograde"> (R)</span>}
                    </td>
                    <td>{p.rashiName}</td>
                    <td>{formatDegree(p.degreeInRashi)}</td>
                    <td>{p.houseFromMoon}</td>
                    <td>{p.houseFromLagna}</td>
                    <td>{p.nakshatra}</td>
                    <td>{p.pada}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h4 className="transit-outlook-title">What It Means</h4>
          <div className="planet-table-wrapper">
            <table className="planet-table">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Overall</th>
                  <th>Gochara Effect</th>
                  <th>Tara Bala</th>
                  <th>Latta</th>
                  <th>Named Transit</th>
                  <th>Area of Influence</th>
                </tr>
              </thead>
              <tbody>
                {transit.planets.map((p) => (
                  <tr key={p.planet}>
                    <td>{p.planet}</td>
                    <td className={OVERALL_CLASSES[p.overall]}>{OVERALL_LABELS[p.overall]}</td>
                    <td className={`transit-effect-${p.effect}`}>{effectLabel(p.effect)}</td>
                    <td className={`transit-tara-${p.tara.nature}`}>{p.tara.name}</td>
                    <td className={p.latta ? 'transit-effect-challenging' : ''}>{p.latta ? 'Yes' : '–'}</td>
                    <td className={p.maleficTransit ? 'transit-effect-challenging' : ''}>
                      {p.maleficTransit ?? '–'}
                    </td>
                    <td>{p.areaOfInfluence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="transit-nakshatra-note">
            "Gochara Effect" and "Tara Bala" are two independent classical readings of the same transit
            (one from the house it's sitting in, one from its nakshatra), so they can point different
            ways - "Overall" is the plain-language takeaway once both are weighed together, and is what's
            worth actually paying attention to. "Latta" and "Named Transit" flag a couple of specific,
            well-known afflictions rather than every weak placement.
          </p>
        </div>
      )}
    </div>
  );
}
