import { formatDegree } from '../lib/format';

function statusBadges(p) {
  const badges = [];
  if (p.retrograde) badges.push({ label: 'Retrograde', className: 'legend-retrograde' });
  if (p.exalted) badges.push({ label: 'Exalted', className: 'legend-exalted' });
  if (p.debilitated) badges.push({ label: 'Debilitated', className: 'legend-debilitated' });
  if (p.combust) badges.push({ label: 'Combust', className: 'legend-combust' });
  return badges;
}

export default function PlanetTable({ chart }) {
  const hasDegrees = chart.ascendant.degreeInRashi !== undefined;

  return (
    <div className="planet-table-wrapper">
      <div className="ascendant-summary">
        <strong>Ascendant (Lagna):</strong>{' '}
        {chart.ascendant.rashiName}
        {hasDegrees && <> {formatDegree(chart.ascendant.degreeInRashi)}</>}
        {chart.ascendant.nakshatra && (
          <> &middot; {chart.ascendant.nakshatra} pada {chart.ascendant.pada}</>
        )}
        {chart.ayanamsa !== undefined && (
          <span className="ayanamsa-note"> (Lahiri ayanamsa {formatDegree(chart.ayanamsa)})</span>
        )}
      </div>

      <table className="planet-table">
        <thead>
          <tr>
            <th>Planet</th>
            <th>Rashi</th>
            {hasDegrees && <th>Degree</th>}
            <th>House</th>
            {hasDegrees && <th>Nakshatra</th>}
            {hasDegrees && <th>Pada</th>}
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {chart.planets.map((p) => (
            <tr key={p.planet}>
              <td>{p.planet}</td>
              <td>{p.rashiName}</td>
              {hasDegrees && <td>{formatDegree(p.degreeInRashi)}</td>}
              <td>{p.house}</td>
              {hasDegrees && <td>{p.nakshatra}</td>}
              {hasDegrees && <td>{p.pada}</td>}
              <td>
                {statusBadges(p).map((b, i) => (
                  <span key={b.label} className={b.className}>
                    {i > 0 && ', '}
                    {b.label}
                  </span>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
