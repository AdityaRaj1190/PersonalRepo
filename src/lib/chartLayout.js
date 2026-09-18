/**
 * Position a house/rashi cell's planet list so it doesn't overflow into
 * neighboring cells: up to `maxSingleColumn` planets stack in a single
 * column, beyond that they wrap into two columns (compact, smaller font).
 * @param {number} count
 * @param {number} [maxSingleColumn] - lower for cramped cells (e.g. the
 *   North Indian chart's triangular houses have far less room than its
 *   diamond ones)
 * @returns {Array<{col: number, row: number, compact: boolean}>}
 */
export function layoutPlanetGrid(count, maxSingleColumn = 4) {
  const cols = count > maxSingleColumn ? 2 : 1;
  return Array.from({ length: count }, (_, i) => ({
    col: i % cols,
    row: Math.floor(i / cols),
    compact: cols > 1,
  }));
}

export const VARGA_NAMES = {
  2: 'Hora',
  3: 'Drekkana',
  9: 'Navamsa',
  10: 'Dashamsha',
};

export const PLANET_ABBR = {
  Sun: 'Su',
  Moon: 'Mo',
  Mars: 'Ma',
  Mercury: 'Me',
  Jupiter: 'Ju',
  Venus: 'Ve',
  Saturn: 'Sa',
  Rahu: 'Ra',
  Ketu: 'Ke',
};

/**
 * Fixed polygon for each house (1-12) in the classic North Indian diamond
 * layout, in a 300x300 SVG coordinate space. House 1 sits at the top point
 * of the inner diamond; houses proceed counter-clockwise from there (house
 * 2 at top-left, house 12 at top-right) - verified against a reference
 * North Indian chart rather than assumed.
 */
export const NORTH_INDIAN_HOUSE_SHAPES = {
  1: { points: [[150, 0], [75, 75], [150, 150], [225, 75]], labelAt: [150, 68] },
  2: { points: [[150, 0], [0, 0], [75, 75]], labelAt: [75, 22] },
  3: { points: [[0, 0], [0, 150], [75, 75]], labelAt: [30, 75] },
  4: { points: [[0, 150], [75, 75], [150, 150], [75, 225]], labelAt: [75, 143] },
  5: { points: [[0, 150], [0, 300], [75, 225]], labelAt: [30, 225] },
  6: { points: [[0, 300], [150, 300], [75, 225]], labelAt: [75, 248] },
  7: { points: [[150, 300], [75, 225], [150, 150], [225, 225]], labelAt: [150, 218] },
  8: { points: [[150, 300], [300, 300], [225, 225]], labelAt: [225, 248] },
  9: { points: [[300, 300], [300, 150], [225, 225]], labelAt: [270, 225] },
  10: { points: [[300, 150], [225, 225], [150, 150], [225, 75]], labelAt: [225, 143] },
  11: { points: [[300, 150], [300, 0], [225, 75]], labelAt: [270, 75] },
  12: { points: [[300, 0], [150, 0], [225, 75]], labelAt: [225, 22] },
};

/** Fixed grid position for each rashi (0=Aries..11=Pisces) in South Indian layout. */
export const SOUTH_INDIAN_RASHI_CELLS = {
  11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3],
  10: [1, 0], 3: [1, 3],
  9: [2, 0], 4: [2, 3],
  8: [3, 0], 7: [3, 1], 6: [3, 2], 5: [3, 3],
};

/**
 * Sarvatobhadra Chakra: a 9x9 grid whose 28-cell outer border holds the 27
 * nakshatras plus Abhijit (inserted between Uttara Ashadha and Shravana, its
 * classical position), and whose inner diamond (the two diagonals of the
 * inner 7x7, minus the shared center cell) holds the 12 rashis. The border's
 * starting point (Krittika, not Ashwini) and traversal direction were
 * verified against a reference Sarvatobhadra Chakra spreadsheet rather than
 * assumed. The inner diamond's rashi grouping is still a simplified,
 * teaching-level layout (rashis grouped in four 3-sign arms) rather than a
 * reproduction of any one classical text's exact cell-by-cell placement,
 * which varies by source.
 */
export const SARVATOBHADRA_GRID_SIZE = 9;

export const SARVATOBHADRA_BORDER_NAKSHATRAS = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu',
  'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra',
  'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha',
  'Abhijit', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

// The verified reference layout starts its border traversal at Krittika
// (index 2 of the list above), not Ashwini.
const SARVATOBHADRA_BORDER_START_INDEX = 2;

function sarvatobhadraBorderPath() {
  const cells = [];
  for (let c = 1; c <= 7; c++) cells.push([0, c]);
  for (let r = 1; r <= 7; r++) cells.push([r, 8]);
  for (let c = 7; c >= 1; c--) cells.push([8, c]);
  for (let r = 7; r >= 1; r--) cells.push([r, 0]);
  return cells;
}

export const SARVATOBHADRA_BORDER_CELLS = sarvatobhadraBorderPath().map(([row, col], i) => ({
  row,
  col,
  nakshatra: SARVATOBHADRA_BORDER_NAKSHATRAS[(i + SARVATOBHADRA_BORDER_START_INDEX) % 28],
}));

export const SARVATOBHADRA_CORNER_CELLS = [[0, 0], [0, 8], [8, 8], [8, 0]];

