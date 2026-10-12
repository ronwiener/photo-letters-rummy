/**
 * Point Value Chart:
 * 3 letters = 30 pts
 * 4 letters = 50 pts
 * 5 letters = 80 pts
 * 6 letters = 120 pts
 * 7 letters = 170 pts
 * 8 letters = 220 pts
 * 9 letters = 270 pts
 * 10 letters = 320 pts
 * Each additional letter = +50 pts
 */
export function calculateWordPoints(length: number): number {
  if (length < 3) return 0;
  const pointTable: Record<number, number> = {
    3: 30,
    4: 50,
    5: 80,
    6: 120,
    7: 170,
    8: 220,
    9: 270,
    10: 320,
  };

  if (length in pointTable) return pointTable[length];
  return 320 + (length - 10) * 50;
}

/**
 * Calculates score difference for extensions/rearrangements
 */
export function calculateExtensionPoints(
  originalLength: number,
  newLength: number,
): number {
  const originalScore = calculateWordPoints(originalLength);
  const newScore = calculateWordPoints(newLength);
  return Math.max(0, newScore - originalScore);
}

/**
 * Calculates penalty deductions for leftover hand cards at the end of a round.
 * Standard (A, E, I, O, U, T, N, S): -5 pts
 * Medium (B, C, D, F, G, H, L, M, P, R): -10 pts
 * High/Rare (J, K, Q, V, W, X, Y, Z): -20 pts
 */
export function calculateHandPenalty(hand: { letter: string }[]): number {
  const standardLetters = new Set(["A", "E", "I", "O", "U", "T", "N", "S"]);
  const highLetters = new Set(["J", "K", "Q", "V", "W", "X", "Y", "Z"]);

  return hand.reduce((totalPenalty, card) => {
    const letter = card.letter.toUpperCase();
    if (standardLetters.has(letter)) return totalPenalty + 5;
    if (highLetters.has(letter)) return totalPenalty + 20;
    return totalPenalty + 10; // Medium letters
  }, 0);
}
