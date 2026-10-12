import type { Letter } from "../types/game";
//stores 100 card distribution and scoring chart
export const LETTER_COUNTS: Record<Letter, number> = {
  A: 9,
  B: 2,
  C: 2,
  D: 4,
  E: 12,
  F: 2,
  G: 3,
  H: 3,
  I: 9,
  J: 1,
  K: 1,
  L: 4,
  M: 2,
  N: 6,
  O: 8,
  P: 2,
  Q: 2,
  R: 6,
  S: 6,
  T: 7,
  U: 4,
  V: 1,
  W: 2,
  X: 1,
  Y: 1,
  Z: 1,
};

export const LETTER_PHOTO_COUNTS: Record<Letter, number> = {
  A: 28,
  B: 21,
  C: 12,
  D: 17,
  E: 25,
  F: 12,
  G: 16,
  H: 14,
  I: 13,
  J: 7,
  K: 11,
  L: 11,
  M: 8,
  N: 15,
  O: 19,
  P: 10,
  Q: 1,
  R: 21,
  S: 27,
  T: 22,
  U: 15,
  V: 11,
  W: 8,
  X: 5,
  Y: 8,
  Z: 6,
};

export const WORD_LENGTH_SCORES: Record<number, number> = {
  3: 30,
  4: 50,
  5: 80,
  6: 120,
  7: 170,
  8: 220,
  9: 270,
  10: 320,
};

export function getWordScore(length: number): number {
  if (length <= 10) {
    return WORD_LENGTH_SCORES[length] || 0;
  }
  // For words longer than 10 letters: base 320 + 50 per extra letter
  return 320 + (length - 10) * 50;
}
