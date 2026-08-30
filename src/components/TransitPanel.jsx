import { useMemo, useState } from 'react';
import { computeTransitChart } from '../lib/astro';
import { formatDegree } from '../lib/format';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'positions', label: 'Planet Positions' },
  { id: 'nakshatra', label: 'Nakshatra' },
];

function effectLabel(effect) {
  return effect === 'favorable' ? 'Favorable' : 'Challenging';
}

export default function TransitPanel({ natalChart }) {
  const [tab, setTab] = useState('overview');
  const [now, setNow] = useState(() => new Date());

  const transit = useMemo(() => computeTransitChart(natalChart, now), [natalChart, now]);

  return (
    <div className="transit-panel">
      <div className="transit-panel-header">
        <h3>Gochara (Current Transits)</h3>
        <button type="button" className="transit-refresh" onClick={() => setNow(new Date())}>
          Refresh to now
        </button>
      </div>
      <p className="transit-meta">
        As of {transit.generatedAt.toLocaleString()} &middot; Lahiri ayanamsa {formatDegree(transit.ayanamsa)}
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
          <p className="transit-summary">
            <strong>{transit.favorableCount}</strong> of <strong>{transit.totalCount}</strong> grahas are
            transiting a favorable house from your natal Moon ({transit.natalMoonRashiName}).
          </p>
          <ul className="transit-overview-list">
            {transit.planets.map((p) => (
              <li key={p.planet} className={`transit-effect-${p.effect}`}>
                <span className="transit-overview-planet">{p.planet}</span>
                <span className="transit-overview-detail">
                  in {p.rashiName} &middot; house {p.houseFromMoon} from Moon ({p.areaOfInfluence}) &middot;{' '}
                  {effectLabel(p.effect)}
                  {p.maleficTransit && <> &middot; {p.maleficTransit}</>}
                  {p.latta && <> &middot; Latta</>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === 'positions' && (
        <div className="transit-tabpanel">
          <div className="planet-table-wrapper">
            <table className="planet-table">
              <thead>
                <tr>
                  <th>Planet</th>
                  <th>Rashi</th>
                  <th>Degree</th>
                  <th>House (from Moon)</th>
                  <th>House (from Lagna)</th>
                  <th>Nakshatra</th>
                  <th>Nakshatra (from Moon)</th>
                  <th>Pada</th>
                  <th>Effect</th>
                  <th>Tara Bala</th>
                  <th>Latta</th>
                  <th>Named Transit</th>
                  <th>Area of Influence</th>
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
                    <td>{p.nakshatraFromMoon}</td>
                    <td>{p.pada}</td>
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
            Tara Bala and Latta are counted from your birth (Janma) nakshatra; "Named Transit" flags only
            the well-established doshas (Saturn's Sade Sati / Ashtama Shani / Kantaka Shani, Mars's 4-8-12
            transit rule) rather than every weak placement. These are teaching-level, simplified readings.
          </p>
        </div>
      )}

      {tab === 'nakshatra' && (
        <div className="transit-tabpanel">
          <div className="transit-nakshatra-grid">
            <div>
              <p className="transit-nakshatra-label">Birth Star (Janma Nakshatra)</p>
              <p className="transit-nakshatra-value">{transit.natalMoonNakshatra}</p>
            </div>
            <div>
              <p className="transit-nakshatra-label">Current Moon Nakshatra</p>
              <p className="transit-nakshatra-value">
                {transit.planets.find((p) => p.planet === 'Moon').nakshatra} - pada{' '}
                {transit.planets.find((p) => p.planet === 'Moon').pada}
              </p>
            </div>
            <div>
              <p className="transit-nakshatra-label">Tara Bala</p>
              <p className={`transit-nakshatra-value transit-tara-${transit.tara.nature}`}>
                {transit.tara.name} ({transit.tara.nature})
              </p>
            </div>
          </div>
          <p className="transit-nakshatra-note">
            Tara Bala reads the current Moon's nakshatra relative to your birth nakshatra on a 9-fold
            cycle; "good" and "bad" here are the classical broad-strokes reading, not a full prediction.
            Every graha's own nakshatra-from-Moon count, Tara Bala, and Latta status is in the
            Planet Positions tab.
          </p>
        </div>
      )}
    </div>
  );
}