const SARVATOBHADRA_RASHI_ARMS = [
  { cells: [[1, 1], [2, 2], [3, 3]], rashis: [0, 1, 2] }, // Aries, Taurus, Gemini (NW)
  { cells: [[1, 7], [2, 6], [3, 5]], rashis: [3, 4, 5] }, // Cancer, Leo, Virgo (NE)
  { cells: [[7, 7], [6, 6], [5, 5]], rashis: [6, 7, 8] }, // Libra, Scorpio, Sagittarius (SE)
  { cells: [[7, 1], [6, 2], [5, 3]], rashis: [9, 10, 11] }, // Capricorn, Aquarius, Pisces (SW)
];

export const SARVATOBHADRA_RASHI_CELLS = SARVATOBHADRA_RASHI_ARMS.flatMap(({ cells, rashis }) =>
  cells.map(([row, col], i) => ({ row, col, rashi: rashis[i] })),
);

export const SARVATOBHADRA_CENTER_CELL = { row: 4, col: 4 };

/**
 * Sarvatobhadra Chakra "Highlight Select": treats the 9x9 grid as a chess
 * board and highlights every cell reachable by a Queen's move (full row,
 * full column, both diagonals) from a selected cell - a technique the
 * reference spreadsheet's `HighlightQueenMoves()` macro implements. Ported
 * directly from that macro rather than guessed from a screenshot: the full
 * row is skipped if the selection itself sits on the outer border row (row
 * 0 or 8, 0-indexed here), and likewise the full column is skipped if the
 * selection sits on the outer border column - the diagonals still apply
 * either way.
 * @param {number} row - 0-indexed row of the selected cell
 * @param {number} col - 0-indexed column of the selected cell
 * @returns {Set<string>} cell keys ("row,col") reachable by the Queen, excluding the selected cell itself
 */
export function sarvatobhadraQueenMoves(row, col) {
  const last = SARVATOBHADRA_GRID_SIZE - 1;
  const key = (r, c) => `${r},${c}`;
  const cells = new Set();

  if (row !== 0 && row !== last) {
    for (let c = 0; c <= last; c++) cells.add(key(row, c));
  }
  if (col !== 0 && col !== last) {
    for (let r = 0; r <= last; r++) cells.add(key(r, col));
  }
  for (let d = -last; d <= last; d++) {
    if (d === 0) continue;
    const r = row + d;
    if (r < 0 || r > last) continue;
    const c1 = col - d;
    if (c1 >= 0 && c1 <= last) cells.add(key(r, c1));
    const c2 = col + d;
    if (c2 >= 0 && c2 <= last) cells.add(key(r, c2));
  }
  cells.delete(key(row, col));
  return cells;
}

/**
 * Sarvatobhadra Chakra nakshatra vedha ("piercing") rays. A graha sitting in
 * a border nakshatra is classically said to pierce three directions at once:
 * straight across the chakra ("front"), and the two 45-degree diagonals to
 * its left and right. Every occupied cell those three rays pass through is
 * pierced - other nakshatras on the far border, and the rashis of the inner
 * diamond.
 *
 * The rays are cast inward from whichever edge the cell sits on, so the
 * inward direction is derived from the cell's own position rather than
 * hardcoded per edge.
 *
 * Verified against the two worked examples published for this system:
 * Krittika pierces Bharani, Shravana and Vishakha, and Rohini pierces
 * Ashwini, Abhijit and Swati - both reproduce exactly. (Those sources also
 * name rashis for each example; ours differ by one arm position, because
 * this chakra's inner diamond follows the reference spreadsheet's rashi
 * grouping rather than theirs. Sources disagree on that placement, so the
 * nakshatra-level result is the part to trust here.)
 *
 * Not modelled: the motion-based variants some texts add, where a graha in
 * fast motion pierces left and a retrograde one pierces backward instead of
 * front. Sources vary on those and they would change which cells are hit,
 * so this keeps the single, commonly-taught three-ray rule.
 *
 * @param {number} row - 0-indexed row of the piercing graha's border cell
 * @param {number} col - 0-indexed column of that cell
 * @returns {Set<string>} cell keys ("row,col") the three rays pass through
 */
export function sarvatobhadraVedhaCells(row, col) {
  const last = SARVATOBHADRA_GRID_SIZE - 1;
  const cells = new Set();

  // Inward-pointing unit vector for the edge this cell sits on.
  let dr = 0;
  let dc = 0;
  if (row === 0) dr = 1;
  else if (row === last) dr = -1;
  else if (col === 0) dc = 1;
  else if (col === last) dc = -1;
  else return cells; // not a border cell: nothing to cast

  // The front ray plus its two 45-degree neighbours. Rotating the inward
  // vector by -45 and +45 degrees on the grid is just adding the
  // perpendicular component to it.
  const rays = [
    [dr, dc],
    [dr + dc, dc + dr],
    [dr - dc, dc - dr],
  ];

  for (const [sr, sc] of rays) {
    if (sr === 0 && sc === 0) continue;
    let r = row + sr;
    let c = col + sc;
    while (r >= 0 && r <= last && c >= 0 && c <= last) {
      cells.add(`${r},${c}`);
      r += sr;
      c += sc;
    }
  }
  return cells;
}
