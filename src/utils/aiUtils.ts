import type { Card, PlayedWord } from "../types/game";
import { isValidWord } from "./wordChecker";
import { calculateWordPoints, calculateStealScore } from "./scoreUtils";

// Extended blacklist of obscure/archaic words common in Scrabble dictionaries
const OBSCURE_WORD_FILTER = new Set([
  "AA",
  "AR",
  "DE",
  "EF",
  "EN",
  "ER",
  "ES",
  "ET",
  "EX",
  "FE",
  "GI",
  "HM",
  "KA",
  "KI",
  "NE",
  "OD",
  "OE",
  "OO",
  "OP",
  "OS",
  "SH",
  "TA",
  "UT",
  "WO",
  "XI",
  "YO",
  "YU",
  "ZA",
  "XU",
  "DANLI",
  "OIE",
  "STETH",
  "AAH",
  "AAL",
  "ABA",
  "ABO",
  "ABS",
  "ABY",
  "ACE",
  "ACT",
  "ADD",
  "ADO",
  "ADS",
  "ADZ",
  "AGI",
  "AHO",
  "AHS",
  "AIA",
  "AIL",
  "AIM",
  "AIN",
  "AIS",
  "AIT",
]);

export interface AiPlayResult {
  type: "new_word" | "extension";
  cardsUsed: Card[];
  wordText: string;
  score: number;
  targetWordId?: string;
}

/**
 * Helper to get all letters from a card array, substituting wildcards dynamically if needed
 */
function resolveCardLetters(cards: Card[]): string[] {
  return cards.map((c) => {
    if (c.isWild) {
      return (c.assignedLetter || "A").toUpperCase();
    }
    return (c.letter || "").toUpperCase();
  });
}

/**
 * Finds the optimal play for Monica based on hand, board, continuous rules, and difficulty.
 */
export function findMonicaPlay(
  handCards: Card[],
  wordBoard: PlayedWord[],
  difficulty: "easy" | "medium" | "pro",
  _customIsValidWord?: (word: string) => boolean, // 👈 Added underscore prefix
): AiPlayResult | null {
  const checkWord = _customIsValidWord || isValidWord;

  // Strict validation helper across all difficulties
  const isAllowedWord = (word: string): boolean => {
    const cleanWord = word.toUpperCase().trim();

    // Disallow 2-letter words for Monica unless on Pro mode to prevent obscure two-letter drops
    if (cleanWord.length < 3 && difficulty !== "pro") return false;

    // Filter blacklisted obscure words
    if (OBSCURE_WORD_FILTER.has(cleanWord)) return false;

    return checkWord(cleanWord);
  };

  const maxWordLength =
    difficulty === "easy" ? 5 : difficulty === "medium" ? 6 : 8;
  const maxSingleTurnScore =
    difficulty === "easy" ? 40 : difficulty === "medium" ? 80 : 250;
  const stealChance =
    difficulty === "easy" ? 0.2 : difficulty === "medium" ? 0.5 : 0.85;

  const validPlays: AiPlayResult[] = [];

  // -------------------------------------------------------------
  // 1. STEAL / ANAGRAM REARRANGEMENT ATTEMPTS (Targeting human words)
  // -------------------------------------------------------------
  const humanWords = wordBoard.filter((w) => w.playedBy === "human");

  if (humanWords.length > 0 && Math.random() < stealChance) {
    const maxStealCards = difficulty === "pro" ? 3 : 2;

    for (const boardItem of humanWords) {
      for (
        let len = 1;
        len <= Math.min(maxStealCards, handCards.length);
        len++
      ) {
        const combos = getSubsets(handCards, len);

        for (const combo of combos) {
          // Resolve cards to letters
          const resolvedCombo = assignWildcardsForSteal(
            combo,
            boardItem.word,
            isAllowedWord,
            maxWordLength,
          );
          if (!resolvedCombo) continue;

          const addedLetters = resolvedCombo.letters.join("");
          const cardsAddedCount = combo.length;
          const fullCardsArray = [...boardItem.cards, ...resolvedCombo.cards];

          // 🔤 FULL ANAGRAM REARRANGEMENT SEARCH (e.g. EAST + R -> STARE)
          const combinedLetters = (boardItem.word + addedLetters).toUpperCase();
          if (combinedLetters.length <= maxWordLength) {
            const validAnagrams = getValidAnagrams(
              combinedLetters,
              isAllowedWord,
              maxWordLength,
            );

            for (const anagramWord of validAnagrams) {
              const rawScore = calculateStealScore(
                fullCardsArray,
                cardsAddedCount,
              );
              const cappedScore = Math.min(rawScore, maxSingleTurnScore);

              validPlays.push({
                type: "extension", // Treated as a steal/extension on the board
                cardsUsed: resolvedCombo.cards,
                wordText: anagramWord,
                score: cappedScore,
                targetWordId: boardItem.id,
              });
            }
          }
        }
      }
    }
  }

  // If valid steals/anagrams were found, return the highest scoring one
  if (validPlays.length > 0) {
    validPlays.sort((a, b) => b.score - a.score);
    return validPlays[0];
  }

  // -------------------------------------------------------------
  // 2. STANDALONE WORD PLAY FROM HAND
  // -------------------------------------------------------------
  function searchHandPermutations(
    currentCombination: Card[],
    remainingCards: Card[],
  ) {
    if (
      currentCombination.length >= 2 &&
      currentCombination.length <= maxWordLength
    ) {
      const candidateWord = resolveCardLetters(currentCombination).join("");

      if (isAllowedWord(candidateWord)) {
        const rawScore = calculateWordPoints(currentCombination);
        const cappedScore = Math.min(rawScore, maxSingleTurnScore);
        validPlays.push({
          type: "new_word",
          cardsUsed: [...currentCombination],
          wordText: candidateWord,
          score: cappedScore,
        });
      }
    }

    if (currentCombination.length >= maxWordLength) return;

    for (let i = 0; i < remainingCards.length; i++) {
      const nextRemaining = [
        ...remainingCards.slice(0, i),
        ...remainingCards.slice(i + 1),
      ];
      searchHandPermutations(
        [...currentCombination, remainingCards[i]],
        nextRemaining,
      );
    }
  }

  searchHandPermutations([], handCards);

  if (validPlays.length === 0) return null;

  validPlays.sort((a, b) => b.score - a.score);

  return difficulty === "easy"
    ? validPlays[validPlays.length - 1]
    : validPlays[0];
}

