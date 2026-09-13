import { useMemo, useState } from 'react';
import { RASHIS, computeSbcUpagrahas, computeTransitChart } from '../lib/astro';
import {
  SARVATOBHADRA_BORDER_CELLS,
  SARVATOBHADRA_CENTER_CELL,
  SARVATOBHADRA_CORNER_CELLS,
  SARVATOBHADRA_GRID_SIZE,
  SARVATOBHADRA_RASHI_CELLS,
  PLANET_ABBR,
  sarvatobhadraQueenMoves,
} from '../lib/chartLayout';

const CELL = 40;
const SIZE = SARVATOBHADRA_GRID_SIZE * CELL;

/**
 * The Sarvatobhadra Chakra ("all-auspicious wheel"): a live, transit-based
 * 9x9 grid - the 28 nakshatras (27 plus Abhijit) ring the border, the 12
 * rashis fill an inner diamond. Border cells show which graha(s) are
 * transiting each nakshatra right now ("N: ..." marks this chart's own
 * natal points there), plus any Upagraha dosha tag that currently lands
 * there (see computeSbcUpagrahas) - those tags are the same for everyone at
 * a given moment (they're computed from the transiting Sun alone), so the
 * "Active right now" panel below flags which ones actually touch *this*
 * chart's natal points as the personally relevant ones. The Lagna rashi is
 * highlighted in the inner diamond as a fixed personal reference point.
 */
const borderCellByNakshatra = SARVATOBHADRA_BORDER_CELLS.reduce((map, c) => {
  map[c.nakshatra.trim()] = { row: c.row, col: c.col };
  return map;
}, {});

