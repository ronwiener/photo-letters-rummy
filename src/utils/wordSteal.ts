import type { GameState, PlayedWord, Card } from "../types/game";

export interface StealCandidate {
  targetWord: PlayedWord;
  cardsFromHand: Card[];
  newWordText: string;
}

/**
 * Evaluates human-owned words on the board to see if Monica can steal one
 * using 1 or more cards from her hand.
 */
export function findMonicaStealCandidate(
  gameState: GameState,
  isValidWordFn: (word: string) => boolean,
): StealCandidate | null {
  const humanWords = gameState.wordBoard.filter((w) => w.playedBy === "human");
  if (!humanWords.length || gameState.computerHand.length === 0) return null;

  for (const boardWord of humanWords) {
    const existingLetters = boardWord.cards
      .map((c) => (c.isWild ? c.assignedLetter || "a" : c.letter).toLowerCase())
      .join("");

    // -------------------------------------------------------------
    // 1. TRY 1-CARD STEALS (Prefix & Suffix)
    // -------------------------------------------------------------
    for (let i = 0; i < gameState.computerHand.length; i++) {
      const card = gameState.computerHand[i];
      const letter = (
        card.isWild ? card.assignedLetter || "a" : card.letter
      ).toLowerCase();

      const singleCandidates = [
        { text: `${existingLetters}${letter}`, cards: [card] }, // Suffix (e.g., CAT -> CATS)
        { text: `${letter}${existingLetters}`, cards: [card] }, // Prefix (e.g., LATE -> PLATE)
      ];

      for (const candidate of singleCandidates) {
        if (isValidWordFn(candidate.text)) {
          return {
            targetWord: boardWord,
            cardsFromHand: candidate.cards,
            newWordText: candidate.text,
          };
        }
      }
    }

    // -------------------------------------------------------------
    // 2. TRY 2-CARD STEALS (Prefix, Suffix, Sandwich)
    // -------------------------------------------------------------
    if (gameState.computerHand.length >= 2) {
      for (let i = 0; i < gameState.computerHand.length; i++) {
        for (let j = 0; j < gameState.computerHand.length; j++) {
          if (i === j) continue; // Must be distinct cards

          const cardA = gameState.computerHand[i];
          const cardB = gameState.computerHand[j];

          const letterA = (
            cardA.isWild ? cardA.assignedLetter || "a" : cardA.letter
          ).toLowerCase();
          const letterB = (
            cardB.isWild ? cardB.assignedLetter || "a" : cardB.letter
          ).toLowerCase();

          const doubleCandidates = [
            {
              text: `${letterA}${existingLetters}${letterB}`,
              cards: [cardA, cardB],
            },
            {
              text: `${existingLetters}${letterA}${letterB}`,
              cards: [cardA, cardB],
            },
            {
              text: `${letterA}${letterB}${existingLetters}`,
              cards: [cardA, cardB],
            },
          ];

          for (const candidate of doubleCandidates) {
            if (isValidWordFn(candidate.text)) {
              return {
                targetWord: boardWord,
                cardsFromHand: candidate.cards,
                newWordText: candidate.text,
              };
            }
          }
        }
      }
    }
  }

  return null;
}
