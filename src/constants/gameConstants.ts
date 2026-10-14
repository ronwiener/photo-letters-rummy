import type { Letter } from "../types/game";

export type AssetKey = Letter | "WILD";

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
export const LETTER_COUNTS = LETTER_PHOTO_COUNTS;

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
