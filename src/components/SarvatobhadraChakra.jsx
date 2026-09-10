import { RASHIS } from '../lib/astro';
import {
  SARVATOBHADRA_BORDER_CELLS,
  SARVATOBHADRA_CENTER_CELL,
  SARVATOBHADRA_CORNER_CELLS,
  SARVATOBHADRA_GRID_SIZE,
  SARVATOBHADRA_RASHI_CELLS,
  PLANET_ABBR,
} from '../lib/chartLayout';

const CELL = 40;
const SIZE = SARVATOBHADRA_GRID_SIZE * CELL;

/**
 * The Sarvatobhadra Chakra ("all-auspicious wheel"): a 9x9 grid with the 28
 * nakshatras (27 plus Abhijit) ringing the border and the 12 rashis set in
 * an inner diamond. Overlays the natal chart's grahas onto their birth
 * nakshatra cell and highlights the Janma (Moon) nakshatra and the Lagna
 * rashi, so the static layout doubles as a read of this particular chart.
 */
export default function SarvatobhadraChakra({ natalChart }) {
  const planetsByNakshatra = {};
  for (const p of natalChart.planets) {
    (planetsByNakshatra[p.nakshatra] ??= []).push(p.planet);
  }
  const janmaNakshatra = natalChart.planets.find((p) => p.planet === 'Moon').nakshatra;

  const gridLines = [];
  for (let i = 0; i <= SARVATOBHADRA_GRID_SIZE; i++) {
    gridLines.push(<line key={`h${i}`} x1={0} y1={i * CELL} x2={SIZE} y2={i * CELL} className="chart-outline" />);
    gridLines.push(<line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={SIZE} className="chart-outline" />);
  }

  return (
    <div className="sarvatobhadra-wrapper">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="chart-svg sarvatobhadra-svg" role="img" aria-label="Sarvatobhadra Chakra">
        {gridLines}

        {SARVATOBHADRA_CORNER_CELLS.map(([row, col]) => (
          <rect
            key={`corner-${row}-${col}`}
            x={col * CELL} y={row * CELL} width={CELL} height={CELL}
            className="sarvatobhadra-corner"
          />
        ))}

        {SARVATOBHADRA_BORDER_CELLS.map(({ row, col, nakshatra }) => {
          const x = col * CELL;
          const y = row * CELL;
          const planets = planetsByNakshatra[nakshatra] ?? [];
          const isJanma = nakshatra === janmaNakshatra;
          return (
            <g key={nakshatra}>
              {isJanma && <rect x={x} y={y} width={CELL} height={CELL} className="sarvatobhadra-janma" />}
              <text x={x + CELL / 2} y={y + 13} textAnchor="middle" className="sarvatobhadra-nakshatra-label">
                {nakshatra.slice(0, 4)}
              </text>
              {planets.length > 0 && (
                <text x={x + CELL / 2} y={y + 30} textAnchor="middle" className="chart-planet">
                  {planets.map((p) => PLANET_ABBR[p]).join(' ')}
                </text>
              )}
            </g>
          );
        })}

        {SARVATOBHADRA_RASHI_CELLS.map(({ row, col, rashi }) => {
          const x = col * CELL;
          const y = row * CELL;
          const isAscendant = rashi === natalChart.ascendant.rashi;
          return (
            <g key={rashi}>
              {isAscendant && <rect x={x} y={y} width={CELL} height={CELL} className="sarvatobhadra-lagna" />}
              <text x={x + CELL / 2} y={y + CELL / 2 + 4} textAnchor="middle" className="sarvatobhadra-rashi-label">
                {RASHIS[rashi].slice(0, 3)}
              </text>
            </g>
          );
        })}

        <rect
          x={SARVATOBHADRA_CENTER_CELL.col * CELL}
          y={SARVATOBHADRA_CENTER_CELL.row * CELL}
          width={CELL} height={CELL}
          className="sarvatobhadra-center"
        />
      </svg>

      <p className="sarvatobhadra-note">
        Border: the 28 nakshatras (27 plus Abhijit), with your Janma (Moon) nakshatra highlighted.
        Inner diamond: the 12 rashis, with your Lagna highlighted. This is a simplified,
        teaching-level layout rather than a reproduction of any one classical text's exact
        cell placement, which varies by source.
      </p>
    </div>
  );
}
