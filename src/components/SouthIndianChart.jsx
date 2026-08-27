import { RASHIS } from '../lib/astro';
import { layoutPlanetGrid, SOUTH_INDIAN_RASHI_CELLS, VARGA_NAMES } from '../lib/chartLayout';
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

  const vargaName = VARGA_NAMES[chart.varga];

  return (
    <svg viewBox="0 0 300 300" className="chart-svg" role="img" aria-label="Square shaped birth chart">
      {gridLines}
      {vargaName && (
        <text x={150} y={138} textAnchor="middle" className="chart-center-varga-label">
          {vargaName}
        </text>
      )}
      <text x={150} y={158} textAnchor="middle" className="chart-center-label">
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
              {rashiIndex + 1}({rashiName.slice(0, 3)})
            </text>
            {isAscendant && (
              <line
                x1={x + CELL - 18} y1={y}
                x2={x + CELL} y2={y + 18}
                className="chart-asc-marker"
              />
            )}
            {(() => {
              const grid = layoutPlanetGrid(planets.length);
              return planets.map((p, i) => {
                const { col, row, compact } = grid[i];
                const colOffset = compact ? (col === 0 ? -15 : 15) : 0;
                const rowSpacing = compact ? 11 : 14;
                return (
                  <text
                    key={p.planet}
                    x={x + CELL / 2 + colOffset}
                    y={y + 30 + row * rowSpacing}
                    textAnchor="middle"
                    className={compact ? 'chart-planet chart-planet-compact' : 'chart-planet'}
                  >
                    <PlanetGlyphs planet={p} />
                  </text>
                );
              });
            })()}
          </g>
        );
      })}
    </svg>
  );
}
