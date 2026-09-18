import { useMemo, useState } from 'react';
import {
  NAKSHATRA_VEDHA_EFFECTS,
  NAKSHATRA_VEDHA_SEVERITY,
  RASHIS,
  computeGocharaVedha,
  computeSbcUpagrahas,
  computeTransitChart,
  personalNakshatraRoles,
} from '../lib/astro';
import {
  SARVATOBHADRA_BORDER_CELLS,
  SARVATOBHADRA_CENTER_CELL,
  SARVATOBHADRA_CORNER_CELLS,
  SARVATOBHADRA_GRID_SIZE,
  SARVATOBHADRA_RASHI_CELLS,
  PLANET_ABBR,
  sarvatobhadraQueenMoves,
  sarvatobhadraVedhaCells,
} from '../lib/chartLayout';

const CELL = 40;
const SIZE = SARVATOBHADRA_GRID_SIZE * CELL;

/**
 * The Sarvatobhadra Chakra ("all-auspicious wheel"): a live, transit-based
 * 9x9 grid - the 28 nakshatras (27 plus Abhijit) ring the border, the 12
 * rashis fill an inner diamond. Border cells always show which graha(s) are
 * transiting each nakshatra right now and which of this chart's own natal
 * points sit there ("N: ...").
 *
 * Everything else is behind the vedha mode selector, because all three
 * systems marked on the grid at once is more than anyone can read. Each mode
 * changes both what the grid marks and what the "Active right now" panel
 * reports:
 *   - Sun's Vedha: the eight Upagraha shadow points cast from the transiting
 *     Sun (see computeSbcUpagrahas)
 *   - Nakshatra Vedha: the three-ray piercing each transiting graha casts
 *     across the chakra (see sarvatobhadraVedhaCells)
 *   - Gochara Vedha: which favourable transits from the natal Moon are being
 *     blocked by their paired vedha house (see computeGocharaVedha)
 *
 * The Upagraha points and the vedha geometry are the same for everyone at a
 * given moment - what makes each panel personal is which of them land on
 * this chart's own natal points, so that is what each panel leads with.
 */
const borderCellByNakshatra = SARVATOBHADRA_BORDER_CELLS.reduce((map, c) => {
  map[c.nakshatra.trim()] = { row: c.row, col: c.col };
  return map;
}, {});

const VEDHA_MODES = [
  { id: 'sun', label: "Sun's Vedha" },
  { id: 'nakshatra', label: 'Nakshatra Vedha' },
  { id: 'gochara', label: 'Gochara Vedha' },
];

const MODE_NOTES = {
  sun: 'Shaded cells carry an Upagraha shadow point, counted forward from the transiting Sun’s nakshatra. They are the same for every chart at this moment, so the panel below leads with the ones landing on your own natal points.',
  nakshatra: 'Each transiting graha pierces three directions from its own nakshatra - straight across the chakra and the two diagonals. Shading shows how many rays cross a cell; the panel below reports only the piercings that reach your own natal points or your personal Janma, Karma and Vinasa stars.',
  gochara: 'A favourable transit counted from your natal Moon is cancelled when another graha sits in its paired vedha house. The inner diamond marks the rashi each affected graha occupies, and the panel says which good results are getting through and which are blocked.',
};

