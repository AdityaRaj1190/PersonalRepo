import { formatDegree } from '../lib/format';

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
          </tr>
        </thead>
        <tbody>
          {chart.planets.map((p) => (
            <tr key={p.planet}>
              <td>{p.planet}{p.retrograde ? ' (R)' : ''}</td>
              <td>{p.rashiName}</td>
              <td>{formatDegree(p.degreeInRashi)}</td>
              <td>{p.house}</td>
              <td>{p.nakshatra}</td>
              <td>{p.pada}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
