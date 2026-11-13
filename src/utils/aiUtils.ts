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

  const isAllowedWord = (word: string): boolean => {
    const cleanWord = word.toUpperCase().trim();
    if (cleanWord.length < 2) return false;
    return checkWord(cleanWord);
  };

  // Preserved difficulty constants
  const maxWordLength =
    difficulty === "easy" ? 4 : difficulty === "medium" ? 6 : 8;
  const maxStealWordLength =
    difficulty === "easy" ? 5 : difficulty === "medium" ? 8 : 8;

  const maxSingleTurnScore =
    difficulty === "easy" ? 18 : difficulty === "medium" ? 36 : 150;

  // 🌟 EASY MODE STEAL CHANCE SET TO 10% (0.1), MEDIUM TO 15% (0.15)
  const stealChance =
    difficulty === "easy" ? 0.1 : difficulty === "medium" ? 0.15 : 0.5;

  const validPlays: AiPlayResult[] = [];

  // -------------------------------------------------------------
  // 1. STEAL / EXTENSION SEARCH
  // -------------------------------------------------------------
  const humanWords = wordBoard.filter((w) => w.playedBy === "human");

  if (humanWords.length > 0 && Math.random() < stealChance) {
    // Limit Medium mode to 1-card extensions so she doesn't aggressively overhaul board words
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
                boardItem.cards,
                resolvedCombo.cards,
                fullCardsArray,
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

  // -------------------------------------------------------------
  // 2. STANDALONE NEW WORD SEARCH FROM HAND
  // -------------------------------------------------------------
  const maxHandSearchLen = Math.min(maxWordLength, handCards.length);

  for (let len = 2; len <= maxHandSearchLen; len++) {
    const combos = getSubsets(handCards, len);

    for (const combo of combos) {
      const resolvedCombos = resolveWildcardsForHand(
        combo,
        isAllowedWord,
        maxWordLength,
      );

      for (const resolved of resolvedCombos) {
        const lettersStr = resolved.letters.join("").toUpperCase();
        const validAnagrams = getValidAnagrams(
          lettersStr,
          isAllowedWord,
          maxWordLength,
        );

        for (const anagramWord of validAnagrams) {
          if (!isAllowedWord(anagramWord)) continue;

          const rawScore = calculateWordPoints(resolved.cards);
          const cappedScore = Math.min(rawScore, maxSingleTurnScore);
          const reorderedCards = reorderCardsToMatchWord(
            resolved.cards,
            anagramWord,
          );

          validPlays.push({
            type: "new_word",
            cardsUsed: reorderedCards,
            wordText: anagramWord,
            score: cappedScore,
          });
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 3. SORT & APPLY DIFFICULTY SELECTION LOGIC
  // -------------------------------------------------------------
  if (validPlays.length === 0) {
    return null;
  }

  // Sort highest-scoring moves first
  validPlays.sort((a, b) => b.score - a.score);

  // EASY MODE: Conservative pass chance & pick from lower/mid pool
  if (difficulty === "easy") {
    if (validPlays[0].score < 8 && Math.random() < 0.3) {
      return null;
    }
    const easyPool = validPlays.slice(0, Math.min(5, validPlays.length));
    return easyPool[Math.floor(Math.random() * easyPool.length)];
  }

  // MEDIUM MODE:
  // 1. 60% conservative pass/trade chance when best play is < 10 points
  // 2. Pick randomly from top 4 moves instead of always playing the #1 obscure max-score word
  if (difficulty === "medium") {
    if (validPlays[0].score < 10 && Math.random() < 0.6) {
      return null;
    }
    const mediumPool = validPlays.slice(0, Math.min(4, validPlays.length));
    return mediumPool[Math.floor(Math.random() * mediumPool.length)];
  }

  // PRO MODE: Always play the strongest available move
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

// Helper: Resolve wildcards for standalone hand play
function resolveWildcardsForHand(
  cards: Card[],
  validator: (word: string) => boolean,
  maxLen: number,
): { cards: Card[]; letters: string[] }[] {
  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let results: { cards: Card[]; letters: string[] }[] = [
    { cards: cards.map((c) => ({ ...c })), letters: [] },
  ];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const isWild =
      card.isWild === true ||
      card.letter === "WILD" ||
      card.id?.toUpperCase().includes("WILD");

    if (isWild) {
      const nextResults: { cards: Card[]; letters: string[] }[] = [];
      for (const res of results) {
        for (const char of ALPHABET) {
          const clonedCards = res.cards.map((c, idx) => {
            if (idx === i) {
              return {
                ...c,
                isWild: true,
                letter: "WILD" as any,
                assignedLetter: char,
              };
            }
            return { ...c };
          });
          nextResults.push({
            cards: clonedCards,
            letters: [...res.letters, char],
          });
        }
      }
      results = nextResults;
    } else {
      const char = (card.letter || "").toUpperCase();
      for (const res of results) {
        res.letters.push(char);
      }
    }
  }

  return results.filter((res) => {
    const word = res.letters.join("");
    return word.length <= maxLen && validator(word);
  });
}

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
