import type { GameState, PlayedWord, Card } from "../types/game";

export interface StealCandidate {
  targetWord: PlayedWord;
  cardsFromHand: Card[];
  newWordText: string;
}

/**
 * Evaluates human-owned words on the board to see if Monica can steal one
 * using 2 or more cards from her hand.
 */
export function findMonicaStealCandidate(
  gameState: GameState,
  isValidWordFn: (word: string) => boolean,
): StealCandidate | null {
  const humanWords = gameState.wordBoard.filter((w) => w.playedBy === "human");
  if (!humanWords.length || gameState.computerHand.length < 2) return null;

  for (const boardWord of humanWords) {
    const existingLetters = boardWord.cards
      .map((c) => c.letter.toLowerCase())
      .join("");

    // Try all pairs of cards in Monica's hand (2-card minimum requirement)
    for (let i = 0; i < gameState.computerHand.length; i++) {
      for (let j = i + 1; j < gameState.computerHand.length; j++) {
        const cardA = gameState.computerHand[i];
        const cardB = gameState.computerHand[j];

        const letterA = cardA.letter.toLowerCase();
        const letterB = cardB.letter.toLowerCase();

        // Check common expansion patterns (prefix + suffix, double suffix, double prefix)
        const candidates = [
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

        for (const candidate of candidates) {
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

  return null;
}
