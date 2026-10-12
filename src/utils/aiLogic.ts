import type { Card } from "../types/game";
import { isValidWord } from "./wordChecker";

// Filter out ultra-obscure Scrabble/dictionary words that look like nonsense
const BANNED_AI_WORDS = new Set([
  "DANLI",
  "OIE",
  "QI",
  "ZA",
  "AX",
  "XI",
  "XU",
  "JO",
  "KA",
  "ZO",
  "AA",
  "AE",
]);

/**
 * Finds a valid word play for the AI from its hand.
 * Generates true permutations so letters are properly rearranged.
 */
export function findComputerWord(hand: Card[]): Card[] | null {
  const validPlays: { cards: Card[]; word: string }[] = [];

  /**
   * Generates all order permutations for a specific length
   */
  function permute(current: Card[], remaining: Card[], targetLength: number) {
    if (current.length === targetLength) {
      const wordStr = current
        .map((c) => c.letter)
        .join("")
        .toUpperCase();

      // Strict check: must pass dictionary validation and not be in banned list
      if (!BANNED_AI_WORDS.has(wordStr) && isValidWord(wordStr) === true) {
        validPlays.push({ cards: [...current], word: wordStr });
      }
      return;
    }

    for (let i = 0; i < remaining.length; i++) {
      const nextRemaining = [
        ...remaining.slice(0, i),
        ...remaining.slice(i + 1),
      ];
      permute([...current, remaining[i]], nextRemaining, targetLength);
    }
  }

  // Search from longest word length (up to 5 or 6) down to 3 letters
  const maxLen = Math.min(6, hand.length);
  for (let len = maxLen; len >= 3; len--) {
    permute([], hand, len);

    // If valid plays of this length exist, pick the highest quality option
    if (validPlays.length > 0) {
      // Sort to prefer longer words
      validPlays.sort((a, b) => b.word.length - a.word.length);
      return validPlays[0].cards;
    }
  }

  return null; // No valid word found
}
