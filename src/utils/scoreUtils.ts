// src/utils/scoreUtils.ts

export const LETTER_VALUES: Record<string, number> = {
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
  D: 2,
  G: 2,
  B: 3,
  C: 3,
  M: 3,
  P: 3,
  F: 4,
  H: 4,
  V: 4,
  W: 4,
  Y: 4,
  K: 5,
  J: 8,
  X: 8,
  Q: 10,
  Z: 10,
};

export function getCardPointValue(card: {
  isWild?: boolean;
  letter?: string;
}): number {
  if (card.isWild || card.letter === "WILD") return 0;
  const letterKey = (card.letter || "").toUpperCase();
  return LETTER_VALUES[letterKey] || 1;
}

export function getLengthBonus(length: number): number {
  if (length < 3) return 0;
  if (length === 3) return 2;
  if (length === 4) return 5;
  if (length === 5) return 10;
  if (length === 6) return 16;
  if (length === 7) return 25;
  return 25 + (length - 7) * 10;
}

/**
 * Calculates base word score: Letter Values Sum + Word Length Bonus
 */
export function calculateWordPoints(
  cardsOrLength: { isWild?: boolean; letter?: string }[] | number,
): number {
  if (typeof cardsOrLength === "number") {
    return getLengthBonus(cardsOrLength);
  }

  if (!cardsOrLength || cardsOrLength.length < 2) return 0;

  const baseLetterSum = cardsOrLength.reduce(
    (sum, card) => sum + getCardPointValue(card),
    0,
  );
  const lengthBonus = getLengthBonus(cardsOrLength.length);

  return baseLetterSum + lengthBonus;
}

/**
 * Calculates steal score based on full new word cards and cards added from hand:
 * - 1 Card Added: Base points for the full new word.
 * - 2+ Cards Added: DOUBLE points (2x) for the full new word.
 */
export function calculateStealScore(
  fullWordCards: { isWild?: boolean; letter?: string }[],
  cardsAddedCount: number,
): number {
  const basePoints = calculateWordPoints(fullWordCards);

  // 1 card added = 1x base points; 2+ cards added = 2x double points
  return cardsAddedCount >= 2 ? basePoints * 2 : basePoints;
}

/**
 * Calculates penalty deductions for leftover hand cards at round end.
 */
export function calculateHandPenalty(
  hand: { letter: string; isWild?: boolean; assignedLetter?: string }[],
): number {
  if (hand.length === 0) return 0;

  return hand.reduce((totalPenalty, card) => {
    if (card.isWild || card.letter === "WILD") {
      return totalPenalty + 30;
    }

    return totalPenalty + getCardPointValue(card);
  }, 0);
}
