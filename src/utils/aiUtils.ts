import type { Card, PlayedWord } from "../types/game";
import { isValidWord } from "./wordChecker";
import { calculateWordPoints, calculateExtensionPoints } from "./scoreUtils";

// Filter out ultra-obscure or non-standard words for common playability
const COMMON_WORD_FILTER = new Set([
  "QI",
  "ZA",
  "AX",
  "XI",
  "XU",
  "JO",
  "KA",
  "ZO",
  "XYLEM",
  "QUIRT",
  "ZAX",
  "AA",
  "AE",
]);

export interface AiPlayResult {
  type: "new_word" | "extension";
  cardsUsed: Card[];
  wordText: string;
  score: number;
  targetWordId?: string;
}

/**
 * Helper to generate permutations of up to maxLen cards from hand
 */
function getHandPermutationsUpTo(cards: Card[], maxLen: number): Card[][] {
  const results: Card[][] = [];

  function permute(current: Card[], remaining: Card[]) {
    if (current.length > 0 && current.length <= maxLen) {
      results.push(current);
    }
    if (current.length >= maxLen) return;

    for (let i = 0; i < remaining.length; i++) {
      const nextRemaining = [
        ...remaining.slice(0, i),
        ...remaining.slice(i + 1),
      ];
      permute([...current, remaining[i]], nextRemaining);
    }
  }

  permute([], cards);
  return results;
}

/**
 * Finds the optimal play for Monica based on hand, board, and selected difficulty.
 */
export function findMonicaPlay(
  handCards: Card[],
  wordBoard: PlayedWord[],
  difficulty: "easy" | "medium" | "pro",
): AiPlayResult | null {
  // Difficulty Rule Configurations
  const maxWordLength =
    difficulty === "easy" ? 4 : difficulty === "medium" ? 5 : 8;
  const maxSingleTurnScore =
    difficulty === "easy" ? 50 : difficulty === "medium" ? 100 : 200;
  const extensionChance =
    difficulty === "easy" ? 0 : difficulty === "medium" ? 0.4 : 0.85;

  const validPlays: AiPlayResult[] = [];

  // 1. BOARD EXTENSION CHECK (Medium & Pro only)
  if (wordBoard.length > 0 && Math.random() < extensionChance) {
    // Generate 1-card, 2-card, and 3-card combinations from Monica's hand
    const extensionCardCombos = getHandPermutationsUpTo(
      handCards,
      difficulty === "pro" ? 3 : 2,
    );

    for (const boardItem of wordBoard) {
      for (const combo of extensionCardCombos) {
        const addedLetters = combo
          .map((c) => c.letter)
          .join("")
          .toUpperCase();

        // A. Suffix Extension (e.g., PLAY + ER = PLAYER)
        const suffixWord = (boardItem.word + addedLetters).toUpperCase();
        if (
          suffixWord.length <= maxWordLength &&
          !COMMON_WORD_FILTER.has(suffixWord) &&
          isValidWord(suffixWord)
        ) {
          const rawScore = calculateExtensionPoints(
            boardItem.word.length,
            suffixWord.length,
          );
          const cappedScore = Math.min(rawScore, maxSingleTurnScore);
          validPlays.push({
            type: "extension",
            cardsUsed: combo,
            wordText: suffixWord,
            score: cappedScore,
            targetWordId: boardItem.id,
          });
        }

        // B. Prefix Extension (e.g., RE + PLAY = REPLAY)
        const prefixWord = (addedLetters + boardItem.word).toUpperCase();
        if (
          prefixWord.length <= maxWordLength &&
          !COMMON_WORD_FILTER.has(prefixWord) &&
          isValidWord(prefixWord)
        ) {
          const rawScore = calculateExtensionPoints(
            boardItem.word.length,
            prefixWord.length,
          );
          const cappedScore = Math.min(rawScore, maxSingleTurnScore);
          validPlays.push({
            type: "extension",
            cardsUsed: combo,
            wordText: prefixWord,
            score: cappedScore,
            targetWordId: boardItem.id,
          });
        }
      }
    }
  }

  // If extensions were found, prioritize top scoring extension
  if (validPlays.length > 0) {
    validPlays.sort((a, b) => b.score - a.score);
    return validPlays[0];
  }

  // 2. STANDALONE WORD PLAY FROM HAND
  // Permutation generator to allow rearranging letters (e.g., T-S-I -> S-I-T)
  function searchHandPermutations(
    currentCombination: Card[],
    remainingCards: Card[],
  ) {
    if (
      currentCombination.length >= 3 &&
      currentCombination.length <= maxWordLength
    ) {
      const candidateWord = currentCombination
        .map((c) => c.letter)
        .join("")
        .toUpperCase();

      if (
        !COMMON_WORD_FILTER.has(candidateWord) &&
        isValidWord(candidateWord)
      ) {
        const rawScore = calculateWordPoints(candidateWord.length);
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

  // Sort plays: Pro chooses highest score, Easy/Medium pick balanced plays
  validPlays.sort((a, b) => b.score - a.score);

  return difficulty === "easy"
    ? validPlays[validPlays.length - 1] // Simple short word
    : validPlays[0]; // Best high score word
}
