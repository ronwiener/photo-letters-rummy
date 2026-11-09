import type { Card, PlayedWord } from "../types/game";
import { isValidWord } from "./wordChecker";
import { calculateWordPoints, calculateStealScore } from "./scoreUtils";

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

// Helper: Re-orders cards array to match the character order of the target anagram word string
export function reorderCardsToMatchWord(
  cards: Card[],
  targetWord: string,
): Card[] {
  // Deep clone cards to prevent mutating original references inadvertently
  const remainingCards = cards.map((c) => ({ ...c }));
  const orderedCards: Card[] = [];

  for (const char of targetWord.toUpperCase()) {
    // 1. Try matching an exact non-wildcard card with this letter first
    let index = remainingCards.findIndex((c) => {
      const isWild =
        c.isWild === true ||
        c.letter === "WILD" ||
        c.id?.toUpperCase().includes("WILD");
      return !isWild && c.letter?.toUpperCase() === char;
    });

    // 2. If no matching regular card, match a wildcard configured for this letter
    if (index === -1) {
      index = remainingCards.findIndex((c) => {
        const isWild =
          c.isWild === true ||
          c.letter === "WILD" ||
          c.id?.toUpperCase().includes("WILD");
        return (
          isWild &&
          (c.assignedLetter?.toUpperCase() === char || !c.assignedLetter)
        );
      });
    }

    if (index !== -1) {
      const [matchedCard] = remainingCards.splice(index, 1);
      const isWild =
        matchedCard.isWild === true ||
        matchedCard.letter === "WILD" ||
        matchedCard.id?.toUpperCase().includes("WILD");

      if (isWild) {
        matchedCard.isWild = true;
        matchedCard.letter = "WILD" as any;
        matchedCard.assignedLetter = char;
      }
      orderedCards.push(matchedCard);
    }
  }

  return orderedCards;
}

/**
 * Finds the optimal play for Monica based on hand, board, rules, and difficulty.
 */