export default function SarvatobhadraChakra({ natalChart }) {
  const [now] = useState(() => new Date());
  const transit = useMemo(() => computeTransitChart(natalChart, now), [natalChart, now]);
  const [mode, setMode] = useState('sun');
  const [pickingCell, setPickingCell] = useState(false);
  const [manualCell, setManualCell] = useState(null);

  // Personalize by default: the "Queen" starts on this person's own Janma
  // Nakshatra (natal Moon) - the same personal anchor Tara Bala/Gochara use
  // elsewhere in the app - rather than an arbitrary fixed cell that would
  // look identical for every chart until someone manually clicked one.
  const natalMoon = natalChart.planets.find((p) => p.planet === 'Moon');
  const natalMoonNakshatra = natalMoon.nakshatra;
  const defaultCell = borderCellByNakshatra[natalMoonNakshatra.trim()] ?? null;
  const selectedCell = manualCell ?? defaultCell;
  const isDefaultSelection = !manualCell;

  // The Queen's-move highlight keeps its personalized default in Sun's Vedha
  // mode, where it has always been. In the two vedha modes it would fight
  // with their own shading for the same cells, so there it appears only once
  // the reader deliberately picks a cell.
  const showQueenMoves = mode === 'sun' || manualCell !== null;
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

  // Nakshatra vedha: cast each transiting graha's three rays and collect
  // which grahas pierce each cell of the grid.
  const nakshatraVedha = useMemo(() => {
    const piercersByCell = {};
    for (const p of transit.planets) {
      const from = borderCellByNakshatra[p.nakshatra.trim()];
      if (!from) continue;
      for (const key of sarvatobhadraVedhaCells(from.row, from.col)) {
        (piercersByCell[key] ??= []).push(p.planet);
      }
    }
    return piercersByCell;
  }, [transit]);

  const personalRoles = useMemo(
    () => personalNakshatraRoles(natalMoonNakshatra),
    [natalMoonNakshatra],
  );

  const gocharaVedha = useMemo(() => computeGocharaVedha(transit.planets), [transit]);

  // In Gochara mode the inner diamond does the talking: each affected graha's
  // own rashi is marked, and so is the rashi of the vedha house blocking it.
  const gocharaRashiMarks = useMemo(() => {
    // Several grahas can share a rashi, and a graha can sit in another's
    // vedha house, so a cell can be claimed more than once. The more pointed
    // reading wins rather than whichever graha happened to be processed last.
    const rank = { blocked: 3, clear: 2, blocker: 1 };
    const marks = {};
    const claim = (rashi, mark) => {
      if (!marks[rashi] || rank[mark] > rank[marks[rashi]]) marks[rashi] = mark;
    };
    for (const g of gocharaVedha) {
      claim(g.rashi, g.blocked ? 'blocked' : 'clear');
      if (g.blocked) claim((natalMoon.rashi + g.vedhaHouse - 1) % 12, 'blocker');
    }
    return marks;
  }, [gocharaVedha, natalMoon.rashi]);

  const gridLines = [];
  for (let i = 0; i <= SARVATOBHADRA_GRID_SIZE; i++) {
    gridLines.push(<line key={`h${i}`} x1={0} y1={i * CELL} x2={SIZE} y2={i * CELL} className="chart-outline" />);
    gridLines.push(<line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={SIZE} className="chart-outline" />);
  }

  return (
    <div className="sarvatobhadra-wrapper">
      <p className="sarvatobhadra-asof">As of {now.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>

      <div className="sarvatobhadra-mode-tabs" role="tablist" aria-label="Vedha system">
        {VEDHA_MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={mode === m.id ? 'active' : ''}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

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
        {!showQueenMoves
          ? "Queen's-move highlights are off in this mode until you pick a cell."
          : isDefaultSelection
            ? `Showing Queen's-move highlights from your Janma Nakshatra (Moon): ${natalMoonNakshatra.trim()}`
            : `Showing Queen's-move highlights from a manually selected cell`}
      </p>

      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={`chart-svg sarvatobhadra-svg${pickingCell ? ' sarvatobhadra-picking' : ''}`}
        role="img"
        aria-label="Sarvatobhadra Chakra"
      >
        {showQueenMoves && queenMoves &&
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
        {showQueenMoves && selectedCell && (
          <rect
            x={selectedCell.col * CELL} y={selectedCell.row * CELL} width={CELL} height={CELL}
            className="sarvatobhadra-selected-cell"
          />
        )}

        {mode === 'nakshatra' &&
          Object.entries(nakshatraVedha).map(([key, piercers]) => {
            const [r, c] = key.split(',').map(Number);
            const depth = Math.min(piercers.length, 3);
            return (
              <rect
                key={`vedha-${key}`}
                x={c * CELL} y={r * CELL} width={CELL} height={CELL}
                className={`sarvatobhadra-vedha sarvatobhadra-vedha-${depth}`}
              />
            );
          })}

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
          const tags = mode === 'sun' ? upagrahasByNakshatra[nakshatra] ?? [] : [];
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
          const gocharaMark = mode === 'gochara' ? gocharaRashiMarks[rashi] : undefined;
          return (
            <g key={rashi}>
              {isAscendant && <rect x={x} y={y} width={CELL} height={CELL} className="sarvatobhadra-lagna" />}
              {gocharaMark && (
                <rect
                  x={x} y={y} width={CELL} height={CELL}
                  className={`sarvatobhadra-gochara-mark sarvatobhadra-gochara-${gocharaMark}`}
                />
              )}
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

      {mode === 'sun' && (
        <SunVedhaPanel
          upagrahas={upagrahas}
          natalPointsByNakshatra={natalPointsByNakshatra}
          planetsByNakshatra={planetsByNakshatra}
        />
      )}
      {mode === 'nakshatra' && (
        <NakshatraVedhaPanel
          piercersByCell={nakshatraVedha}
          natalPointsByNakshatra={natalPointsByNakshatra}
          personalRoles={personalRoles}
        />
      )}
      {mode === 'gochara' && <GocharaVedhaPanel entries={gocharaVedha} />}

      <p className="sarvatobhadra-note">
        Border: the 28 nakshatras (27 plus Abhijit), showing which graha(s) transit each one right now
        (parentheses = retrograde) and which of your own natal points (&quot;N: ...&quot;) sit there.
        Inner diamond: the 12 rashis, with your Lagna highlighted. {MODE_NOTES[mode]} &quot;Highlight
        Select&quot; is separate from the vedha systems: it picks any cell and highlights every cell a
        chess Queen could reach from it (full row, column, and both diagonals), defaulting to your Janma
        Nakshatra (Moon). The border&apos;s starting point, the Upagraha calculation and the Queen&apos;s-move
        rule were verified against a reference Sarvatobhadra Chakra spreadsheet, and the vedha ray
        geometry against published worked examples; the inner diamond&apos;s rashi grouping remains a
        simplified, teaching-level layout rather than one classical text&apos;s exact cell placement,
        which varies by source.
      </p>
    </div>
  );
}

function SunVedhaPanel({ upagrahas, natalPointsByNakshatra, planetsByNakshatra }) {
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
}

function NakshatraVedhaPanel({ piercersByCell, natalPointsByNakshatra, personalRoles }) {
  // Every graha pierces three rays, so most of the grid is hit by something.
  // Only the piercings that land on one of this chart's own natal points, or
  // on its personal Janma/Karma/Vinasa stars, say anything individual - the
  // rest is the same picture for everyone and would just bury it.
  const hits = SARVATOBHADRA_BORDER_CELLS.map(({ row, col, nakshatra }) => {
    const name = nakshatra.trim();
    const piercers = piercersByCell[`${row},${col}`] ?? [];
    if (piercers.length === 0) return null;
    const natalPoints = natalPointsByNakshatra[nakshatra] ?? [];
    const role = personalRoles[name] ?? personalRoles[nakshatra];
    if (natalPoints.length === 0 && !role) return null;
    // Jupiter is the benefic exception - its piercing is read as helpful, so
    // it doesn't count towards how heavy the affliction is, and a point
    // pierced by Jupiter alone isn't an affliction at all.
    const afflicting = piercers.filter((p) => p !== 'Jupiter');
    return { name, piercers, afflicting, natalPoints, role };
  })
    .filter(Boolean)
    .sort((a, b) => b.afflicting.length - a.afflicting.length);

  if (hits.length === 0) {
    return (
      <div className="sarvatobhadra-upagraha-list">
        <p className="sarvatobhadra-upagraha-heading">Active right now:</p>
        <p className="sarvatobhadra-upagraha-item">
          Nothing is piercing your own natal points or your Janma, Karma and Vinasa stars at the
          moment. The shading on the grid is the general picture, which is the same for every chart.
        </p>
      </div>
    );
  }

  // One graha usually pierces several of these points at once, and repeating
  // its description on every line buries the part that differs. Each graha's
  // reading is spelled out the first time it appears and named only after.
  const explained = new Set();

  return (
    <div className="sarvatobhadra-upagraha-list">
      <p className="sarvatobhadra-upagraha-heading">Active right now:</p>
      {hits.map((h) => {
        const lead = h.afflicting[0] ?? h.piercers[0];
        const firstMention = !explained.has(lead);
        explained.add(lead);
        return (
          <p key={h.name} className="sarvatobhadra-upagraha-item sarvatobhadra-upagraha-item-natal">
            <strong>{h.name}</strong>
            {h.role && <> ({h.role.role} — {h.role.meaning})</>}
            {h.natalPoints.length > 0 && <> — your natal {h.natalPoints.join(', ')} sits here</>}
            {' '}— pierced by {h.piercers.join(', ')}.{' '}
            {h.afflicting.length > 0 &&
              `${NAKSHATRA_VEDHA_SEVERITY[Math.min(h.afflicting.length, NAKSHATRA_VEDHA_SEVERITY.length) - 1]} `}
            {firstMention && NAKSHATRA_VEDHA_EFFECTS[lead]}
          </p>
        );
      })}
    </div>
  );
}

function GocharaVedhaPanel({ entries }) {
  if (entries.length === 0) {
    return (
      <div className="sarvatobhadra-upagraha-list">
        <p className="sarvatobhadra-upagraha-heading">Active right now:</p>
        <p className="sarvatobhadra-upagraha-item">
          No graha is in one of its favourable houses from your natal Moon right now, so there is
          nothing for a vedha to block.
        </p>
      </div>
    );
  }

  // Blocked results are the ones worth knowing about: a good transit that
  // isn't actually landing. Ones getting through are listed after.
  const sorted = [...entries].sort((a, b) => (b.blocked ? 1 : 0) - (a.blocked ? 1 : 0));

  return (
    <div className="sarvatobhadra-upagraha-list">
      <p className="sarvatobhadra-upagraha-heading">Active right now:</p>
      {sorted.map((g) => (
        <p
          key={g.planet}
          className={g.blocked ? 'sarvatobhadra-upagraha-item sarvatobhadra-upagraha-item-natal' : 'sarvatobhadra-upagraha-item'}
        >
          <strong>{g.planet}</strong> is favourably placed in your {ordinal(g.houseFromMoon)} from the
          Moon.{' '}
          {g.blocked ? (
            <>Blocked — {g.blockedBy.join(', ')} {g.blockedBy.length > 1 ? 'sit' : 'sits'} in the{' '}
            {ordinal(g.vedhaHouse)}, its vedha point, so don&apos;t expect the good result to land.</>
          ) : (
            <>Getting through — nothing sits in the {ordinal(g.vedhaHouse)}, its vedha point.</>
          )}
        </p>
      ))}
    </div>
  );
}

function ordinal(n) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}
