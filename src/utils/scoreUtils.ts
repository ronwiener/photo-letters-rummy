// src/utils/scoring.ts

// 📜 Option A Letter Values (Scrabble 1–10 Scale)
export const LETTER_VALUES: Record<string, number> = {
  // 1 Point (Common)
  A: 1,
  E: 1,
  I: 1,
  O: 1,
  U: 1,
  L: 1,
  N: 1,
  R: 1,
  S: 1,
  T: 1,
  // 2 Points (Light)
  D: 2,
  G: 2,
  // 3 Points (Medium)
  B: 3,
  C: 3,
  M: 3,
  P: 3,
  // 4 Points (Hard)
  F: 4,
  H: 4,
  V: 4,
  W: 4,
  Y: 4,
  // 5 Points (Moderate Risk)
  K: 5,
  // 8 Points (Challenging)
  J: 8,
  X: 8,
  // 10 Points (High Risk)
  Q: 10,
  Z: 10,
};

/**
 * Retrieves the base point value for an individual card.
 * Wild cards yield 0 base points, but enable letter combinations and length bonuses.
 */
export function getCardPointValue(card: {
  isWild?: boolean;
  letter?: string;
}): number {
  if (card.isWild || card.letter === "WILD") return 0;
  const letterKey = (card.letter || "").toUpperCase();
  return LETTER_VALUES[letterKey] || 1;
}

/**
 * Option A: Length Bonus Scale
 */
export function getLengthBonus(length: number): number {
  if (length < 3) return 0;
  if (length === 3) return 2; // 3 Letters -> +2 pts
  if (length === 4) return 5; // 4 Letters -> +5 pts
  if (length === 5) return 10; // 5 Letters -> +10 pts
  if (length === 6) return 16; // 6 Letters -> +16 pts
  if (length === 7) return 25; // 7 Letters -> +25 pts
  // Each additional letter past 7 adds +10 pts
  return 25 + (length - 7) * 10;
}

/**
 * Calculates full word score: Sum of Individual Letter Values + Length Bonus.
 * Overloaded to accept either an array of Cards or a raw card count length for backward compatibility.
 */
export function calculateWordPoints(
  cardsOrLength: { isWild?: boolean; letter?: string }[] | number,
): number {
  if (typeof cardsOrLength === "number") {
    // Fallback if called with just a number
    return getLengthBonus(cardsOrLength);
  }

  if (!cardsOrLength || cardsOrLength.length < 3) return 0;

  const baseLetterSum = cardsOrLength.reduce(
    (sum, card) => sum + getCardPointValue(card),
    0,
  );
  const lengthBonus = getLengthBonus(cardsOrLength.length);

  return baseLetterSum + lengthBonus;
}

/**
 * Calculates score earned for extending/rearranging/stealing an existing word.
 */
export function calculateExtensionPoints(
  originalCardsOrLength: { isWild?: boolean; letter?: string }[] | number,
  newCardsOrLength: { isWild?: boolean; letter?: string }[] | number,
): number {
  const originalScore = calculateWordPoints(originalCardsOrLength as any);
  const newScore = calculateWordPoints(newCardsOrLength as any);
  return Math.max(0, newScore - originalScore);
}

/**
 * Calculates penalty deductions for leftover hand cards at the end of a round.
 * Wild Cards: -30 pts
 * Letter penalties scale dynamically based on individual letter point values.
 */
export function calculateHandPenalty(
  hand: { letter: string; isWild?: boolean }[],
): number {
  return hand.reduce((totalPenalty, card) => {
    // 🌟 1. Wild Card Penalty (-30 pts)
    if (card.isWild || card.letter === "WILD") {
      return totalPenalty + 30;
    }

    // 2. Letter Penalties derived from letter point values
    const pointVal = getCardPointValue(card);
    if (pointVal <= 1) return totalPenalty + 5; // Standard (1 pt) -> -5 penalty
    if (pointVal <= 4) return totalPenalty + 10; // Moderate (2-4 pts) -> -10 penalty
    return totalPenalty + 20; // High/Rare (5-10 pts) -> -20 penalty
  }, 0);
}
