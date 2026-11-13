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
 * Calculates steal score: Original root letter points (1x) + Added cards letter points (2x)
 * + Full new word length bonus.
 */
export function calculateStealScore(
  originalCards: { isWild?: boolean; letter?: string }[],
  addedCards: { isWild?: boolean; letter?: string }[],
  fullWordCards: { isWild?: boolean; letter?: string }[],
): number {
  // 1. Sum letter points of the original inherited word (always 1x)
  const originalLetterSum = originalCards.reduce(
    (sum, card) => sum + getCardPointValue(card),
    0,
  );

  // 2. Sum letter points of newly added cards from hand and double them (2x)
  const doubledAddedPoints =
    addedCards.reduce((sum, card) => sum + getCardPointValue(card), 0) * 2;

  // 3. Add the full length bonus of the final updated word
  const lengthBonus = getLengthBonus(fullWordCards.length);

  return originalLetterSum + doubledAddedPoints + lengthBonus;
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