export default function SarvatobhadraChakra({ natalChart }) {
  const [now] = useState(() => new Date());
  const transit = useMemo(() => computeTransitChart(natalChart, now), [natalChart, now]);
  const [pickingCell, setPickingCell] = useState(false);
  const [manualCell, setManualCell] = useState(null);

  // Personalize by default: the "Queen" starts on this person's own Janma
  // Nakshatra (natal Moon) - the same personal anchor Tara Bala/Gochara use
  // elsewhere in the app - rather than an arbitrary fixed cell that would
  // look identical for every chart until someone manually clicked one.
  const natalMoonNakshatra = natalChart.planets.find((p) => p.planet === 'Moon').nakshatra;
  const defaultCell = borderCellByNakshatra[natalMoonNakshatra.trim()] ?? null;
  const selectedCell = manualCell ?? defaultCell;
  const isDefaultSelection = !manualCell;

  const queenMoves = useMemo(
    () => (selectedCell ? sarvatobhadraQueenMoves(selectedCell.row, selectedCell.col) : null),
    [selectedCell],
  );

  function handleCellClick(row, col) {
    if (!pickingCell) return;
    setManualCell({ row, col });
    setPickingCell(false);
  }

  const planetsByNakshatra = {};
  for (const p of transit.planets) {
    (planetsByNakshatra[p.nakshatra] ??= []).push(p);
  }

  const transitSun = transit.planets.find((p) => p.planet === 'Sun');
  const upagrahas = useMemo(() => computeSbcUpagrahas(transitSun.longitude), [transitSun.longitude]);
  const upagrahasByNakshatra = {};
  for (const u of upagrahas) {
    (upagrahasByNakshatra[u.nakshatra] ??= []).push(u);
  }

  // The Upagraha points themselves are the same for everyone at a given
  // moment (they're computed from the transiting Sun alone) - what makes a
  // hit personally relevant is whether *this chart's own* natal points
  // (Ascendant, or any natal graha) happen to sit in one of those currently
  // afflicted nakshatras, so that's tracked separately from which grahas
  // are merely transiting through.
  const natalPointsByNakshatra = {};
  for (const p of natalChart.planets) {
    (natalPointsByNakshatra[p.nakshatra] ??= []).push(p.planet);
  }
  (natalPointsByNakshatra[natalChart.ascendant.nakshatra] ??= []).push('Ascendant');

  const gridLines = [];
  for (let i = 0; i <= SARVATOBHADRA_GRID_SIZE; i++) {
    gridLines.push(<line key={`h${i}`} x1={0} y1={i * CELL} x2={SIZE} y2={i * CELL} className="chart-outline" />);
    gridLines.push(<line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={SIZE} className="chart-outline" />);
  }

  return (
    <div className="sarvatobhadra-wrapper">
      <p className="sarvatobhadra-asof">As of {now.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>

      <div className="sarvatobhadra-highlight-controls">
        <button
          type="button"
          className={pickingCell ? 'active' : ''}
          onClick={() => setPickingCell((v) => !v)}
        >
          {pickingCell ? 'Click a cell…' : 'Highlight Select'}
        </button>
        <button type="button" onClick={() => { setManualCell(null); setPickingCell(false); }}>
          Clear Selection
        </button>
      </div>

      <p className="sarvatobhadra-selection-label">
        {isDefaultSelection
          ? `Showing Queen's-move highlights from your Janma Nakshatra (Moon): ${natalMoonNakshatra.trim()}`
          : `Showing Queen's-move highlights from a manually selected cell`}
      </p>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={`chart-svg sarvatobhadra-svg${pickingCell ? ' sarvatobhadra-picking' : ''}`}
        role="img"
        aria-label="Sarvatobhadra Chakra"
      >
        {queenMoves &&
          [...queenMoves].map((k) => {
            const [r, c] = k.split(',').map(Number);
            return (
              <rect
                key={`qm-${k}`}
                x={c * CELL} y={r * CELL} width={CELL} height={CELL}
                className="sarvatobhadra-queen-move"
              />
            );
          })}
        {selectedCell && (
          <rect
            x={selectedCell.col * CELL} y={selectedCell.row * CELL} width={CELL} height={CELL}
            className="sarvatobhadra-selected-cell"
          />
        )}

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
          const natalPoints = natalPointsByNakshatra[nakshatra] ?? [];
          const tags = upagrahasByNakshatra[nakshatra] ?? [];
          return (
            <g key={nakshatra}>
              {tags.length > 0 && <rect x={x} y={y} width={CELL} height={CELL} className="sarvatobhadra-upagraha" />}
              <text x={x + CELL / 2} y={y + 12} textAnchor="middle" className="sarvatobhadra-nakshatra-label">
                {nakshatra.slice(0, 4)}
              </text>
              {planets.length > 0 && (
                <text x={x + CELL / 2} y={y + 24} textAnchor="middle" className="chart-planet">
                  {planets.map((p) => (p.retrograde ? `(${PLANET_ABBR[p.planet]})` : PLANET_ABBR[p.planet])).join(' ')}
                </text>
              )}
              {natalPoints.length > 0 && (
                <text x={x + CELL / 2} y={y + 35} textAnchor="middle" className="sarvatobhadra-natal-label">
                  N: {natalPoints.map((p) => PLANET_ABBR[p] ?? 'As').join(' ')}
                </text>
              )}
              {tags.length > 0 && (
                <text x={x + CELL / 2} y={y + (natalPoints.length > 0 ? 46 : 35)} textAnchor="middle" className="sarvatobhadra-tag-label">
                  {tags.map((t) => `~${t.tag}`).join(' ')}
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

        {pickingCell &&
          Array.from({ length: SARVATOBHADRA_GRID_SIZE * SARVATOBHADRA_GRID_SIZE }, (_, i) => {
            const row = Math.floor(i / SARVATOBHADRA_GRID_SIZE);
            const col = i % SARVATOBHADRA_GRID_SIZE;
            return (
              <rect
                key={`pick-${row}-${col}`}
                x={col * CELL} y={row * CELL} width={CELL} height={CELL}
                className="sarvatobhadra-pick-target"
                onClick={() => handleCellClick(row, col)}
              />
            );
          })}
      </svg>

      {pickingCell && <p className="sarvatobhadra-picking-hint">Click any cell in the grid above.</p>}

      {(() => {
        const active = upagrahas
          .map((u) => ({
            ...u,
            hitsNatal: natalPointsByNakshatra[u.nakshatra] ?? null,
            hitsTransit: planetsByNakshatra[u.nakshatra] ?? null,
          }))
          .filter((u) => u.hitsNatal || u.hitsTransit)
          // Natal hits are the personally relevant ones (this chart's own
          // Ascendant/grahas sitting in an afflicted nakshatra); a bare
          // transiting graha with no natal connection is the same for
          // everyone right now, so it's listed after, not first.
          .sort((a, b) => (b.hitsNatal ? 1 : 0) - (a.hitsNatal ? 1 : 0));

        if (active.length === 0) return null;

        return (
          <div className="sarvatobhadra-upagraha-list">
            <p className="sarvatobhadra-upagraha-heading">Active right now:</p>
            {active.map((u) => (
              <p key={u.tag} className={u.hitsNatal ? 'sarvatobhadra-upagraha-item sarvatobhadra-upagraha-item-natal' : 'sarvatobhadra-upagraha-item'}>
                <strong>~{u.tag}</strong> ({u.label}) on {u.nakshatra.trim()}
                {u.hitsNatal && <> — touches your natal {u.hitsNatal.join(', ')}</>}
                {u.hitsNatal && u.hitsTransit && <>, and</>}
                {u.hitsTransit && <> transiting {u.hitsTransit.map((p) => p.planet).join(', ')} is here too</>}
                {' '}— {u.caution}
              </p>
            ))}
          </div>
        );
      })()}

      <p className="sarvatobhadra-note">
        Border: the 28 nakshatras (27 plus Abhijit), showing which graha(s) transit each one right now
        (parentheses = retrograde) and which of your own natal points ("N: ...") sit there, plus any
        active Upagraha dosha tag. The Upagraha tags themselves are the same for every chart at a given
        moment - the &quot;Active right now&quot; panel below highlights the ones that actually touch
        your own natal points as the personally relevant hits, listed ahead of ones only a transiting
        graha happens to share. Inner diamond: the 12 rashis, with your Lagna highlighted.
        &quot;Highlight Select&quot; picks any cell and highlights every cell reachable by a chess
        Queen&apos;s move (full row, column, and both diagonals) from it - defaulting to your Janma
        Nakshatra (Moon) - a technique some Sarvatobhadra Chakra tools use to spot alignments. The
        border's starting point, the Upagraha calculation, and the Queen's-move rule were all verified
        against a reference Sarvatobhadra Chakra spreadsheet; the inner diamond's rashi grouping remains
        a simplified, teaching-level layout rather than one classical text's exact cell placement, which
        varies by source.
      </p>
    </div>
  );
}
