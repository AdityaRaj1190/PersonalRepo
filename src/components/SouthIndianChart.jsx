import { RASHIS } from '../lib/astro';
import { SOUTH_INDIAN_RASHI_CELLS } from '../lib/chartLayout';
import PlanetGlyphs from './PlanetGlyphs';

const CELL = 75; // 300 / 4

export default function SouthIndianChart({ chart }) {
  const planetsByRashi = {};
  for (const p of chart.planets) {
    (planetsByRashi[p.rashi] ??= []).push(p);
  }

  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    gridLines.push(<line key={`h${i}`} x1={0} y1={i * CELL} x2={300} y2={i * CELL} className="chart-outline" />);
    gridLines.push(<line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={300} className="chart-outline" />);
  }

  return (
    <svg viewBox="0 0 300 300" className="chart-svg" role="img" aria-label="South Indian birth chart">
      {gridLines}
      <text x={150} y={150} textAnchor="middle" className="chart-center-label">
        {chart.ascendant.rashiName} Lagna
      </text>

      {RASHIS.map((rashiName, rashiIndex) => {
        const [row, col] = SOUTH_INDIAN_RASHI_CELLS[rashiIndex];
        const x = col * CELL;
        const y = row * CELL;
        const isAscendant = rashiIndex === chart.ascendant.rashi;
        const planets = planetsByRashi[rashiIndex] ?? [];

        return (
          <g key={rashiName} className="chart-house">
            <text x={x + 6} y={y + 14} className="chart-rashi-number">
              {rashiName.slice(0, 3)}
            </text>
            {isAscendant && (
              <line
                x1={x + 4} y1={y + CELL - 4}
                x2={x + CELL - 4} y2={y + 4}
                className="chart-asc-marker"
              />
            )}
            {planets.map((p, i) => (
              <text
                key={p.planet}
                x={x + CELL / 2}
                y={y + 32 + i * 14}
                textAnchor="middle"
                className="chart-planet"
              >
                <PlanetGlyphs planet={p} />
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
