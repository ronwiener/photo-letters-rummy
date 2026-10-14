import { useState, useEffect } from "react";
import { GameBoard } from "./components/GameBoard";
import { Workspace } from "./components/Workspace";
import { dealNewGame, drawCards } from "./utils/deckUtils";
import { isValidWord } from "./utils/wordChecker";
import { findMonicaPlay } from "./utils/aiUtils";
import type { GameState, Card, PlayerId, PlayedWord } from "./types/game";
import {
  calculateWordPoints,
  calculateExtensionPoints,
} from "./utils/scoreUtils";
import { WordHistoryModal } from "./components/WordHistoryModal";
import { calculateHandPenalty } from "./utils/scoreUtils";
import { RoundEndModal } from "./components/RoundEndModal";
import { MainMenu } from "./components/MainMenu";
import { RulesModal } from "./components/RuleModal";
import { findMonicaStealCandidate } from "./utils/wordSteal";
import { WildCardPickerModal } from "./components/WildCardPickerModal";

export type TurnPhase = "draw" | "play" | "discard";

export function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const deal = dealNewGame();

    return {
      matchScores: { human: 0, computer: 0 },
      roundScores: { human: 0, computer: 0 },
      roundNumber: 1,
      consecutivePasses: 0,
      botName: "Monica",
      aiDifficulty: "medium",
      humanHand: deal.humanHand,
      computerHand: deal.computerHand,
      drawPile: deal.drawPile,
      discardPile: deal.discardPile,
      wordBoard: [],
      currentTurn: "human" as PlayerId,
      isRoundOver: false,
      roundEndReason: null,
      isGameOver: false,
      winner: null,
    } as GameState;
  });

  const [turnPhase, setTurnPhase] = useState<TurnPhase>("draw");
  const [stagedCards, setStagedCards] = useState<Card[]>([]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiStatusText, setAiStatusText] = useState<string>("");
  const [hasPlayedWordThisTurn, setHasPlayedWordThisTurn] = useState(false);
  const [targetBoardWord, setTargetBoardWord] = useState<PlayedWord | null>(
    null,
  );
  const [inspectingWord, setInspectingWord] = useState<PlayedWord | null>(null);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);

  const stagedWordText = stagedCards.map((c) => c.letter).join("");
  const wordValid = isValidWord(stagedWordText);

  // -------------------------------------------------------------
  // RULE 4 STEP 1: DRAW A CARD (From Draw Pile or Discard Pile)
  // -------------------------------------------------------------
  const handleDrawFromPile = (source: "draw" | "discard") => {
    // Prevent drawing if it's not the human turn or not the draw phase
    if (gameState.currentTurn !== "human" || turnPhase !== "draw") return;

    let drawnCard: Card | undefined;
    let newDrawPile = [...gameState.drawPile];
    let newDiscardPile = [...gameState.discardPile];

    if (source === "draw") {
      const res = drawCards(newDrawPile, newDiscardPile, 1);

      // 🛡️ STALEMATE TRIGGER 1: Draw pile and recycle pool are completely empty!
      if (res.drawn.length === 0) {
        // If consecutive passes have occurred or no cards remain to be drawn
        if (gameState.consecutivePasses >= 1) {
          handleEndRound("stalemate");
          return;
        }
        // Force turn phase to allow human to play remaining hand cards or pass/discard
        setTurnPhase("play");
        return;
      }

      drawnCard = res.drawn[0];
      newDrawPile = res.remainingDraw;
      newDiscardPile = res.remainingDiscard;
    } else {
      if (newDiscardPile.length === 0) return;
      drawnCard = newDiscardPile.pop();
    }

    if (!drawnCard) return;

    setGameState((prev) => ({
      ...prev,
      humanHand: [...prev.humanHand, drawnCard!],
      drawPile: newDrawPile,
      discardPile: newDiscardPile,
    }));

    setTurnPhase("play"); // 🎯 Advances player to play/discard phase
  };

  // When tapping a word on the board:
  const handleInspectWord = (playedWord: PlayedWord) => {
    setInspectingWord(playedWord);
  };

  // -------------------------------------------------------------
  // CARD STAGING / UNSTAGING IN WORKSPACE & WILD CARD HANDLING
  // -------------------------------------------------------------
  const handleStageCard = (card: Card) => {
    console.log("➡️ handleStageCard triggered with card:", card);

    if (gameState.currentTurn !== "human") {
      console.warn("Blocked: Not human turn!");
      return;
    }
    if (turnPhase !== "play") {
      console.warn(`Blocked: turnPhase is '${turnPhase}', expected 'play'!`);
      return;
    }

    // Check card properties
    console.log(
      "Is Wild?",
      card.isWild,
      "Assigned Letter?",
      card.assignedLetter,
    );

    if (card.isWild && !card.assignedLetter) {
      console.log("🌟 Triggering setPendingWildCard!");
      setPendingWildCard(card);
      return;
    }

    // Standard staging flow
    setGameState((prev) => ({
      ...prev,
      humanHand: prev.humanHand.filter((c) => c.id !== card.id),
    }));
    setStagedCards((prev) => [...prev, card]);
  };

  // Called when player picks a letter in WildCardPickerModal
  const handleSelectWildLetter = (selectedLetter: string) => {
    if (!pendingWildCard) return;

    const configuredWildCard: Card = {
      ...pendingWildCard,
      assignedLetter: selectedLetter.toUpperCase(),
    };

    // Remove from hand and add configured wild card to workspace
    setGameState((prev) => ({
      ...prev,
      humanHand: prev.humanHand.filter((c) => c.id !== pendingWildCard.id),
    }));
    setStagedCards((prev) => [...prev, configuredWildCard]);

    // Clear pending wild card state
    setPendingWildCard(null);
  };

  // Called when player cancels Wild Card letter selection
  const handleCancelWildPicker = () => {
    setPendingWildCard(null);
  };

  const handleUnstageCard = (card: Card) => {
    // Check if card came from the original board word
    const isOriginalBoardCard = targetBoardWord?.cards.some(
      (c) => c.id === card.id,
    );

    setStagedCards((prev) => prev.filter((c) => c.id !== card.id));

    // Only return to hand if it came from the player's hand, NOT the board word
    if (!isOriginalBoardCard) {
      // If it's a wild card, reset assignedLetter back to undefined before returning to hand
      const cardToReturn = card.isWild
        ? { ...card, assignedLetter: undefined }
        : card;

      setGameState((prev) => ({
        ...prev,
        humanHand: [...prev.humanHand, cardToReturn],
      }));
    }
  };

  // -------------------------------------------------------------
  // WILD SWAP MECHANIC (Supports both Human & Computer)
  // -------------------------------------------------------------
  const handleWildSwap = (
    targetWildCard: Card,
    handCard: Card,
    playerId: PlayerId,
  ) => {
    if (!targetWildCard.isWild || !targetWildCard.assignedLetter) {
      console.warn("Blocked: Target card is not an assigned Wild Card!");
      return;
    }

    if (handCard.letter !== targetWildCard.assignedLetter) {
      console.warn(
        `Blocked: Hand card '${handCard.letter}' does not match Wild Card assigned letter '${targetWildCard.assignedLetter}'!`,
      );
      return;
    }

    // Reset assigned letter before returning Wild Card to hand
    const reclaimedWildCard: Card = {
      ...targetWildCard,
      assignedLetter: undefined,
    };

    // 1. Update Staged Cards (if target is currently in staging workspace)
    const isStaged = stagedCards.some((c: Card) => c.id === targetWildCard.id);
    if (isStaged) {
      setStagedCards((prev: Card[]) =>
        prev.map((c: Card) => (c.id === targetWildCard.id ? handCard : c)),
      );
    }

    // 2. Update Board Words & Player Hands in GameState
    setGameState((prev: GameState) => {
      // Replace target Wild Card across all played board words in wordBoard
      const updatedWordBoard = prev.wordBoard.map((playedWord: PlayedWord) => {
        const hasWild = playedWord.cards.some(
          (c: Card) => c.id === targetWildCard.id,
        );
        if (!hasWild) return playedWord;

        return {
          ...playedWord,
          cards: playedWord.cards.map((c: Card) =>
            c.id === targetWildCard.id ? handCard : c,
          ),
        };
      });

      // Update the correct player's hand
      if (playerId === "human") {
        const updatedHand = prev.humanHand
          .filter((c: Card) => c.id !== handCard.id)
          .concat(reclaimedWildCard);

        return {
          ...prev,
          wordBoard: updatedWordBoard,
          humanHand: updatedHand,
        };
      } else {
        const updatedHand = prev.computerHand
          .filter((c: Card) => c.id !== handCard.id)
          .concat(reclaimedWildCard);

        return {
          ...prev,
          wordBoard: updatedWordBoard,
          computerHand: updatedHand,
        };
      }
    });
  };

  // -------------------------------------------------------------
  // HUMAN WILD SWAP ACTION
  // -------------------------------------------------------------
  const onHumanAttemptWildSwap = (targetWildCard: Card, handCard: Card) => {
    if (gameState.currentTurn !== "human" || turnPhase !== "play") {
      console.warn(
        "Blocked: You can only swap Wild Cards during your play turn!",
      );
      return;
    }

    if (handCard.letter !== targetWildCard.assignedLetter) {
      console.warn(
        `Blocked: You must use a '${targetWildCard.assignedLetter}' card to swap this Wild Card!`,
      );
      return;
    }

    handleWildSwap(targetWildCard, handCard, "human");
  };

  const handleClearWorkspace = () => {
    if (targetBoardWord) {
      const originalCardIds = new Set(targetBoardWord.cards.map((c) => c.id));
      const handCardsInWorkspace = stagedCards.filter(
        (c) => !originalCardIds.has(c.id),
      );

      // Return ONLY hand cards back to hand
      setGameState((prev) => ({
        ...prev,
        humanHand: [...prev.humanHand, ...handCardsInWorkspace],
      }));
      setTargetBoardWord(null);
    } else {
      // Normal workspace clear
      setGameState((prev) => ({
        ...prev,
        humanHand: [...prev.humanHand, ...stagedCards],
      }));
    }

    setStagedCards([]);
  };

  // Handler when user taps a word on the board during 'play' phase:
  const handleSelectWordForModification = (playedWord: PlayedWord) => {
    // 🛡️ Guard: Must be human turn and play phase
    if (gameState.currentTurn !== "human" || turnPhase !== "play") return;

    // 🔄 Deselect/Toggle Off if clicking the word currently being modified
    if (targetBoardWord && targetBoardWord.id === playedWord.id) {
      setTargetBoardWord(null);
      setStagedCards([]);
      return;
    }

    // 🎯 Load target word and populate workspace immediately
    setTargetBoardWord(playedWord);
    setStagedCards([...playedWord.cards]);
  };

  // Updated handleSubmitWord supporting New Words, Extension, Rearranging, and Word Stealing
  const handleSubmitWord = () => {
    if (gameState.currentTurn !== "human" || turnPhase !== "play") return;

    // 1. 🛡️ BUILD FULL PROPOSED WORD STRING (Resolving Wild Cards Safely)
    const proposedWordText = stagedCards
      .map((c) => {
        if (c.isWild) {
          return (c.assignedLetter || "").toUpperCase();
        }
        return (c.letter || "").toUpperCase();
      })
      .join("");

    // 2. 🛡️ MANDATORY DICTIONARY & WILD ASSIGNMENT VALIDATION GATE
    const containsUnassignedWild = stagedCards.some(
      (c) => c.isWild && !c.assignedLetter,
    );

    if (containsUnassignedWild) {
      alert("Please assign a letter to all Wild Cards before submitting!");
      return;
    }

    if (proposedWordText.length < 3) {
      alert("Words must be at least 3 letters long!");
      return;
    }

    if (!isValidWord(proposedWordText)) {
      alert(`"${proposedWordText}" is not a valid dictionary word!`);
      return;
    }

    if (targetBoardWord) {
      // --- RULES 6 & 7: EXTENSION, REARRANGING & STEALING VALIDATION ---
      const originalCardIds = new Set(targetBoardWord.cards.map((c) => c.id));
      const currentStagedIds = new Set(stagedCards.map((c) => c.id));

      // 1. Rule constraint: Must add at least 1 new card from hand
      const newCardsFromHand = stagedCards.filter(
        (c) => !originalCardIds.has(c.id),
      );

      if (newCardsFromHand.length < 1) {
        alert(
          "You must add at least one letter from your hand to extend or rearrange a word!",
        );
        return;
      }

      // 2. Rule 7 constraint: Every letter in the original word MUST be included
      const missingOriginalCards = targetBoardWord.cards.some(
        (c) => !currentStagedIds.has(c.id),
      );

      if (missingOriginalCards) {
        alert(
          "You must use all letters from the original word when extending or rearranging!",
        );
        return;
      }

      // ⚡ WORD STEALING CHECK: If modifying opponent's word, enforce 2+ hand card rule
      const isOpponentWord = targetBoardWord.playedBy !== "human";

      if (isOpponentWord && newCardsFromHand.length < 2) {
        alert(
          "⚡ Word Steal Rule: You must play at least 2 cards from your hand to steal an opponent's word!",
        );
        return;
      }

      // Rule 8 Extension/Rearrangement Scoring
      const pointsAwarded = calculateExtensionPoints(
        targetBoardWord.cards.length,
        stagedCards.length,
      );

      const existingHistory = targetBoardWord.history || [];
      const updatedPlayedWord: PlayedWord = {
        id: targetBoardWord.id,
        word: proposedWordText, // 👈 Uses sanitized proposed word text
        cards: [...stagedCards],
        playedBy: "human", // 👑 Ownership transferred to Human if stolen
        originalWord: targetBoardWord.word,
        scoreAwarded: pointsAwarded,
        history: [
          ...existingHistory,
          {
            action: isOpponentWord
              ? "stolen"
              : proposedWordText.length > targetBoardWord.cards.length
                ? "extended"
                : "rearranged",
            player: "human",
            description: isOpponentWord
              ? `Stole "${targetBoardWord.word}" and expanded it into "${proposedWordText}" (+${pointsAwarded} pts).`
              : `Modified "${targetBoardWord.word}" into "${proposedWordText}" (+${pointsAwarded} pts).`,
            timestamp: Date.now(),
          },
        ],
      };

      const updatedWordBoard = gameState.wordBoard.map((w) =>
        w.id === targetBoardWord.id ? updatedPlayedWord : w,
      );

      // Filter out only the cards that were played from the hand
      const updatedHand = gameState.humanHand.filter(
        (handCard) =>
          !newCardsFromHand.some((played) => played.id === handCard.id),
      );

      // 🎯 Calculate score adjustments (deduct old word score from opponent if stolen)
      const previousOwner = targetBoardWord.playedBy;
      const previousScore = targetBoardWord.scoreAwarded || 0;

      setGameState((prev) => {
        const updatedRoundScores = { ...prev.roundScores };

        if (isOpponentWord && previousOwner) {
          // Deduct previous score from opponent (clamped at 0)
          updatedRoundScores[previousOwner] = Math.max(
            0,
            updatedRoundScores[previousOwner] - previousScore,
          );
        }

        // Award full new score to human
        updatedRoundScores.human = updatedRoundScores.human + pointsAwarded;

        return {
          ...prev,
          wordBoard: updatedWordBoard,
          roundScores: updatedRoundScores,
          humanHand: updatedHand,
          consecutivePasses: 0,
        };
      });
    } else {
      // --- STANDARD NEW WORD PLAY ---
      const pointsAwarded = calculateWordPoints(stagedCards.length);

      const newPlayedWord: PlayedWord = {
        id: `word-${Date.now()}`,
        word: proposedWordText, // 👈 Uses sanitized proposed word text
        cards: [...stagedCards],
        playedBy: "human",
        scoreAwarded: pointsAwarded,
        history: [
          {
            action: "created",
            player: "human",
            description: `Created new word "${proposedWordText}" for ${pointsAwarded} points.`,
            timestamp: Date.now(),
          },
        ],
      };

      // Filter out all staged cards from human hand
      const updatedHand = gameState.humanHand.filter(
        (handCard) => !stagedCards.some((staged) => staged.id === handCard.id),
      );

      setGameState((prev) => ({
        ...prev,
        wordBoard: [...prev.wordBoard, newPlayedWord],
        roundScores: {
          ...prev.roundScores,
          human: prev.roundScores.human + pointsAwarded,
        },
        humanHand: updatedHand,
      }));
    }

    // Cleanup workspace and remain in "play" phase so multiple plays are possible before discarding
    setStagedCards([]);
    setTargetBoardWord(null);
    setHasPlayedWordThisTurn(true);

    // Note: Check if player went out completely
    if (gameState.humanHand.length === 0) {
      // Handle going out without needing to discard!
    }
  };

  // Skip word play and move straight to discard phase
  const handlePassWordPlay = () => {
    if (turnPhase === "play") {
      setTurnPhase("discard");
    }
  };

  const handleDiscardCard = (cardToDiscard: Card) => {
    // 🛡️ Guard 1: Must be human's turn
    if (gameState.currentTurn !== "human") return;

    if (!cardToDiscard || !cardToDiscard.id) return;

    // 1. Remove card from human hand and add to discard pile
    const updatedHand = gameState.humanHand.filter(
      (c) => c.id !== cardToDiscard.id,
    );
    const updatedDiscard = [...gameState.discardPile, cardToDiscard];

    // 2. Check if human went out
    if (updatedHand.length === 0) {
      setGameState((prev) => ({
        ...prev,
        humanHand: updatedHand,
        discardPile: updatedDiscard,
      }));
      handleEndRound("went_out");
      return;
    }

    // 3. Check for Stalemate using your state variable (e.g. hasHumanPlayedThisTurn / hasPlayedThisTurn)
    // If you used hasHumanPlayedThisTurn, keep it here:
    const didPlayWord =
      typeof hasPlayedWordThisTurn !== "undefined"
        ? hasPlayedWordThisTurn
        : false;

    const isPileEmpty = gameState.drawPile.length === 0;
    const nextConsecutivePasses = didPlayWord
      ? 0
      : gameState.consecutivePasses + 1;

    if (isPileEmpty && nextConsecutivePasses >= 2) {
      handleEndRound("stalemate");
      return;
    }

    // 4. Advance turn to Monica
    setGameState((prev) => ({
      ...prev,
      humanHand: updatedHand,
      discardPile: updatedDiscard,
      consecutivePasses: nextConsecutivePasses,
      currentTurn: "computer",
    }));

    setTurnPhase("draw");
    if (typeof setHasPlayedWordThisTurn === "function") {
      setHasPlayedWordThisTurn(false);
    }
  };

  useEffect(() => {
    if (gameState.isRoundOver) return;

    const isDeckEmpty =
      gameState.drawPile.length === 0 && gameState.discardPile.length === 0;

    if (
      gameState.consecutivePasses >= 4 ||
      (isDeckEmpty && gameState.consecutivePasses >= 2)
    ) {
      handleEndRound("stalemate");
    }
  }, [
    gameState.consecutivePasses,
    gameState.drawPile.length,
    gameState.discardPile.length,
    gameState.isRoundOver,
  ]);

  // -------------------------------------------------------------
  // MONICA AI TURN ENGINE (All-Round Safety & Stability with Steal Logic)
  // -------------------------------------------------------------
  useEffect(() => {
    if (gameState.currentTurn === "computer" && !gameState.isRoundOver) {
      setIsAiThinking(true);
      setAiStatusText(`${gameState.botName} is checking hand cards...`);

      // Step 1: Draw Phase Delay
      const timer1 = setTimeout(() => {
        let compHand = [...gameState.computerHand];
        let dPile = [...gameState.drawPile];
        let discPile = [...gameState.discardPile];
        let newBoard = [...gameState.wordBoard]; // 👈 Declared here in timer1 scope so it's fully available

        // 1. Mandatory Draw: Monica draws 1 card
        const drawRes = drawCards(dPile, discPile, 1);
        if (drawRes.drawn.length > 0) {
          compHand.push(drawRes.drawn[0]);
          dPile = drawRes.remainingDraw;
          discPile = drawRes.remainingDiscard;
        }

        // 🌟 WILD SWAP CHECK:
        // Inspect board for Wild Cards and swap if Monica holds the matching letter in hand
        newBoard.forEach((playedWord) => {
          playedWord.cards.forEach((card) => {
            if (card.isWild && card.assignedLetter) {
              const matchingHandCard = compHand.find(
                (c) => c.letter === card.assignedLetter,
              );

              if (matchingHandCard) {
                console.log(
                  `[Computer AI] Swapping '${matchingHandCard.letter}' card for Wild Card on word "${playedWord.word}"`,
                );

                // Execute swap locally in Monica's turn variables
                const reclaimedWildCard: Card = {
                  ...card,
                  assignedLetter: undefined,
                };

                // Replace card in played word
                playedWord.cards = playedWord.cards.map((c) =>
                  c.id === card.id ? matchingHandCard : c,
                );

                // Update Monica's hand (remove matching card, add reclaimed Wild Card)
                compHand = compHand
                  .filter((c) => c.id !== matchingHandCard.id)
                  .concat(reclaimedWildCard);
              }
            }
          });
        });

        setAiStatusText(`${gameState.botName} is looking for word plays...`);

        // Step 2: Word Evaluation & Multi-Play Loop
        const timer2 = setTimeout(() => {
          // NOTE: newBoard is already defined in the outer scope (timer1) with Wild Swaps applied!
          let compRoundScore = gameState.roundScores.computer;
          let humanRoundScore = gameState.roundScores.human;
          let aiPlayedWord = false;

          // Count how many plays Monica has made this match to identify turn 1
          const computerPlaysCount = newBoard.filter(
            (w) => w.playedBy === "computer",
          ).length;
          const isComputerFirstTurn = computerPlaysCount === 0;

          let continueSearching = true;
          let safetyGuard = 0; // Prevents infinite loops

          while (
            continueSearching &&
            compHand.length >= 3 &&
            safetyGuard < 10
          ) {
            safetyGuard++;

            // 🛡️ RULE 1: On Turn 1, cap Monica at 1 word play to keep the game balanced
            if (isComputerFirstTurn && aiPlayedWord) {
              continueSearching = false;
              break;
            }

            // 🦹‍♂️ CHECK FOR WORD STEAL OPPORTUNITY (Medium & Pro difficulty)
            let stealCandidate = null;
            if (gameState.aiDifficulty !== "easy") {
              stealCandidate = findMonicaStealCandidate(
                { ...gameState, computerHand: compHand, wordBoard: newBoard },
                isValidWord,
              );
            }

            if (
              stealCandidate &&
              stealCandidate.cardsFromHand &&
              stealCandidate.cardsFromHand.length >= 2
            ) {
              const cardsNeededCount = stealCandidate.cardsFromHand.length;

              // 🛡️ MANDATORY HAND FLOOR
              if (compHand.length - cardsNeededCount < 1) {
                continueSearching = false;
                break;
              }

              aiPlayedWord = true;

              const targetWord = stealCandidate.targetWord;
              const previousOwner = targetWord.playedBy;
              const previousScore = targetWord.scoreAwarded || 0;

              const newWordLength =
                targetWord.cards.length + stealCandidate.cardsFromHand.length;
              const pointsAwarded = calculateExtensionPoints(
                targetWord.cards.length,
                newWordLength,
              );

              // 🎯 Score Transfer: Deduct from human if stealing human word, award to Monica
              if (previousOwner === "human") {
                humanRoundScore = Math.max(0, humanRoundScore - previousScore);
              }
              compRoundScore += pointsAwarded;

              // Update Board
              newBoard = newBoard.map((w) => {
                if (w.id === targetWord.id) {
                  const existingHistory = w.history || [];
                  return {
                    ...w,
                    word: stealCandidate.newWordText,
                    cards: [...w.cards, ...stealCandidate.cardsFromHand],
                    playedBy: "computer" as const, // 👑 Ownership transferred to Monica
                    scoreAwarded: pointsAwarded,
                    history: [
                      ...existingHistory,
                      {
                        action: "stolen" as const,
                        player: "computer" as const,
                        description: `${gameState.botName} stole "${targetWord.word}" and expanded it into "${stealCandidate.newWordText}" (+${pointsAwarded} pts)`,
                        timestamp: Date.now(),
                      },
                    ],
                  };
                }
                return w;
              });

              // Remove used cards from Monica's hand
              const usedCardIds = new Set(
                stealCandidate.cardsFromHand.map((p) => p.id).filter(Boolean),
              );

              compHand = compHand.filter((c) => {
                if (c.id && usedCardIds.has(c.id)) {
                  usedCardIds.delete(c.id);
                  return false;
                }
                return true;
              });
            } else {
              // 2. FALLBACK TO STANDARD PLAY EVALUATION
              const playResult = findMonicaPlay(
                compHand,
                newBoard,
                gameState.aiDifficulty,
              );

              if (
                playResult &&
                playResult.cardsUsed &&
                playResult.cardsUsed.length > 0
              ) {
                const cardsNeededCount = playResult.cardsUsed.length;

                // 🛡️ RULE 2: MANDATORY HAND FLOOR
                if (compHand.length - cardsNeededCount < 1) {
                  continueSearching = false;
                  break;
                }

                aiPlayedWord = true;

                if (playResult.type === "new_word") {
                  // New Word: Award full score
                  compRoundScore += playResult.score;

                  newBoard.push({
                    id: `word-ai-${Date.now()}-${Math.random()}`,
                    word: playResult.wordText,
                    cards: playResult.cardsUsed,
                    playedBy: "computer",
                    scoreAwarded: playResult.score,
                    history: [
                      {
                        action: "created",
                        player: "computer",
                        description: `${gameState.botName} created "${playResult.wordText}" (+${playResult.score} pts)`,
                        timestamp: Date.now(),
                      },
                    ],
                  });
                } else if (
                  playResult.type === "extension" &&
                  playResult.targetWordId
                ) {
                  const existingWordObj = newBoard.find(
                    (w) => w.id === playResult.targetWordId,
                  );
                  const previousWordScore = existingWordObj
                    ? existingWordObj.scoreAwarded || 0
                    : 0;

                  // 🎯 Extension Fix: Calculate points earned derived from extension vs full new word
                  const extensionPointsGained = Math.max(
                    0,
                    playResult.score - previousWordScore,
                  );

                  // Add only the NEW points gained to Monica's round total
                  compRoundScore +=
                    extensionPointsGained > 0
                      ? extensionPointsGained
                      : playResult.score;

                  newBoard = newBoard.map((w) => {
                    if (w.id === playResult.targetWordId) {
                      const existingHistory = w.history || [];
                      const updatedScore = Math.max(
                        w.scoreAwarded || 0,
                        playResult.score,
                      );

                      return {
                        ...w,
                        word: playResult.wordText,
                        cards: [...w.cards, ...playResult.cardsUsed],
                        scoreAwarded: updatedScore,
                        history: [
                          ...existingHistory,
                          {
                            action: "extended",
                            player: "computer",
                            description: `${gameState.botName} extended word to "${playResult.wordText}" (+${extensionPointsGained > 0 ? extensionPointsGained : playResult.score} pts)`,
                            timestamp: Date.now(),
                          },
                        ],
                      };
                    }
                    return w;
                  });
                }

                // 🎯 SAFE CARD FILTERING: Guarantees exact 1-to-1 card removal by ID
                const usedCardIds = new Set(
                  playResult.cardsUsed.map((p) => p.id).filter(Boolean),
                );

                compHand = compHand.filter((c) => {
                  if (c.id && usedCardIds.has(c.id)) {
                    usedCardIds.delete(c.id);
                    return false;
                  }
                  return true;
                });
              } else {
                // No valid play found in remaining hand
                continueSearching = false;
              }
            }
          }

          // 3. MANDATORY DISCARD PHASE
          // Monica discards 1 card to complete her turn
          const discardedCard = compHand.pop();
          if (discardedCard) {
            discPile.push(discardedCard);
          }

          // 4. CHECK GOING OUT CONDITION
          const aiWentOut = compHand.length === 0;

          // 💡 UPDATE AI STATUS TEXT FIRST SO USER CAN READ IT
          if (!aiPlayedWord) {
            setAiStatusText(
              `${gameState.botName} couldn't play a word and passed — your turn!`,
            );
          } else {
            setAiStatusText(
              `${gameState.botName} played and discarded — your turn!`,
            );
          }

          // ⏱️ Step 3: Pause briefly so the player can comfortably read the status message
          const timer3 = setTimeout(() => {
            setGameState((prev) => ({
              ...prev,
              wordBoard: newBoard,
              roundScores: {
                human: humanRoundScore,
                computer: compRoundScore,
              },
              computerHand: compHand,
              drawPile: dPile,
              discardPile: discPile,
              currentTurn: "human",
              consecutivePasses: aiPlayedWord ? 0 : prev.consecutivePasses + 1,
            }));

            setIsAiThinking(false);

            if (aiWentOut) {
              handleEndRound("went_out");
            }
          }, 2000); // 1.8-second display window

          return () => clearTimeout(timer3);
        }, 2000);

        return () => clearTimeout(timer2);
      }, 1800);

      return () => clearTimeout(timer1);
    }
  }, [gameState.currentTurn, gameState.isRoundOver]);

  // --- ROUND END HANDLER ---
  const handleEndRound = (reason: "went_out" | "stalemate") => {
    setGameState((prev) => {
      // 🛡️ CRITICAL GUARD: Prevent running twice if round is already ended
      if (prev.isRoundOver) return prev;

      // 1. Determine penalties (0 penalty if a player's hand is completely empty)
      const humanPenalty =
        prev.humanHand.length === 0 ? 0 : calculateHandPenalty(prev.humanHand);

      const computerPenalty =
        prev.computerHand.length === 0
          ? 0
          : calculateHandPenalty(prev.computerHand);

      // 2. Net round score (Gross minus Penalty)
      const netHumanRoundScore = prev.roundScores.human - humanPenalty;
      const netCompRoundScore = prev.roundScores.computer - computerPenalty;

      // 3. Add net round score to cumulative match scores
      const newMatchScores = {
        human: prev.matchScores.human + netHumanRoundScore,
        computer: prev.matchScores.computer + netCompRoundScore,
      };

      // 4. Check Match Winner (1,000 pts)
      const isMatchOver =
        newMatchScores.human >= 1000 || newMatchScores.computer >= 1000;
      let matchWinner: "human" | "computer" | "tie" | null = null;

      if (isMatchOver) {
        if (newMatchScores.human > newMatchScores.computer)
          matchWinner = "human";
        else if (newMatchScores.computer > newMatchScores.human)
          matchWinner = "computer";
        else matchWinner = "tie";
      }

      return {
        ...prev,
        // 💡 KEEP roundScores as gross play points (e.g., +140)
        matchScores: newMatchScores, // 👈 Adds Net +130 to Match Total
        isRoundOver: true,
        roundEndReason: reason,
        lastRoundPenalties: { human: humanPenalty, computer: computerPenalty },
        isGameOver: isMatchOver,
        winner: matchWinner,
      };
    });
  };
  // --- START NEXT ROUND HANDLER ---
  const handleStartNextRound = () => {
    // Re-initialize fresh deck, hands, and draw/discard piles
    const deal = dealNewGame();

    setGameState((prev) => ({
      ...prev,
      roundNumber: prev.roundNumber + 1,
      roundScores: { human: 0, computer: 0 },
      consecutivePasses: 0,
      humanHand: deal.humanHand,
      computerHand: deal.computerHand,
      drawPile: deal.drawPile,
      discardPile: deal.discardPile,
      wordBoard: [],
      currentTurn: "human", // Alternating turns can also be added
      isRoundOver: false,
      roundEndReason: null,
    }));

    // Reset turn phase for the new round
    setTurnPhase("draw");
    setStagedCards([]);
    setHasPlayedWordThisTurn(false);
  };

  // --- START NEW MATCH HANDLER ---
  const handleStartNewMatch = () => {
    const deal = dealNewGame();
    setGameState({
      matchScores: { human: 0, computer: 0 },
      roundScores: { human: 0, computer: 0 },
      roundNumber: 1,
      consecutivePasses: 0,
      botName: "Monica",
      aiDifficulty: "medium",
      humanHand: deal.humanHand,
      computerHand: deal.computerHand,
      drawPile: deal.drawPile,
      discardPile: deal.discardPile,
      wordBoard: [],
      currentTurn: "human",
      isRoundOver: false,
      roundEndReason: null,
      isGameOver: false,
      winner: null,
    });

    setTurnPhase("draw");
    setStagedCards([]);
    setHasPlayedWordThisTurn(false);
  };

  // -------------------------------------------------------------
  // 1. EARLY RETURN FOR MAIN MENU / LANDING VIEW
  // -------------------------------------------------------------
  if (!isGameActive) {
    return (
      <>
        <MainMenu
          botName={gameState.botName}
          aiDifficulty={gameState.aiDifficulty}
          onSelectDifficulty={(diff) =>
            setGameState((prev) => ({ ...prev, aiDifficulty: diff }))
          }
          onStartMatch={() => {
            handleStartNewMatch();
            setIsGameActive(true);
          }}
          onOpenRules={() => setIsRulesOpen(true)}
        />
        <RulesModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-neutral-950 p-2 flex flex-col justify-between relative overflow-hidden">
      {/* Dynamic Match Banner & Dynamic Difficulty Selector */}
      <div className="flex flex-col gap-1.5 py-2 px-3 bg-neutral-900/90 rounded-xl border border-neutral-800 shadow-md">
        {/* Scoreboard Row */}
        <div className="flex justify-between items-center text-xs pb-1 border-b border-neutral-800/80">
          {/* Round & Goal Display */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
              R{gameState.roundNumber}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 uppercase">
              Goal: 1,000
            </span>
          </div>

          {/* Rules & Main Menu Navigation Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsRulesOpen(true)}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded text-[10px] font-extrabold border border-cyan-500/30 cursor-pointer transition-colors"
              title="View Rules"
            >
              📖 Rules
            </button>
            <button
              onClick={() => {
                if (
                  window.confirm(
                    "Return to main menu? Your current match progress will be lost.",
                  )
                ) {
                  setIsGameActive(false);
                }
              }}
              className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[10px] font-extrabold border border-neutral-700 cursor-pointer transition-colors"
              title="Main Menu"
            >
              🏠 Menu
            </button>
          </div>
        </div>

        {/* Turn Phase Guidance & AI Status */}
        <div className="text-center">
          {gameState.currentTurn === "human" ? (
            <div>
              {turnPhase === "draw" && (
                <p className="text-xs font-semibold text-amber-400 animate-pulse">
                  Tap Draw Pile or Discard Pile to draw a card
                </p>
              )}
              {turnPhase === "play" && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-cyan-400 font-semibold">
                    Build a word or pass
                  </span>
                  <button
                    onClick={handlePassWordPlay}
                    className="px-2 py-0.5 bg-neutral-800 text-neutral-300 rounded border border-neutral-700 hover:bg-neutral-700 cursor-pointer"
                  >
                    Skip Word Play ➔
                  </button>
                </div>
              )}
              {turnPhase === "discard" && (
                <p className="text-xs font-semibold text-pink-400 animate-pulse">
                  Tap a card in your hand to discard and complete turn
                </p>
              )}
            </div>
          ) : (
            /* ------------------------------------------------------------- */
            /* MONICA & GAME STATUS BANNER (PROMINENT & ENHANCED) */
            /* ------------------------------------------------------------- */
            <div
              className={`w-full max-w-xl mx-auto my-3 p-4 rounded-xl text-center transition-all duration-300 shadow-md ${
                (gameState.currentTurn as PlayerId) === "computer"
                  ? "bg-amber-100 border-2 border-amber-400 text-amber-900"
                  : "bg-emerald-100 border-2 border-emerald-500 text-emerald-900"
              }`}
            >
              <div className="flex items-center justify-center gap-3">
                {/* Animated Status Indicator */}
                <span className="relative flex h-3 w-3">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      (gameState.currentTurn as PlayerId) === "computer"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-3 w-3 ${
                      (gameState.currentTurn as PlayerId) === "computer"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  ></span>
                </span>

                {/* Large, Bold Status Message */}
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-wide">
                  {isAiThinking
                    ? aiStatusText
                    : (gameState.currentTurn as PlayerId) === "human"
                      ? "👉 YOUR TURN!"
                      : aiStatusText || `${gameState.botName}'s Turn...`}
                </h2>
              </div>

              {/* Helpful Subtext Prompt when it's your turn */}
              {(gameState.currentTurn as PlayerId) === "human" &&
                !gameState.isRoundOver && (
                  <p className="text-sm font-bold text-emerald-700 mt-1">
                    Draw a card or select letters to make a word play!
                  </p>
                )}
            </div>
          )}
        </div>
      </div>

      <GameBoard
        gameState={gameState}
        targetBoardWord={targetBoardWord}
        onCardClick={(card) => {
          // 1. Check if the clicked card is an assigned Wild Card on the board
          const isOnBoardWild = gameState.wordBoard.some((word) =>
            word.cards.some((c) => c.id === card.id),
          );

          if (isOnBoardWild && card.isWild && card.assignedLetter) {
            // Find if the human player holds the matching physical card in hand
            const matchingHandCard = gameState.humanHand.find(
              (c) => c.letter === card.assignedLetter,
            );

            if (matchingHandCard) {
              onHumanAttemptWildSwap(card, matchingHandCard);
            } else {
              console.warn(
                `You don't have a '${card.assignedLetter}' card in your hand to swap with this Wild Card!`,
              );
            }
            return;
          }

          // 2. Standard turn phase handling (discarding vs staging)
          if (turnPhase === "discard") {
            handleDiscardCard(card);
          } else {
            handleStageCard(card);
          }
        }}
        onDrawPileClick={() => handleDrawFromPile("draw")}
        onDiscardPileClick={() => handleDrawFromPile("discard")}
        onSelectWordForModification={handleInspectWord}
      />

      <div className="mt-2">
        <Workspace
          stagedCards={stagedCards}
          onRemoveCard={handleUnstageCard}
          onStageCard={handleStageCard}
          onClearWorkspace={handleClearWorkspace}
          onSubmitWord={handleSubmitWord}
          isValidWord={wordValid}
          onReorderCards={setStagedCards}
        />
      </div>

      {/* Turn Actions / Discard Control */}
      <div className="flex flex-col items-center justify-center gap-2 my-3 w-full">
        {/* During Play Phase */}
        {turnPhase === "play" && (
          <div className="flex items-center justify-center gap-3">
            {/* Discard & End Turn Button (Primary Action to transition to Discard Mode) */}
            <button
              onClick={() => {
                // If there are staged cards, return them back to hand first
                if (stagedCards.length > 0) {
                  handleClearWorkspace();
                }
                setTurnPhase("discard");
              }}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <span>Discard & End Turn</span>
            </button>
          </div>
        )}

        {/* Prompt Banner when in Discard Phase */}
        {turnPhase === "discard" && (
          <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 font-medium text-sm animate-pulse shadow-md">
            <span>
              👆 Tap a card from your hand to discard and complete your turn.
            </span>
            <button
              onClick={() => setTurnPhase("play")}
              className="px-2.5 py-1 text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white rounded-lg font-semibold transition border border-neutral-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <WordHistoryModal
        word={inspectingWord}
        onClose={() => setInspectingWord(null)}
        onSelectToModify={(word) => {
          handleSelectWordForModification(word);
        }}
      />

      {/* Round & Match Summary Overlay */}
      <RoundEndModal
        gameState={gameState}
        onNextRound={handleStartNextRound}
        onNewMatch={handleStartNewMatch}
      />
      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />
      {pendingWildCard && (
        <WildCardPickerModal
          isOpen={!!pendingWildCard}
          onSelectLetter={handleSelectWildLetter}
          onCancel={handleCancelWildPicker}
        />
      )}
    </div>
  );
}

export default App;
