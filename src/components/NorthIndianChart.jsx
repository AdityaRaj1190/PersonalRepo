import { layoutPlanetGrid, NORTH_INDIAN_HOUSE_SHAPES } from '../lib/chartLayout';
import PlanetGlyphs from './PlanetGlyphs';

const OUTER = [[0, 0], [300, 0], [300, 300], [0, 300]];
const DIAMOND = [[150, 0], [300, 150], [150, 300], [0, 150]];

function toPointsAttr(points) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

export default function NorthIndianChart({ chart }) {
  const planetsByHouse = {};
  for (const p of chart.planets) {
    (planetsByHouse[p.house] ??= []).push(p);
  }

  return (
    <svg viewBox="0 0 300 300" className="chart-svg" role="img" aria-label="North Indian birth chart">
      <polygon points={toPointsAttr(OUTER)} className="chart-outline" />
      <polygon points={toPointsAttr(DIAMOND)} className="chart-outline" />
      <line x1={0} y1={0} x2={300} y2={300} className="chart-outline" />
      <line x1={300} y1={0} x2={0} y2={300} className="chart-outline" />

      {Object.entries(NORTH_INDIAN_HOUSE_SHAPES).map(([houseStr, shape]) => {
        const house = Number(houseStr);
        const rashiNumber = ((chart.ascendant.rashi + house - 1) % 12) + 1;
        const [lx, ly] = shape.labelAt;
        const planets = planetsByHouse[house] ?? [];

        return (
          <g key={house} className="chart-house">
            <text x={lx} y={ly} className="chart-rashi-number" textAnchor="middle">
              {rashiNumber}
            </text>
            {house === 1 && (
              <text x={lx} y={ly + 13} className="chart-asc-label" textAnchor="middle">
                Asc
              </text>
            )}
            {(() => {
              const grid = layoutPlanetGrid(planets.length);
              const startY = ly + (house === 1 ? 26 : 13);
              return planets.map((p, i) => {
                const { col, row, compact } = grid[i];
                const colOffset = compact ? (col === 0 ? -11 : 11) : 0;
                const rowSpacing = compact ? 10 : 12;
                return (
                  <text
                    key={p.planet}
                    x={lx + colOffset}
                    y={startY + row * rowSpacing}
                    className={compact ? 'chart-planet chart-planet-compact' : 'chart-planet'}
                    textAnchor="middle"
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