export function findMonicaPlay(
  handCards: Card[],
  wordBoard: PlayedWord[],
  difficulty: "easy" | "medium" | "pro",
  _customIsValidWord?: (word: string) => boolean,
): AiPlayResult | null {
  const checkWord = _customIsValidWord || isValidWord;

  // Clean validation helper without bulky obscure filters
  const isAllowedWord = (word: string): boolean => {
    const cleanWord = word.toUpperCase().trim();

    // Allow 2-letter words across all difficulties (must be at least 2 characters)
    if (cleanWord.length < 2) return false;

    return checkWord(cleanWord);
  };

  const maxWordLength =
    difficulty === "easy" ? 5 : difficulty === "medium" ? 6 : 8;
  const maxStealWordLength =
    difficulty === "easy" ? 5 : difficulty === "medium" ? 8 : 8;

  const maxSingleTurnScore =
    difficulty === "easy" ? 30 : difficulty === "medium" ? 40 : 250;
  const stealChance =
    difficulty === "easy" ? 0.15 : difficulty === "medium" ? 0.3 : 0.75;

  const validPlays: AiPlayResult[] = [];

  // 1. STEAL / EXTENSION SEARCH
  const humanWords = wordBoard.filter((w) => w.playedBy === "human");

  if (humanWords.length > 0 && Math.random() < stealChance) {
    const maxStealCards =
      difficulty === "easy" ? 1 : difficulty === "medium" ? 2 : 3;
    for (const boardItem of humanWords) {
      for (
        let len = 1;
        len <= Math.min(maxStealCards, handCards.length);
        len++
      ) {
        const combos = getSubsets(handCards, len);

        for (const combo of combos) {
          const resolvedCombo = assignWildcardsForSteal(
            combo,
            boardItem.word,
            isAllowedWord,
            maxStealWordLength,
          );
          if (!resolvedCombo) continue;

          const addedLetters = resolvedCombo.letters.join("");
          const cardsAddedCount = combo.length;
          const fullCardsArray = [...boardItem.cards, ...resolvedCombo.cards];
          const combinedLetters = (boardItem.word + addedLetters).toUpperCase();

          if (combinedLetters.length <= maxStealWordLength) {
            const validAnagrams = getValidAnagrams(
              combinedLetters,
              isAllowedWord,
              maxStealWordLength,
            );

            for (const anagramWord of validAnagrams) {
              if (!isAllowedWord(anagramWord)) continue;

              const rawScore = calculateStealScore(
                fullCardsArray,
                cardsAddedCount,
              );
              const cappedScore = Math.min(rawScore, maxSingleTurnScore);
              const reorderedCards = reorderCardsToMatchWord(
                fullCardsArray,
                anagramWord,
              );

              validPlays.push({
                type: "extension",
                cardsUsed: reorderedCards,
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

  // 2. STANDALONE WORD PLAY FROM HAND
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

  if (difficulty === "easy") {
    return validPlays[validPlays.length - 1];
  }

  if (difficulty === "medium") {
    if (validPlays[0].score < 10 && Math.random() < 0.4) {
      return null;
    }

    const filteredPlays = validPlays.filter((play) => {
      const usedWild = play.cardsUsed.some(
        (c) => c.isWild || c.letter === "WILD",
      );
      if (usedWild && play.score < 14) {
        return false;
      }
      return true;
    });

    const candidatePool = filteredPlays.length > 0 ? filteredPlays : validPlays;

    // 60% chance to pick a natural, mid-tier play from the candidate pool
    const pickSubOptimal = Math.random() < 0.6 && candidatePool.length > 3;
    if (pickSubOptimal) {
      const midIndex = Math.floor(candidatePool.length / 2);
      return candidatePool[midIndex];
    }

    const topCandidatesCount = Math.min(6, candidatePool.length);
    const randomIndex = Math.floor(Math.random() * topCandidatesCount);
    return candidatePool[randomIndex];
  }

  return validPlays[0];
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
    // MUST use ALL letters in the combined pool (board word + added cards)
    if (current.length === letters.length && current.length <= maxLen) {
      if (validator(current)) {
        results.add(current);
      }
      return;
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
// Helper: Assign letters to wildcards when attempting steals
function assignWildcardsForSteal(
  cards: Card[],
  baseWord: string,
  validator: (word: string) => boolean,
  maxLen: number,
): { cards: Card[]; letters: string[] } | null {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  // Deep clone cards to prevent mutating hand until chosen
  const processedCards = cards.map((c) => ({ ...c }));
  const letters: string[] = [];

  // 1. Gather all non-wildcard letters from this hand combination
  const staticHandLetters = processedCards
    .filter(
      (c) =>
        !c.isWild &&
        c.letter !== "WILD" &&
        !c.id?.toUpperCase().includes("WILD"),
    )
    .map((c) => (c.letter || "").toUpperCase())
    .join("");

  for (const card of processedCards) {
    const isWild =
      card.isWild === true ||
      card.letter === "WILD" ||
      card.id?.toUpperCase().includes("WILD");

    if (isWild && !card.assignedLetter) {
      let foundValid = false;

      for (const char of ALPHABET) {
        // Construct full combined letter pool (Board Word + Static Hand Tiles + Current Wildcard Test)
        const testPool = (baseWord + staticHandLetters + char).toUpperCase();

        if (testPool.length <= maxLen) {
          const validAnagrams = getValidAnagrams(testPool, validator, maxLen);
          if (validAnagrams.length > 0) {
            // Explicitly set both assignedLetter AND letter flags
            card.isWild = true;
            card.letter = "WILD" as any;
            card.assignedLetter = char;
            letters.push(char);
            foundValid = true;
            break;
          }
        }
      }

      // If NO valid word can be formed with this wildcard, abort steal
      if (!foundValid) return null;
    } else {
      letters.push(
        (
          (card.isWild ? card.assignedLetter : card.letter) || "A"
        ).toUpperCase(),
      );
    }
  }

  return { cards: processedCards, letters };
}
