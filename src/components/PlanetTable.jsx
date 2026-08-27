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

  const ascendantRow = {
    planet: 'Ascendant',
    rashiName: chart.ascendant.rashiName,
    degreeInRashi: chart.ascendant.degreeInRashi,
    house: 1,
    nakshatra: chart.ascendant.nakshatra,
    pada: chart.ascendant.pada,
  };

  return (
    <div className="planet-table-wrapper">
      {chart.ayanamsa !== undefined && (
        <p className="ayanamsa-note">Lahiri ayanamsa {formatDegree(chart.ayanamsa)}</p>
      )}

      <table className="planet-table">
        <thead>
          <tr>
            <th>Planet</th>
            <th>Rashi</th>
            {hasDegrees && <th>Degree</th>}
            <th>House</th>
            {hasDegrees && <th>Nakshatra</th>}
            {hasDegrees && <th>Pada</th>}
            <th>Aspects</th>
            <th>Vargottama</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr className="ascendant-row">
            <td>{ascendantRow.planet}</td>
            <td>{ascendantRow.rashiName}</td>
            {hasDegrees && <td>{formatDegree(ascendantRow.degreeInRashi)}</td>}
            <td>{ascendantRow.house}</td>
            {hasDegrees && <td>{ascendantRow.nakshatra}</td>}
            {hasDegrees && <td>{ascendantRow.pada}</td>}
            <td>&ndash;</td>
            <td>&ndash;</td>
            <td>&ndash;</td>
          </tr>
          {chart.planets.map((p) => (
            <tr key={p.planet}>
              <td>{p.planet}</td>
              <td>{p.rashiName}</td>
              {hasDegrees && <td>{formatDegree(p.degreeInRashi)}</td>}
              <td>{p.house}</td>
              {hasDegrees && <td>{p.nakshatra}</td>}
              {hasDegrees && <td>{p.pada}</td>}
              <td>{p.aspects ? p.aspects.join(', ') : '–'}</td>
              <td>{p.vargottama ? 'Yes' : '–'}</td>
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
