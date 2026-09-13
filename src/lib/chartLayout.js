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
