import type { Card, Letter } from "../types/game";
import { LETTER_COUNTS } from "../constants/gameConstants";
import { NEON_ASSET_REGISTRY } from "../constants/neonAssets";

/**
 * Generic Fisher-Yates array shuffle helper.
 */
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Creates a brand new 100-card deck with letter distributions and wild cards.
 * Cycles through available photo assets evenly to prevent premature duplicate photos.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  let cardCounter = 1;

  (Object.keys(LETTER_COUNTS) as Letter[]).forEach((letter) => {
    const count = LETTER_COUNTS[letter];
    const availablePhotos = NEON_ASSET_REGISTRY[letter] || [];

    if (availablePhotos.length === 0) {
      console.warn(
        `Warning: No neon photos found for letter ${letter}! Using fallback.`,
      );
    }

    // 1. Shuffle the available photo pool for this letter once
    const shuffledPhotos = shuffleArray([...availablePhotos]);

    for (let i = 0; i < count; i++) {
      // 2. Cycle through photos evenly using modulo so duplicates only occur when needed
      const photoUrl =
        shuffledPhotos.length > 0
          ? shuffledPhotos[i % shuffledPhotos.length]
          : `/photo-letters/fallback.jpg`;

      deck.push({
        id: `${letter}-${cardCounter++}`,
        letter: letter,
        photoUrl: photoUrl,
      });
    }
  });

  // 🌟 ADD WILD CARDS (2 Wild Cards included)
  const numberOfWildCards = 2;
  for (let i = 1; i <= numberOfWildCards; i++) {
    deck.push({
      id: `WILD-${i}`,
      letter: "WILD" as Letter,
      photoUrl: "/photo-letters/wild-card/wild.jpeg",
      isWild: true,
    });
  }

  return deck;
}

/**
 * Shuffles an array of cards using the Fisher-Yates algorithm.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  return shuffleArray(deck);
}

/**
 * Creates and shuffles a fresh 100-card deck.
 */
export function createAndShuffle100CardDeck(): Card[] {
  const freshDeck = createDeck();
  return shuffleDeck(freshDeck);
}

/**
 * Draws `count` cards directly from the continuous deck.
 */
export function drawCardsFromDeck(
  deck: Card[],
  count: number,
): { drawn: Card[]; remainingDeck: Card[] } {
  const drawn = deck.slice(0, count);
  const remainingDeck = deck.slice(count);

  return {
    drawn,
    remainingDeck,
  };
}

/**
 * Initializes a brand new game state for continuous play:
 * - Generates and shuffles a 100-card deck.
 * - Deals 8 cards to the human player.
 * - Deals 8 cards to the computer player.
 * - Leaves remaining 84 cards in the continuous draw deck.
 */
export const dealNewGame = () => {
  const fullDeck = createAndShuffle100CardDeck();

  // Deal 8 cards to each player
  const humanHand = fullDeck.slice(0, 8);
  const computerHand = fullDeck.slice(8, 16);

  // The remaining cards become the continuous deck pool
  const deck = fullDeck.slice(16);

  return {
    humanHand,
    computerHand,
    deck,
  };
};
