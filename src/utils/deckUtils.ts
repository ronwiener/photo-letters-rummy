import type { Card, Letter } from "../types/game";
import { LETTER_COUNTS } from "../constants/gameConstants";
import { NEON_ASSET_REGISTRY } from "../constants/neonAssets";

//creates a new 100 card deck on game start

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

    for (let i = 0; i < count; i++) {
      // Pick a random photo from whatever files exist in that letter's subfolder
      const randomPhotoUrl =
        availablePhotos.length > 0
          ? availablePhotos[Math.floor(Math.random() * availablePhotos.length)]
          : `/photo-letters/fallback.jpg`;

      deck.push({
        id: `${letter}-${cardCounter++}`,
        letter: letter,
        photoUrl: randomPhotoUrl,
      });
    }
  });

  return deck;
}
/**
 * Shuffles an array of cards using the Fisher-Yates algorithm.
 */
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Draws `count` cards from the draw pile.
 * If draw pile runs out, reshuffles discard pile (minus top card) into draw pile.
 */
export function drawCards(
  drawPile: Card[],
  discardPile: Card[],
  count: number,
): { drawn: Card[]; remainingDraw: Card[]; remainingDiscard: Card[] } {
  let currentDraw = [...drawPile];
  let currentDiscard = [...discardPile];
  const drawn: Card[] = [];

  for (let i = 0; i < count; i++) {
    if (currentDraw.length === 0) {
      // Reshuffle discard pile if draw pile is empty (keeping top card)
      if (currentDiscard.length > 1) {
        const topDiscard = currentDiscard[currentDiscard.length - 1];
        const toReshuffle = currentDiscard.slice(0, -1);

        // Simple Fisher-Yates shuffle
        for (let j = toReshuffle.length - 1; j > 0; j--) {
          const k = Math.floor(Math.random() * (j + 1));
          [toReshuffle[j], toReshuffle[k]] = [toReshuffle[k], toReshuffle[j]];
        }

        currentDraw = toReshuffle;
        currentDiscard = [topDiscard];
      } else {
        break; // No more cards available in deck
      }
    }

    const card = currentDraw.pop();
    if (card) drawn.push(card);
  }

  return {
    drawn,
    remainingDraw: currentDraw,
    remainingDiscard: currentDiscard,
  };
}

/**
 * Initializes a brand new game state for dealing (Rule 3):
 * 1. Generates and shuffles the 100-card deck.
 * 2. Deals 7 cards to the human player.
 * 3. Deals 7 cards to the computer player.
 * 4. Places 1 card face up on the discard pile.
 * 5. Leaves the remaining 85 cards in the draw pile.
 */

export function dealNewGame() {
  const rawDeck = createDeck();
  const shuffled = shuffleDeck(rawDeck);

  const humanHand = shuffled.slice(0, 10);
  const computerHand = shuffled.slice(10, 20);
  const discardPile = [shuffled[20]];
  const drawPile = shuffled.slice(21); // Exactly 79 cards remaining

  return {
    humanHand,
    computerHand,
    drawPile,
    discardPile,
  };
}
