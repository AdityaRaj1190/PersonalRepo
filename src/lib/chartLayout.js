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
 * of the inner diamond; houses proceed clockwise from there.
 */
export const NORTH_INDIAN_HOUSE_SHAPES = {
  1: { points: [[150, 0], [225, 75], [150, 150], [75, 75]], labelAt: [150, 68] },
  2: { points: [[150, 0], [300, 0], [225, 75]], labelAt: [225, 22] },
  3: { points: [[300, 0], [300, 150], [225, 75]], labelAt: [270, 75] },
  4: { points: [[300, 150], [225, 75], [150, 150], [225, 225]], labelAt: [225, 143] },
  5: { points: [[300, 150], [300, 300], [225, 225]], labelAt: [270, 225] },
  6: { points: [[300, 300], [150, 300], [225, 225]], labelAt: [225, 248] },
  7: { points: [[150, 300], [225, 225], [150, 150], [75, 225]], labelAt: [150, 218] },
  8: { points: [[150, 300], [0, 300], [75, 225]], labelAt: [75, 248] },
  9: { points: [[0, 300], [0, 150], [75, 225]], labelAt: [30, 225] },
  10: { points: [[0, 150], [75, 225], [150, 150], [75, 75]], labelAt: [75, 143] },
  11: { points: [[0, 150], [0, 0], [75, 75]], labelAt: [30, 75] },
  12: { points: [[0, 0], [150, 0], [75, 75]], labelAt: [75, 22] },
};

/** Fixed grid position for each rashi (0=Aries..11=Pisces) in South Indian layout. */
export const SOUTH_INDIAN_RASHI_CELLS = {
  11: [0, 0], 0: [0, 1], 1: [0, 2], 2: [0, 3],
  10: [1, 0], 3: [1, 3],
  9: [2, 0], 4: [2, 3],
  8: [3, 0], 7: [3, 1], 6: [3, 2], 5: [3, 3],
};
