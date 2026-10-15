import type { Letter } from "../types/game";

export type AssetKey = Letter | "WILD";

export const LETTER_COUNTS: Record<AssetKey, number> = {
  A: 8,
  B: 2,
  C: 2,
  D: 4,
  E: 11,
  F: 2,
  G: 3,
  H: 2,
  I: 9,
  J: 1,
  K: 1,
  L: 4,
  M: 2,
  N: 6,
  O: 8,
  P: 2,
  Q: 1,
  R: 6,
  S: 4,
  T: 6,
  U: 4,
  V: 2,
  W: 2,
  X: 1,
  Y: 2,
  Z: 1,
  WILD: 2,
};

// Stores card distribution and scoring chart
export const LETTER_PHOTO_COUNTS: Record<AssetKey, number> = {
  A: 33,
  B: 24,
  C: 15,
  D: 21,
  E: 30,
  F: 15,
  G: 18,
  H: 15,
  I: 15,
  J: 8,
  K: 15,
  L: 14,
  M: 10,
  N: 17,
  O: 25,
  P: 11,
  Q: 4,
  R: 24,
  S: 29,
  T: 26,
  U: 16,
  V: 15,
  W: 10,
  X: 7,
  Y: 8,
  Z: 8,
  WILD: 2,
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