// Helper: Get k-combinations of hand cards
function getSubsets<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  function p(t: T[], i: number) {
    if (t.length === size) {
      result.push(t);
      return;
    }
    if (i >= array.length) return;
    p([...t, array[i]], i + 1);
    p(t, i + 1);
  }
  p([], 0);
  return result;
}

// Helper: Find valid anagram words from a combined letter pool
function getValidAnagrams(
  letterPool: string,
  validator: (word: string) => boolean,
  maxLen: number,
): string[] {
  const results = new Set<string>();
  const letters = letterPool.split("");

  function permute(current: string, remaining: string[]) {
    if (current.length >= 2 && current.length <= maxLen) {
      if (validator(current)) {
        results.add(current);
      }
    }
    if (current.length >= maxLen) return;

    for (let i = 0; i < remaining.length; i++) {
      const nextRemaining = [
        ...remaining.slice(0, i),
        ...remaining.slice(i + 1),
      ];
      permute(current + remaining[i], nextRemaining);
    }
  }

  permute("", letters);
  return Array.from(results);
}

// Helper: Assign letters to wildcards when attempting steals
function assignWildcardsForSteal(
  cards: Card[],
  baseWord: string,
  _validator: (word: string) => boolean,
  maxLen: number,
): { cards: Card[]; letters: string[] } | null {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const processedCards = cards.map((c) => ({ ...c }));
  const letters: string[] = [];

  for (const card of processedCards) {
    if (card.isWild && !card.assignedLetter) {
      let foundValid = false;
      for (const char of ALPHABET) {
        const testPool = (baseWord + char).toUpperCase();
        if (testPool.length <= maxLen) {
          card.assignedLetter = char;
          letters.push(char);
          foundValid = true;
          break;
        }
      }
      if (!foundValid) card.assignedLetter = "E";
    } else {
      letters.push((card.isWild ? card.assignedLetter : card.letter) || "A");
    }
  }

  return { cards: processedCards, letters };
}
