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
 * 🛡️ Anti-Clumping Helper:
 * Ensures no single letter appears more than maxPerHand (e.g. 2) times
 * in any sequential 8-card window.
 */
function antiClumpDeck(deck: Card[], maxPerHand: number = 2): Card[] {
  const result = [...deck];
  const windowSize = 8;

  for (let i = 0; i <= result.length - windowSize; i += windowSize) {
    const counts: Record<string, number> = {};

    for (let j = 0; j < windowSize; j++) {
      const idx = i + j;
      const letter = result[idx].letter;
      counts[letter] = (counts[letter] || 0) + 1;

      // If a letter exceeds our limit in this 8-card slice, swap it down
      if (counts[letter] > maxPerHand) {
        const remainingLength = result.length - (i + windowSize);
        if (remainingLength > 0) {
          const swapIndex =
            i + windowSize + Math.floor(Math.random() * remainingLength);
          [result[idx], result[swapIndex]] = [result[swapIndex], result[idx]];
        }
      }
    }
  }

  return result;
}

/**
 * Creates a brand new 100-card deck with letter distributions and wild cards.
 * Cycles through available photo assets evenly to prevent premature duplicate photos.
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  let cardCounter = 1;

  (Object.keys(LETTER_COUNTS) as Letter[]).forEach((letter) => {
    if ((letter as string) === "WILD") return;
    const count = LETTER_COUNTS[letter];
    const availablePhotos = NEON_ASSET_REGISTRY[letter] || [];

    if (availablePhotos.length === 0) {
      console.warn(
        `Warning: No neon photos found for letter ${letter}! Using fallback.`,
      );
    }

    const shuffledPhotos = shuffleArray([...availablePhotos]);

    for (let i = 0; i < count; i++) {
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

  // 🌟 ADD EXACTLY 2 WILD CARDS
  const numberOfWildCards = 2;
  for (let i = 1; i <= numberOfWildCards; i++) {
    deck.push({
      id: `WILD-${i}-${Date.now()}`,
      letter: "WILD" as Letter,
      photoUrl: "/photo-letters/wild-card/wild.jpeg",
      isWild: true,
    });
  }

  // Guarantee max 2 wild cards
  const standardCards = deck.filter((c) => !c.isWild && c.letter !== "WILD");
  const wildCards = deck
    .filter((c) => c.isWild || c.letter === "WILD")
    .slice(0, 2);

  // 1. Initial true random shuffle
  const rawShuffled = shuffleArray([...standardCards, ...wildCards]);

  // 2. Smooth out vowel & letter clumping across 8-card draw windows
  const finalDeck = antiClumpDeck(rawShuffled, 2);

  const createdWilds = finalDeck.filter((c) => c.isWild || c.letter === "WILD");
  console.log("🃏 NEW DECK CREATED & ANTI-CLUMPED:");
  console.log(`Total Cards in Deck: ${finalDeck.length}`);
  console.log(`Wildcard Count: ${createdWilds.length}`, createdWilds);

  return finalDeck;
}

/**
 * Shuffles an array of cards using the Fisher-Yates algorithm.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  return shuffleArray(deck);
}

/**
 * Creates and anti-clumps a fresh 100-card deck.
 */
export function createAndShuffle100CardDeck(): Card[] {
  return createDeck();
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
 * Initializes a brand new game state for continuous play.
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
