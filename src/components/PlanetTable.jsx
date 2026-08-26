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
  return (
    <div className="planet-table-wrapper">
      <div className="ascendant-summary">
        <strong>Ascendant (Lagna):</strong>{' '}
        {chart.ascendant.rashiName} {formatDegree(chart.ascendant.degreeInRashi)} &middot;{' '}
        {chart.ascendant.nakshatra} pada {chart.ascendant.pada}
        <span className="ayanamsa-note"> (Lahiri ayanamsa {formatDegree(chart.ayanamsa)})</span>
      </div>

      <table className="planet-table">
        <thead>
          <tr>
            <th>Planet</th>
            <th>Rashi</th>
            <th>Degree</th>
            <th>House</th>
            <th>Nakshatra</th>
            <th>Pada</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {chart.planets.map((p) => (
            <tr key={p.planet}>
              <td>{p.planet}</td>
              <td>{p.rashiName}</td>
              <td>{formatDegree(p.degreeInRashi)}</td>
              <td>{p.house}</td>
              <td>{p.nakshatra}</td>
              <td>{p.pada}</td>
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
