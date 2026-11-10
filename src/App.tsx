import { useState, useEffect, useRef } from "react";
import { GameBoard } from "./components/GameBoard";
import { Workspace } from "./components/Workspace";
import { dealNewGame } from "./utils/deckUtils";
import { isValidWord } from "./utils/wordChecker";
import { findMonicaPlay, reorderCardsToMatchWord } from "./utils/aiUtils";
import {
  type GameState,
  type Card,
  type PlayerId,
  type PlayedWord,
  type ScoringMode,
  type GameStatistics,
} from "./types/game";
import {
  calculateWordPoints,
  calculateStealScore,
  calculateHandPenalty,
} from "./utils/scoreUtils";
import { WordHistoryModal } from "./components/WordHistoryModal";

import { MainMenu } from "./components/MainMenu";
import { RulesModal } from "./components/RuleModal";
import { findMonicaStealCandidate } from "./utils/wordSteal";
import { WildCardPickerModal } from "./components/WildCardPickerModal";
import { TradeModal } from "./components/TradeModal";
import { SwapSkipModal } from "./components/SwapSkipModal";
import { WordsPlayedModal } from "./components/WordsPlayedModal";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import {
  getStoredStats,
  saveStoredStats,
  DEFAULT_STATS,
} from "./utils/statsStorage";
import { StatsModal } from "./components/StatsModal";
import { calculateUpdatedStats } from "./utils/statHelper";

// 🛡️ CENTRALIZED HELPER: Placed safely outside the component
const getConstructedWord = (cards: Card[]): string => {
  return cards
    .map((c) => {
      if (c.isWild || c.letter === "WILD") {
        return (c.assignedLetter || "").toUpperCase();
      }
      return (c.letter || "").toUpperCase();
    })
    .join("");
};

// Helper: Auto-replenish hand back to 8 cards from internal deck
const replenishHand = (hand: Card[], deck: Card[], targetSize: number = 8) => {
  const needed = targetSize - hand.length;
  if (needed <= 0 || deck.length === 0) return { newHand: hand, newDeck: deck };

  const drawn = deck.slice(0, needed);
  const newDeck = deck.slice(needed);

  return {
    // 🛡️ Hard clamp ensures the hand NEVER exceeds targetSize (8)
    newHand: [...hand, ...drawn].slice(0, targetSize),
    newDeck,
  };
};

export function App() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const deal = dealNewGame();
    const initialStarter = Math.random() < 0.5 ? "human" : "computer";

    return {
      matchScores: { human: 0, computer: 0 },
      consecutivePasses: 0,
      botName: "Monica",
      aiDifficulty: "medium",
      humanHand: deal.humanHand,
      computerHand: deal.computerHand,
      hasPlayedThisTurn: false,
      deck: deal.deck,
      wordBoard: [],
      currentTurn: initialStarter, // 🎲 Toss-up: 50/50 chance for Human or Monica to start
      scoringMode: "accumulator",
      isGameOver: false,
      winner: null,
      isFirstTurn: true,
    } as GameState;
  });
  const [stagedCards, setStagedCards] = useState<Card[]>([]);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [aiStatusText, setAiStatusText] = useState<string>("");
  const [targetBoardWord, setTargetBoardWord] = useState<PlayedWord | null>(
    null,
  );
  const [inspectingWord, setInspectingWord] = useState<PlayedWord | null>(null);
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);
  const [pendingWildCard, setPendingWildCard] = useState<Card | null>(null);

  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [selectedTradeCardIds, setSelectedTradeCardIds] = useState<string[]>(
    [],
  );
  const [isSwapSkipModalOpen, setIsSwapSkipModalOpen] = useState(false);
  const [isWordsModalOpen, setIsWordsModalOpen] = useState(false);
  const [scoringMode, setScoringMode] = useState<ScoringMode>("accumulator");
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [stats, setStats] = useState<GameStatistics>(getStoredStats);

  useEffect(() => {
    console.log("🔔 isStatsModalOpen state changed to:", isStatsModalOpen);
  }, [isStatsModalOpen]);

  const aiTimerRef = useRef<(() => void) | null>(null);

  const updateStats = (
    newStatsUpdater: (prev: GameStatistics) => GameStatistics,
  ): void => {
    console.log("📊 updateStats FUNCTION TRIGGERED");

    setStats((prev) => {
      console.log("📊 Previous stats state inside setter:", prev);
      const updated = newStatsUpdater(prev);
      console.log("📊 New calculated stats state:", updated);
      saveStoredStats(updated);
      return updated;
    });
  };

  const triggerGameOver = (
    winner: "human" | "computer" | "tie",
    finalHumanScore: number,
    finalComputerScore: number,
    humanLeftover: Card[] = [],
    computerLeftover: Card[] = [],
  ) => {
    if (gameState.isGameOver) return;

    const didHumanWin = winner === "human";
    const wordsPlayedSnapshot = [...matchWordsRef.current];
    matchWordsRef.current = [];

    const humanBingosThisMatch = wordsPlayedSnapshot.filter(
      (word) => word.playerId === "human" && word.isBingo,
    ).length;

    // 1. Record career stats immediately
    updateStats((currentStats: GameStatistics) =>
      calculateUpdatedStats(currentStats, {
        didWin: didHumanWin,
        scoringMode: gameState.scoringMode,
        wordsPlayedThisMatch: wordsPlayedSnapshot.filter(
          (word) => word.playerId === "human",
        ),
        humanScore: finalHumanScore,
        computerScore: finalComputerScore,
        bingosCount: humanBingosThisMatch,
      }),
    );

    // 2. Set leftover hands immediately so player sees final board state
    setGameState((prev) => ({
      ...prev,
      humanLeftoverHand: humanLeftover,
      computerLeftoverHand: computerLeftover,
    }));

    // 3. Pause 3s, THEN trigger game over modal & final adjusted scores
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        matchScores: {
          human: finalHumanScore,
          computer: finalComputerScore,
        },
        isGameOver: true,
        winner,
      }));
    }, 4000);
  };

  const matchWordsRef = useRef<
    {
      word: string;
      score: number;
      playerId: "human" | "computer";
      isBingo?: boolean;
    }[]
  >([]);

  const handleScoringModeChange = (mode: ScoringMode) => {
    setScoringMode(mode); // Updates local state
    setGameState((prev) => ({ ...prev, scoringMode: mode })); // Updates gameState rule
  };

  useEffect(() => {
    // 1. Gather wildcards from all known game locations
    const deckWilds = (gameState.deck || []).filter(
      (c: Card) => c.isWild || c.letter === "WILD",
    );
    const playerWilds = (gameState.humanHand || []).filter(
      (c: Card) => c.isWild || c.letter === "WILD",
    );
    const aiWilds = (gameState.computerHand || []).filter(
      (c: Card) => c.isWild || c.letter === "WILD",
    );

    // Wildcards embedded in words on the board
    const boardWilds = (gameState.wordBoard || [])
      .flatMap((word) => word.cards)
      .filter((c: Card) => c.isWild || c.letter === "WILD");

    const totalWilds =
      deckWilds.length +
      playerWilds.length +
      aiWilds.length +
      boardWilds.length;

    // 2. Alert immediately if wildcard count exceeds 2
    if (totalWilds > 2) {
      console.warn(
        `🚨 EXTRA WILDCARD DETECTED! Total Wildcards in Play: ${totalWilds}`,
      );
      console.log("Locations Snapshot:", {
        deck: deckWilds,
        humanHand: playerWilds,
        computerHand: aiWilds,
        wordBoard: boardWilds,
      });
    }
  }, [gameState]);

  // When tapping a word on the board:
  const handleInspectWord = (playedWord: PlayedWord) => {
    setInspectingWord(playedWord);
  };

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    // -------------------------------------------------------------
    // 🛡️ SAFETY CHECK: OUT-OF-BOUNDS / INVALID DROP RECOVERY
    // -------------------------------------------------------------
    if (!destination) {
      const sourceId = source.droppableId;

      // If dragged from workspace out of bounds, safely return it to the hand
      if (sourceId === "workspace-rack") {
        const droppedCard = stagedCards[source.index];
        if (!droppedCard) return;

        const isWildCard =
          droppedCard.isWild ||
          droppedCard.letter === "WILD" ||
          droppedCard.id?.toUpperCase().includes("WILD") ||
          droppedCard.photoUrl?.toLowerCase().includes("wild");

        const cardToReturn: Card = isWildCard
          ? {
              ...droppedCard,
              assignedLetter: undefined,
              isWild: true,
              letter: "WILD" as any,
            }
          : droppedCard;

        // 1. Remove from staged cards
        setStagedCards((prev) => prev.filter((c) => c.id !== droppedCard.id));

        // 2. Safely add back to player hand
        setGameState((prev) => {
          const updatedHand = Array.from(prev.humanHand);
          if (!updatedHand.some((c) => c.id === cardToReturn.id)) {
            updatedHand.push(cardToReturn);
          }
          return {
            ...prev,
            humanHand: updatedHand,
          };
        });
      }
      return;
    }

    const sourceId = source.droppableId;
    const destId = destination.droppableId;

    // -------------------------------------------------------------
    // 1. REORDERING WITHIN THE PLAYER HAND RACK
    // -------------------------------------------------------------
    if (sourceId === "player-hand" && destId === "player-hand") {
      const reorderedHand = Array.from(gameState.humanHand);
      const [movedCard] = reorderedHand.splice(source.index, 1);
      reorderedHand.splice(destination.index, 0, movedCard);

      setGameState((prev) => ({
        ...prev,
        humanHand: reorderedHand,
      }));
      return;
    }

    // -------------------------------------------------------------
    // 2. REORDERING WITHIN THE WORKSPACE RACK
    // -------------------------------------------------------------
    if (sourceId === "workspace-rack" && destId === "workspace-rack") {
      const reorderedStaged = Array.from(stagedCards);
      const [movedCard] = reorderedStaged.splice(source.index, 1);
      reorderedStaged.splice(destination.index, 0, movedCard);

      setStagedCards(reorderedStaged);
      return;
    }

    // -------------------------------------------------------------
    // 3. STAGING A CARD FROM PLAYER HAND TO WORKSPACE
    // -------------------------------------------------------------
    if (sourceId === "player-hand" && destId === "workspace-rack") {
      const draggedCard = gameState.humanHand[source.index];
      if (!draggedCard) return;

      if (stagedCards.some((c) => c.id === draggedCard.id)) return;

      // 🌟 BULLETPROOF WILD CARD CHECK
      const isWildCard =
        draggedCard.isWild === true ||
        draggedCard.letter === "WILD" ||
        draggedCard.id?.toUpperCase().includes("WILD") ||
        draggedCard.photoUrl?.toLowerCase().includes("wild");

      if (isWildCard && !draggedCard.assignedLetter) {
        console.log("🌟 Triggering Wild Card Modal from Drag & Drop!");
        const normalizedWildCard: Card = {
          ...draggedCard,
          isWild: true,
          letter: "WILD" as any,
        };
        setPendingWildCard(normalizedWildCard);
        return; // Stops drop until letter is chosen in modal
      }

      // Standard staging flow
      setGameState((prev) => ({
        ...prev,
        humanHand: prev.humanHand.filter((c) => c.id !== draggedCard.id),
      }));

      const newStaged = Array.from(stagedCards);
      newStaged.splice(destination.index, 0, draggedCard);
      setStagedCards(newStaged);
      return;
    }

    // -------------------------------------------------------------
    // 4. RETURNING A CARD FROM WORKSPACE BACK TO HAND (Un-staging)
    // -------------------------------------------------------------
    if (sourceId === "workspace-rack" && destId === "player-hand") {
      const removedCard = stagedCards[source.index];
      if (!removedCard) return;

      // 🌟 BULLETPROOF WILD RESET WHEN DRAGGING BACK TO HAND
      const isWildCard =
        removedCard.isWild ||
        removedCard.letter === "WILD" ||
        removedCard.id?.toUpperCase().includes("WILD") ||
        removedCard.photoUrl?.toLowerCase().includes("wild");

      const cardToReturn: Card = isWildCard
        ? {
            ...removedCard,
            assignedLetter: undefined, // Clear the chosen letter
            isWild: true,
            letter: "WILD" as any, // Revert display letter to generic WILD
          }
        : removedCard;

      // 1. Remove from staged cards
      setStagedCards((prev) => prev.filter((c) => c.id !== removedCard.id));

      // 2. Add cleaned card back to player hand at the destination index
      setGameState((prev) => {
        const updatedHand = Array.from(prev.humanHand);
        // Prevent duplicate IDs just in case
        if (!updatedHand.some((c) => c.id === cardToReturn.id)) {
          updatedHand.splice(destination.index, 0, cardToReturn);
        }
        return {
          ...prev,
          humanHand: updatedHand,
        };
      });
      return;
    }
  };

  // -------------------------------------------------------------
  // CARD STAGING / UNSTAGING IN WORKSPACE & WILD CARD HANDLING
  // -------------------------------------------------------------
  const handleStageCard = (card: Card) => {
    if (pendingWildCard) return;

    console.log("➡️ handleStageCard triggered with card:", card);

    if (gameState.currentTurn !== "human") {
      console.warn("Blocked: Not human turn!");
      return;
    }

    // 🛡️ BULLETPROOF CHECK: Catches isWild, "WILD" letter, ID containing WILD, or photo path containing wild
    const isWildCard =
      card.isWild === true ||
      card.letter === "WILD" ||
      card.id?.toUpperCase().includes("WILD") ||
      card.photoUrl?.toLowerCase().includes("wild");

    console.log("Is Wild Detected?", isWildCard);

    if (isWildCard && !card.assignedLetter) {
      console.log("🌟 Triggering Wild Card Modal!");

      // Force normalize the card object so it has everything it needs
      const normalizedWildCard: Card = {
        ...card,
        isWild: true,
        letter: "WILD" as any,
      };

      setPendingWildCard(normalizedWildCard);
      return;
    }

    console.log("📥 Staging card into workspace:", card);
    // Standard staging flow
    setGameState((prev) => ({
      ...prev,
      humanHand: prev.humanHand.filter((c) => c.id !== card.id),
    }));

    setStagedCards((prev) => {
      const nextStaged = [...prev, card];

      // 🔍 LOG THE EXACT WORD STRING PRODUCED BY STAGED CARDS USING CENTRAL HELPER
      const constructedWord = getConstructedWord(nextStaged);

      console.log("🧪 Staged Cards:", nextStaged);
      console.log("🧪 Constructed Word String:", `"${constructedWord}"`);
      console.log(
        "🧪 Dictionary Validation Result:",
        isValidWord(constructedWord),
      );

      return nextStaged;
    });
  };

  // Called when player picks a letter in WildCardPickerModal
  const handleSelectWildLetter = (selectedLetter: string) => {
    if (!pendingWildCard) return;

    const configuredWildCard: Card = {
      ...pendingWildCard,
      assignedLetter: selectedLetter.toUpperCase(),
    };
    console.log("🎯 Wild Card Assigned:", configuredWildCard);

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
      // 🛡️ Bulletproof wild reset when unstaging back to hand
      const isWildCard = card.isWild || card.letter === "WILD";
      const cardToReturn = isWildCard
        ? {
            ...card,
            assignedLetter: undefined,
            isWild: true,
            letter: "WILD" as any,
          }
        : card;

      setGameState((prev) => {
        // 🛡️ SAFETY GUARD: Prevent duplicate IDs in humanHand
        const filteredHand = prev.humanHand.filter(
          (c) => c.id !== cardToReturn.id,
        );
        return {
          ...prev,
          humanHand: [...filteredHand, cardToReturn],
        };
      });
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
    const isWild = targetWildCard.isWild || targetWildCard.letter === "WILD";
    const assigned = (targetWildCard.assignedLetter || "").toUpperCase();
    if (!isWild || !assigned) {
      console.warn("Blocked: Target card is not an assigned Wild Card!");
      return;
    }

    if ((handCard.letter || "").toUpperCase() !== assigned) {
      console.warn(
        `Blocked: Hand card '${handCard.letter}' does not match Wild Card assigned letter '${assigned}'!`,
      );
      return;
    }

    // Reset assigned letter before returning Wild Card to hand
    const reclaimedWildCard: Card = {
      ...targetWildCard,
      assignedLetter: undefined,
      isWild: true,
      letter: "WILD" as any,
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

      // Update the correct player's hand with strict ID deduplication
      if (playerId === "human") {
        const updatedHand = prev.humanHand
          .filter(
            (c: Card) => c.id !== handCard.id && c.id !== reclaimedWildCard.id,
          )
          .concat(reclaimedWildCard);

        return {
          ...prev,
          wordBoard: updatedWordBoard,
          humanHand: updatedHand,
        };
      } else {
        const updatedHand = prev.computerHand
          .filter(
            (c: Card) => c.id !== handCard.id && c.id !== reclaimedWildCard.id,
          )
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
    if (gameState.currentTurn !== "human") {
      console.warn("Blocked: You can only swap Wild Cards during your turn!");
      return;
    }

    const assigned = (targetWildCard.assignedLetter || "").toUpperCase();
    const handLetter = (handCard.letter || "").toUpperCase();

    if (handLetter !== assigned) {
      console.warn(
        `Blocked: You must use a '${assigned}' card to swap this Wild Card!`,
      );
      return;
    }

    handleWildSwap(targetWildCard, handCard, "human");
  };

  const handleClearWorkspace = () => {
    // 🛡️ Bulletproof Wild Card reset helper
    const resetWildCard = (card: Card): Card =>
      card.isWild || card.letter === "WILD"
        ? {
            ...card,
            assignedLetter: undefined,
            isWild: true,
            letter: "WILD" as any,
          }
        : card;

    let handCardsToReturn: Card[] = [];

    if (targetBoardWord) {
      const originalCardIds = new Set(targetBoardWord.cards.map((c) => c.id));

      handCardsToReturn = stagedCards
        .filter((c) => !originalCardIds.has(c.id))
        .map(resetWildCard);

      setTargetBoardWord(null);
    } else {
      handCardsToReturn = stagedCards.map(resetWildCard);
    }

    // 🛡️ Safe state update with strict ID deduplication
    setGameState((prev) => {
      const returningIds = new Set(handCardsToReturn.map((c) => c.id));
      const filteredHand = prev.humanHand.filter(
        (c) => !returningIds.has(c.id),
      );

      return {
        ...prev,
        humanHand: [...filteredHand, ...handCardsToReturn],
      };
    });

    setStagedCards([]);
  };

  // Handler when user taps a word on the board:
  const handleSelectWordForModification = (playedWord: PlayedWord) => {
    // 🛡️ Guard: Must be human's turn
    if (gameState.currentTurn !== "human") return;

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

  // -------------------------------------------------------------
  // SUBMIT WORD HANDLER (New Words, Steals, Hand Auto-Refill)
  // -------------------------------------------------------------
  const handleSubmitWord = () => {
    const isStandaloneWord = targetBoardWord === null;

    // 🛡️ Guard: Only 1 action allowed per turn on Turn 2+
    if (!gameState.isFirstTurn && gameState.hasPlayedThisTurn) {
      setAiStatusText("⚠️ You have already taken an action this turn.");
      return;
    }

    // 🛡️ Guard: Must be human turn
    if (gameState.currentTurn !== "human") return;

    // 🛡️ 1. BUILD PROPOSED WORD STRING USING CENTRAL HELPER
    const proposedWordText = getConstructedWord(stagedCards);

    // 🛡️ 2. CHECK FOR UNASSIGNED WILD CARDS
    const containsUnassignedWild = stagedCards.some(
      (c) => (c.isWild || c.letter === "WILD") && !c.assignedLetter,
    );

    if (containsUnassignedWild) {
      alert("Please assign a letter to all Wild Cards before submitting!");
      return;
    }

    if (proposedWordText.length < 2) {
      alert("Words must be at least 2 letters long!");
      return;
    }

    if (!isValidWord(proposedWordText)) {
      alert(`"${proposedWordText}" is not a valid dictionary word!`);
      return;
    }

    // 🛡️ 3. FIRST TURN RULE ENFORCEMENT
    if (gameState.isFirstTurn && !isStandaloneWord) {
      alert("On Turn 1, players can only play a single standalone word!");
      return;
    }

    let updatedDeck = [...gameState.deck];

    if (!isStandaloneWord && targetBoardWord) {
      // 🛡️ Guard: Ensure target word still exists in current game state
      const activeTarget = gameState.wordBoard.find(
        (w) => w.id === targetBoardWord.id,
      );
      if (!activeTarget) {
        alert(
          "The target word was modified or removed. Please select a word again.",
        );
        setTargetBoardWord(null);
        return;
      }

      // --- MODIFICATION, EXTENSION & STEALING LOGIC (Turn 2+) ---
      const originalCardIds = new Set(activeTarget.cards.map((c) => c.id));
      const currentStagedIds = new Set(stagedCards.map((c) => c.id));

      const newCardsFromHand = stagedCards.filter(
        (c) => !originalCardIds.has(c.id),
      );

      if (newCardsFromHand.length < 1) {
        alert(
          "You must add at least one letter from your hand to modify or steal a word!",
        );
        return;
      }

      const missingOriginalCards = activeTarget.cards.some(
        (c) => !currentStagedIds.has(c.id),
      );

      if (missingOriginalCards) {
        alert(
          "You must use all letters from the original word when modifying or stealing!",
        );
        return;
      }

      const isOpponentWord = activeTarget.playedBy !== "human";
      const previousOwner = activeTarget.playedBy;
      const previousScore = activeTarget.scoreAwarded || 0;
      const cardsAddedCount = newCardsFromHand.length;

      // 🧮 SCORING CALCULATION
      let basePoints = 0;
      if (isOpponentWord) {
        basePoints = calculateStealScore(stagedCards, cardsAddedCount);
      } else {
        basePoints = calculateWordPoints(stagedCards);
      }

      // 🌟 BINGO BONUS: Universal check (8 cards from hand in one turn)
      const isEightLetterBingo = newCardsFromHand.length === 8;
      const bingoBonus = isEightLetterBingo ? 50 : 0;
      const pointsAwarded = basePoints + bingoBonus;

      if (isEightLetterBingo) {
        setAiStatusText(`🎉 BINGO! Used all 8 letters for a +50 bonus!`);
      }

      matchWordsRef.current.push({
        word: proposedWordText,
        score: pointsAwarded,
        playerId: "human",
        isBingo: isEightLetterBingo,
      });

      const existingHistory = activeTarget.history || [];
      const updatedPlayedWord: PlayedWord = {
        id: activeTarget.id,
        word: proposedWordText,
        cards: [...stagedCards],
        playedBy: "human",
        originalWord: activeTarget.originalWord || (activeTarget as any).word,
        scoreAwarded: (activeTarget.scoreAwarded || 0) + pointsAwarded,
        history: [
          ...existingHistory,
          {
            action: isOpponentWord ? "stolen" : "extended",
            player: "human",
            description: isEightLetterBingo
              ? isOpponentWord
                ? `🎉 BINGO! Stole "${activeTarget.word}" with all 8 tiles into "${proposedWordText}" (+${pointsAwarded} pts)!`
                : `🎉 BINGO! Extended "${activeTarget.word}" with all 8 tiles into "${proposedWordText}" (+${pointsAwarded} pts)!`
              : isOpponentWord
                ? `⚡ Stole "${activeTarget.word}" with ${cardsAddedCount} added letter(s) into "${proposedWordText}" (+${pointsAwarded} pts)!`
                : `Extended "${activeTarget.word}" into "${proposedWordText}" (+${pointsAwarded} pts).`,
            timestamp: Date.now(),
          },
        ],
      };

      const updatedWordBoard = gameState.wordBoard.map((w) =>
        w.id === activeTarget.id ? updatedPlayedWord : w,
      );

      const usedHandCardIds = new Set(newCardsFromHand.map((c) => c.id));
      const remainingHandRaw = gameState.humanHand.filter(
        (handCard) => !usedHandCardIds.has(handCard.id),
      );

      const { newHand: rawRemainingHand, newDeck } = replenishHand(
        remainingHandRaw,
        updatedDeck,
        8,
      );
      const remainingHand = rawRemainingHand.slice(0, 8);
      updatedDeck = newDeck;

      // 🛡️ UPDATED GAME-OVER CHECK
      const isMatchOver =
        updatedDeck.length === 0 &&
        (remainingHand.length === 0 || (gameState.consecutivePasses ?? 0) >= 4);

      let finalMatchScores: Record<"human" | "computer", number> = {
        human: gameState.matchScores.human + pointsAwarded,
        computer: gameState.matchScores.computer,
      };

      if (isOpponentWord && previousOwner && previousOwner !== "human") {
        if (gameState.scoringMode === "cutthroat") {
          const currentOwnerScore =
            finalMatchScores[previousOwner as "human" | "computer"] ?? 0;

          finalMatchScores[previousOwner as "human" | "computer"] = Math.max(
            0,
            currentOwnerScore - previousScore,
          );
        }
      }

      let matchWinner: "human" | "computer" | "tie" | "draw" | null = null;

      if (isMatchOver) {
        const humanPenalty = calculateHandPenalty(remainingHand);
        const compPenalty = calculateHandPenalty(gameState.computerHand);

        finalMatchScores = {
          human: Math.max(0, finalMatchScores.human - humanPenalty),
          computer: Math.max(0, finalMatchScores.computer - compPenalty),
        };

        if (finalMatchScores.human > finalMatchScores.computer) {
          matchWinner = "human";
        } else if (finalMatchScores.computer > finalMatchScores.human) {
          matchWinner = "computer";
        } else {
          matchWinner = "tie";
        }

        triggerGameOver(
          matchWinner,
          finalMatchScores.human,
          finalMatchScores.computer,
          remainingHand,
          gameState.computerHand,
        );
      }

      if (!isMatchOver && !isEightLetterBingo) {
        setAiStatusText(
          `${gameState.botName} is taking her turn after your word play...`,
        );
      }

      setGameState((prev) => ({
        ...prev,
        wordBoard: updatedWordBoard,
        matchScores: finalMatchScores,
        humanHand: remainingHand,
        deck: updatedDeck,
        hasPlayedThisTurn: false,
        consecutivePasses: 0,
        isGameOver: isMatchOver,
        winner: matchWinner,
        currentTurn: isMatchOver ? "human" : "computer",
        humanLeftoverHand: isMatchOver ? remainingHand : prev.humanLeftoverHand,
        computerLeftoverHand: isMatchOver
          ? prev.computerHand
          : prev.computerLeftoverHand,
      }));
    } else if (isStandaloneWord) {
      // --- STANDARD NEW WORD PLAY ---
      const basePoints = calculateWordPoints(stagedCards);

      // 🌟 BINGO BONUS: Universal check for standalone words (8 cards staged = 8 cards from hand)
      const isEightLetterBingo = stagedCards.length === 8;
      const bingoBonus = isEightLetterBingo ? 50 : 0;
      const pointsAwarded = basePoints + bingoBonus;

      if (isEightLetterBingo) {
        setAiStatusText(`🎉 BINGO! Used all 8 letters for a +50 bonus!`);
      }

      matchWordsRef.current.push({
        word: proposedWordText,
        score: pointsAwarded,
        playerId: "human",
        isBingo: isEightLetterBingo,
      });

      const newPlayedWord: PlayedWord = {
        id: `word-${Date.now()}`,
        word: proposedWordText,
        cards: [...stagedCards],
        playedBy: "human",
        scoreAwarded: pointsAwarded,
        history: [
          {
            action: "created",
            player: "human",
            description: isEightLetterBingo
              ? `🎉 BINGO! Created "${proposedWordText}" using all 8 tiles (+${pointsAwarded} pts)!`
              : `Created new word "${proposedWordText}" for ${pointsAwarded} points.`,
            timestamp: Date.now(),
          },
        ],
      };

      const usedHandCardIds = new Set(stagedCards.map((c) => c.id));
      const remainingHandRaw = gameState.humanHand.filter(
        (handCard) => !usedHandCardIds.has(handCard.id),
      );

      const { newHand: rawRemainingHand, newDeck } = replenishHand(
        remainingHandRaw,
        updatedDeck,
        8,
      );
      const remainingHand = rawRemainingHand.slice(0, 8);
      updatedDeck = newDeck;

      const isMatchOver =
        updatedDeck.length === 0 &&
        (remainingHand.length === 0 || (gameState.consecutivePasses ?? 0) >= 4);

      let finalMatchScores = {
        human: gameState.matchScores.human + pointsAwarded,
        computer: gameState.matchScores.computer,
      };

      let matchWinner: "human" | "computer" | "tie" | "draw" | null = null;

      if (isMatchOver) {
        const humanPenalty = calculateHandPenalty(remainingHand);
        const compPenalty = calculateHandPenalty(gameState.computerHand);

        finalMatchScores = {
          human: Math.max(0, finalMatchScores.human - humanPenalty),
          computer: Math.max(0, finalMatchScores.computer - compPenalty),
        };

        if (finalMatchScores.human > finalMatchScores.computer) {
          matchWinner = "human";
        } else if (finalMatchScores.computer > finalMatchScores.human) {
          matchWinner = "computer";
        } else {
          matchWinner = "tie";
        }

        triggerGameOver(
          matchWinner,
          finalMatchScores.human,
          finalMatchScores.computer,
          remainingHand,
          gameState.computerHand,
        );
      }

      if (!isMatchOver && !isEightLetterBingo) {
        setAiStatusText(`${gameState.botName} is taking her turn...`);
      }

      setGameState((prev) => ({
        ...prev,
        wordBoard: [...prev.wordBoard, newPlayedWord],
        matchScores: finalMatchScores,
        humanHand: remainingHand,
        deck: updatedDeck,
        isFirstTurn: false,
        hasPlayedThisTurn: false,
        currentTurn: isMatchOver ? "human" : "computer",
        consecutivePasses: 0,
        isGameOver: isMatchOver,
        winner: matchWinner,
        humanLeftoverHand: isMatchOver ? remainingHand : prev.humanLeftoverHand,
        computerLeftoverHand: isMatchOver
          ? prev.computerHand
          : prev.computerLeftoverHand,
      }));
    }

    setStagedCards([]);
    setTargetBoardWord(null);
  };
  // -------------------------------------------------------------
  // TURN ENDING ACTIONS: PASS & TRADE
  // -------------------------------------------------------------

  // 2. TRADE CARDS: Swap selected hand cards with deck and pass turn
  const handleTradeCards = (cardsToTrade: Card[]) => {
    if (gameState.currentTurn !== "human") return;

    if (!cardsToTrade || cardsToTrade.length === 0) {
      alert("Please select at least one card to trade!");
      return;
    }

    if (gameState.deck.length < cardsToTrade.length) {
      alert("Not enough cards remaining in the deck to trade!");
      return;
    }

    // Reset staging workspace
    handleClearWorkspace();

    // Remove traded cards from human hand
    const tradeIds = new Set(cardsToTrade.map((c) => c.id));
    const remainingHand = gameState.humanHand.filter(
      (c) => !tradeIds.has(c.id),
    );

    // Draw equal number of replacement cards from deck
    const drawnCards = gameState.deck.slice(0, cardsToTrade.length);

    // Return traded cards back into the deck and shuffle deck pool
    const poolWithTraded = [
      ...gameState.deck.slice(cardsToTrade.length),
      ...cardsToTrade,
    ];
    const updatedDeck = poolWithTraded.sort(() => Math.random() - 0.5);

    const updatedHand = [...remainingHand, ...drawnCards];

    // Reset pass counter on trade action
    setGameState((prev) => ({
      ...prev,
      humanHand: updatedHand,
      deck: updatedDeck,
      consecutivePasses: 0,
      currentTurn: "computer",
    }));

    setAiStatusText(`${gameState.botName} is thinking...`);
  };

  // Toggle card selection inside the trade modal
  const handleToggleTradeCardSelection = (cardId: string) => {
    setSelectedTradeCardIds((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId],
    );
  };

  // Confirm and execute trade
  const handleExecuteTradeAction = () => {
    const cardsToTrade = gameState.humanHand.filter((c) =>
      selectedTradeCardIds.includes(c.id),
    );

    handleTradeCards(cardsToTrade);
    setIsTradeModalOpen(false);
    setSelectedTradeCardIds([]);
  };

  // -------------------------------------------------------------
  // STALEMATE & ENDGAME MONITORING
  // -------------------------------------------------------------
  useEffect(() => {
    if (gameState.isGameOver) return;

    if (gameState.deck.length === 0 && gameState.consecutivePasses >= 4) {
      const humanPenalty = calculateHandPenalty(gameState.humanHand);
      const compPenalty = calculateHandPenalty(gameState.computerHand);

      let adjustedHumanScore = Math.max(
        0,
        gameState.matchScores.human - humanPenalty,
      );
      let adjustedCompScore = Math.max(
        0,
        gameState.matchScores.computer - compPenalty,
      );

      let matchWinner: PlayerId | "tie" = "tie";
      if (adjustedHumanScore > adjustedCompScore) matchWinner = "human";
      else if (adjustedCompScore > adjustedHumanScore) matchWinner = "computer";

      // 🚀 Hand off to our delayed trigger function!
      triggerGameOver(
        matchWinner,
        adjustedHumanScore,
        adjustedCompScore,
        gameState.humanHand,
        gameState.computerHand,
      );
    }
  }, [
    gameState.deck.length,
    gameState.consecutivePasses,
    gameState.isGameOver,
    gameState.matchScores,
    gameState.humanHand,
    gameState.computerHand,
  ]);
  // -------------------------------------------------------------
  // MONICA AI TURN ENGINE (Continuous Phase-Less Flow & Steal Mechanics)
  // -------------------------------------------------------------
  useEffect(() => {
    if (gameState.currentTurn !== "computer" || gameState.isGameOver) return;

    setIsAiThinking(true);

    let timer0: ReturnType<typeof setTimeout>;
    let timer1: ReturnType<typeof setTimeout>;
    let timer2: ReturnType<typeof setTimeout>;
    let timer3: ReturnType<typeof setTimeout>;

    // 🕒 Delay before Monica replaces the Coin Toss announcement message
    const initialDelay = gameState.isFirstTurn ? 2200 : 0;

    timer0 = setTimeout(() => {
      setAiStatusText(`${gameState.botName} is looking for plays...`);
    }, initialDelay);

    // 🛡️ SAFETY GUARD: Ensure any Wild Cards played by Monica have assignedLetter resolved
    const sanitizeAiCards = (
      cards: Card[],
      wordText: string,
      startIndex: number = 0,
    ): Card[] => {
      return cards.map((card, index) => {
        if (card.isWild || card.letter === "WILD") {
          const targetIndex = startIndex + index;
          const inferredLetter =
            card.assignedLetter || (wordText ? wordText[targetIndex] : "A");
          return {
            ...card,
            isWild: true,
            letter: "WILD" as any,
            assignedLetter: (inferredLetter || "A").toUpperCase(),
          };
        }
        return card;
      });
    };

    timer1 = setTimeout(() => {
      let compHand = [...gameState.computerHand];
      let currentDeck = [...gameState.deck];
      // Immutably clone wordBoard structure
      let newBoard = gameState.wordBoard.map((w) => ({
        ...w,
        cards: [...w.cards],
      }));

      // 🌟 TRACK IF A WILD SWAP OCCURRED
      let wildSwapOccurred = false;
      let swappedLetter = "";

      newBoard = newBoard.map((playedWord) => {
        const updatedCards = playedWord.cards.map((card) => {
          if (card.isWild && card.assignedLetter) {
            const matchingHandCard = compHand.find(
              (c) => c.letter === card.assignedLetter,
            );

            if (matchingHandCard) {
              wildSwapOccurred = true;
              swappedLetter = matchingHandCard.letter;

              const reclaimedWildCard: Card = {
                ...card,
                id: `WILD-reclaimed-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                isWild: true,
                letter: "WILD" as any,
                assignedLetter: undefined,
              };

              compHand = [
                ...compHand.filter((c) => c.id !== matchingHandCard.id),
                reclaimedWildCard,
              ];

              return matchingHandCard;
            }
          }
          return card;
        });

        return { ...playedWord, cards: updatedCards };
      });

      // 🃏 HANDLE WILD SWAP STATUS ANNOUNCEMENT WITH TIMED QUEUE
      if (wildSwapOccurred) {
        setAiStatusText(
          `🃏 ${gameState.botName} traded ${swappedLetter} for a Wild Card!`,
        );
      }

      // Step 2: Word Evaluation & Play Execution
      timer2 = setTimeout(
        () => {
          let compMatchScore = gameState.matchScores.computer;
          let humanMatchScore = gameState.matchScores.human;
          let aiPlayedWord = false;
          let statusAnnouncement = "";

          // If a wild swap already set a toast, let it linger for a bit before replacing
          if (wildSwapOccurred) {
            statusAnnouncement = `🃏 ${gameState.botName} traded ${swappedLetter} for a Wild Card!`;
          }

          const isFirstTurn = gameState.isFirstTurn;

          // 🦹‍♂️ 1. CHECK FOR WORD STEAL OPPORTUNITY (Turn 2+ only, Medium/Pro difficulty)
          let stealCandidate = null;
          if (!isFirstTurn && gameState.aiDifficulty !== "easy") {
            stealCandidate = findMonicaStealCandidate(
              { ...gameState, computerHand: compHand, wordBoard: newBoard },
              isValidWord,
            );
          }

          if (
            stealCandidate &&
            stealCandidate.cardsFromHand &&
            stealCandidate.cardsFromHand.length >= 1
          ) {
            aiPlayedWord = true;
            const targetWord = stealCandidate.targetWord;
            const previousOwner = targetWord.playedBy;
            const previousScore = targetWord.scoreAwarded || 0;

            const fullCardsArray =
              "totalCards" in stealCandidate &&
              Array.isArray((stealCandidate as any).totalCards)
                ? (stealCandidate as any).totalCards
                : "newWordCards" in stealCandidate &&
                    Array.isArray((stealCandidate as any).newWordCards)
                  ? (stealCandidate as any).newWordCards
                  : [
                      ...targetWord.cards,
                      ...(stealCandidate.cardsFromHand || []),
                    ];

            const correctlyOrderedStealCards = reorderCardsToMatchWord(
              fullCardsArray,
              stealCandidate.newWordText,
            );

            const cardsAddedCount = stealCandidate.cardsFromHand.length;
            const basePoints = calculateStealScore(
              correctlyOrderedStealCards,
              cardsAddedCount,
            );

            // 🌟 BINGO CHECK FOR STEALS/EXTENSIONS (Must use all 8 tiles from hand)
            const isEightLetterBingo =
              (stealCandidate.cardsFromHand?.length || 0) === 8;
            const bingoBonus = isEightLetterBingo ? 50 : 0;
            const pointsAwarded = basePoints + bingoBonus;

            compMatchScore += pointsAwarded;

            // 📊 RECORD MONICA'S STEAL FOR MATCH HISTORY
            matchWordsRef.current.push({
              word: stealCandidate.newWordText,
              score: pointsAwarded,
              playerId: "computer",
              isBingo: isEightLetterBingo,
            });

            if (previousOwner === "human") {
              const stolenWordText =
                targetWord.originalWord ||
                (targetWord as any).word ||
                getConstructedWord(targetWord.cards) ||
                "word";

              const newWordText = stealCandidate.newWordText || "a new word";

              if (gameState.scoringMode === "cutthroat") {
                humanMatchScore = Math.max(0, humanMatchScore - previousScore);
              }
              statusAnnouncement = isEightLetterBingo
                ? `🎉 ${gameState.botName} scored a BINGO using all 8 letters! Stole "${stolenWordText}" into "${newWordText}" (+${pointsAwarded} pts)!`
                : `⚡ ${gameState.botName} stole your word "${stolenWordText}" to make "${newWordText}" (+${pointsAwarded} pts)!`;
            } else {
              const baseWordText =
                targetWord?.originalWord || targetWord?.word || "word";
              const newWordText = stealCandidate?.newWordText || "a new word";
              statusAnnouncement = isEightLetterBingo
                ? `🎉 ${gameState.botName} scored an 8-letter BINGO! Expanded "${baseWordText}" into "${newWordText}" (+${pointsAwarded} pts)!`
                : `${gameState.botName} expanded her word "${baseWordText}" into "${newWordText}" (+${pointsAwarded} pts)`;
            }

            newBoard = newBoard.map((w) => {
              if (w.id === targetWord.id) {
                const existingHistory = w.history || [];
                return {
                  ...w,
                  word: stealCandidate.newWordText,
                  cards: correctlyOrderedStealCards,
                  playedBy: "computer" as const,
                  scoreAwarded: pointsAwarded,
                  originalWord: targetWord.originalWord || targetWord.word,
                  history: [
                    ...existingHistory,
                    {
                      action: (previousOwner === "human"
                        ? "stolen"
                        : "extended") as any,
                      player: "computer" as const,
                      description: isEightLetterBingo
                        ? `🎉 ${gameState.botName} scored a BINGO! Stole "${targetWord.originalWord || targetWord.word}" and expanded it into "${stealCandidate.newWordText}" (+${pointsAwarded} pts)`
                        : `${gameState.botName} stole "${targetWord.originalWord || targetWord.word}" and expanded it into "${stealCandidate.newWordText}" (+${pointsAwarded} pts)`,
                      timestamp: Date.now(),
                    },
                  ],
                };
              }
              return w;
            });

            const usedCardIds = new Set(
              (stealCandidate.cardsFromHand || [])
                .map((c) => c.id)
                .filter(Boolean),
            );

            compHand = compHand.filter((c) => c.id && !usedCardIds.has(c.id));
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
              aiPlayedWord = true;

              if (playResult.type === "new_word") {
                const basePoints = playResult.score;

                // 🌟 BINGO CHECK FOR STANDARD NEW WORD PLAY (Must use all 8 tiles from hand)
                const isEightLetterBingo = playResult.cardsUsed.length === 8;
                const bingoBonus = isEightLetterBingo ? 50 : 0;
                const totalPoints = basePoints + bingoBonus;

                compMatchScore += totalPoints;

                const sanitizedNewCards = sanitizeAiCards(
                  playResult.cardsUsed,
                  playResult.wordText,
                  0,
                );

                statusAnnouncement = isEightLetterBingo
                  ? `🎉 ${gameState.botName} hit an 8-letter BINGO playing "${playResult.wordText}" (+${totalPoints} pts)!`
                  : `${gameState.botName} played "${playResult.wordText}" (+${playResult.score} pts)!`;

                newBoard.push({
                  id: `word-ai-${Date.now()}-${Math.random()}`,
                  word: playResult.wordText,
                  originalWord: playResult.wordText,
                  cards: sanitizedNewCards,
                  playedBy: "computer",
                  scoreAwarded: totalPoints,
                  history: [
                    {
                      action: "created",
                      player: "computer",
                      description: isEightLetterBingo
                        ? `🎉 ${gameState.botName} hit an 8-letter BINGO creating "${playResult.wordText}" (+${totalPoints} pts)`
                        : `${gameState.botName} created "${playResult.wordText}" (+${totalPoints} pts)`,
                      timestamp: Date.now(),
                    },
                  ],
                });

                // 📊 RECORD MONICA'S PLAY FOR MATCH HISTORY
                matchWordsRef.current.push({
                  word: playResult.wordText,
                  score: totalPoints,
                  playerId: "computer",
                  isBingo: isEightLetterBingo,
                });
              } else if (
                !isFirstTurn &&
                playResult.type === "extension" &&
                playResult.targetWordId
              ) {
                const existingWordObj = newBoard.find(
                  (w) => w.id === playResult.targetWordId,
                );
                const previousOwner = existingWordObj?.playedBy;
                const previousScore = existingWordObj?.scoreAwarded || 0;

                const sanitizedExtensionCards = sanitizeAiCards(
                  playResult.cardsUsed,
                  playResult.wordText,
                  0,
                );

                const correctlyOrderedExtensionCards = reorderCardsToMatchWord(
                  sanitizedExtensionCards,
                  playResult.wordText,
                );

                const originalCardIds = new Set(
                  existingWordObj?.cards.map((c) => c.id) || [],
                );
                const cardsAddedFromHand =
                  correctlyOrderedExtensionCards.filter(
                    (c) => !originalCardIds.has(c.id),
                  );
                const cardsAddedCount = cardsAddedFromHand.length;

                const basePoints = calculateStealScore(
                  correctlyOrderedExtensionCards,
                  cardsAddedCount,
                );

                // 🌟 BINGO CHECK FOR EXTENSIONS (Must use all 8 tiles strictly from hand)
                const isEightLetterBingo = cardsAddedFromHand.length === 8;
                const bingoBonus = isEightLetterBingo ? 50 : 0;
                const pointsAwarded = basePoints + bingoBonus;

                compMatchScore += pointsAwarded;

                matchWordsRef.current.push({
                  word: playResult.wordText,
                  score: pointsAwarded,
                  playerId: "computer",
                  isBingo: isEightLetterBingo,
                });

                if (previousOwner === "human") {
                  const stolenRootName =
                    existingWordObj?.originalWord ||
                    existingWordObj?.word ||
                    "word";
                  if (gameState.scoringMode === "cutthroat") {
                    humanMatchScore = Math.max(
                      0,
                      humanMatchScore - previousScore,
                    );
                  }
                  statusAnnouncement = isEightLetterBingo
                    ? `🎉 ${gameState.botName} scored a BINGO! Stole your word "${stolenRootName}" into "${playResult.wordText}" (+${pointsAwarded} pts)!`
                    : `⚡ ${gameState.botName} stole your word "${stolenRootName}" and expanded it to "${playResult.wordText}" (+${pointsAwarded} pts)!`;
                } else {
                  statusAnnouncement = isEightLetterBingo
                    ? `🎉 ${gameState.botName} scored an 8-letter BINGO expanding a word to "${playResult.wordText}" (+${pointsAwarded} pts)!`
                    : `${gameState.botName} extended a word to "${playResult.wordText}" (+${pointsAwarded} pts)`;
                }

                newBoard = newBoard.map((w): PlayedWord => {
                  if (w.id === playResult.targetWordId) {
                    const existingHistory = w.history || [];
                    return {
                      ...w,
                      word: playResult.wordText,
                      cards: correctlyOrderedExtensionCards,
                      playedBy: "computer",
                      scoreAwarded: pointsAwarded,
                      originalWord:
                        existingWordObj?.originalWord || existingWordObj?.word,
                      history: [
                        ...existingHistory,
                        {
                          action: (previousOwner === "human"
                            ? "stolen"
                            : "extended") as any,
                          player: "computer",
                          description: isEightLetterBingo
                            ? `🎉 ${gameState.botName} scored a BINGO! Stole word to "${playResult.wordText}" (+${pointsAwarded} pts)`
                            : `${gameState.botName} stole word to "${playResult.wordText}" (+${pointsAwarded} pts)`,
                          timestamp: Date.now(),
                        },
                      ],
                    };
                  }
                  return w;
                });
              }

              const usedHandCardIds = new Set(
                playResult.cardsUsed.map((c) => c.id).filter(Boolean),
              );

              compHand = compHand.filter(
                (c) => c.id && !usedHandCardIds.has(c.id),
              );
            }
          }

          // 🔄 AUTO-REFILL HAND TO 8 CARDS IF A PLAY WAS MADE
          if (aiPlayedWord) {
            const cardsNeeded = 8 - compHand.length;
            if (cardsNeeded > 0 && currentDeck.length > 0) {
              const drawnCards = currentDeck.slice(0, cardsNeeded);
              currentDeck = currentDeck.slice(cardsNeeded);

              const existingHandIds = new Set(compHand.map((c) => c.id));
              const uniqueDrawnCards = drawnCards.filter(
                (c) => !existingHandIds.has(c.id),
              );

              compHand = [...compHand, ...uniqueDrawnCards];
            }
          } else {
            // If no wild swap or play occurred, handle standard trade or pass
            if (!wildSwapOccurred) {
              if (currentDeck.length >= 2) {
                const cardsToTradeCount = Math.min(3, currentDeck.length);
                const tradedCards = compHand.slice(0, cardsToTradeCount);
                const remainingHand = compHand.slice(cardsToTradeCount);
                const drawnCards = currentDeck.slice(0, cardsToTradeCount);

                currentDeck = [
                  ...currentDeck.slice(cardsToTradeCount),
                  ...tradedCards,
                ].sort(() => Math.random() - 0.5);

                const existingRemainingIds = new Set(
                  remainingHand.map((c) => c.id),
                );
                const uniqueDrawnCards = drawnCards.filter(
                  (c) => !existingRemainingIds.has(c.id),
                );

                compHand = [...remainingHand, ...uniqueDrawnCards];
                statusAnnouncement = `${gameState.botName} traded ${cardsToTradeCount} cards.`;
              } else {
                statusAnnouncement = `${gameState.botName} passed her turn.`;
              }
            }
          }

          // 📢 DISPLAY ACTION STATUS
          setAiStatusText(statusAnnouncement);

          // 🕒 TIMER 3: DELAY HANDOVER PROMPT TO PLAYER SO TOAST STAYS VISIBLE
          timer3 = setTimeout(() => {
            // 🛡️ Evaluate deck and hand states accurately
            const isDeckEmpty = currentDeck.length === 0;
            const isHandEmpty =
              compHand.length === 0 || gameState.humanHand.length === 0;
            const hasFourPasses =
              (aiPlayedWord ? 0 : (gameState.consecutivePasses ?? 0) + 1) >= 4;

            const isMatchOver = isDeckEmpty && (isHandEmpty || hasFourPasses);

            if (isMatchOver) {
              const humanPenalty = calculateHandPenalty(gameState.humanHand);
              const compPenalty = calculateHandPenalty(compHand);

              const finalHumanScore = Math.max(
                0,
                humanMatchScore - humanPenalty,
              );
              const finalCompScore = Math.max(0, compMatchScore - compPenalty);

              let matchWinner: "human" | "computer" | "tie" = "tie";
              if (finalHumanScore > finalCompScore) {
                matchWinner = "human";
              } else if (finalCompScore > finalHumanScore) {
                matchWinner = "computer";
              }

              // 🎯 ONE CLEAN CALL: Records stats, delays the game-over banner by 1.2s
              triggerGameOver(
                matchWinner,
                finalHumanScore,
                finalCompScore,
                gameState.humanHand,
                compHand,
              );

              setIsAiThinking(false);
              return;
            }

            // Otherwise, continue with normal turn handoff if match is NOT over
            setAiStatusText("Your turn! Make a move or swap/skip.");

            setGameState((prev) => ({
              ...prev,
              wordBoard: newBoard,
              matchScores: { human: humanMatchScore, computer: compMatchScore },
              computerHand: compHand,
              deck: currentDeck,
              isFirstTurn: false,
              hasPlayedThisTurn: false,
              currentTurn: "human",
              consecutivePasses: aiPlayedWord
                ? 0
                : (prev.consecutivePasses ?? 0) + 1,
            }));

            setIsAiThinking(false);
          }, 4000);
        },
        wildSwapOccurred ? 4500 : 3500,
      );
    }, 5000);

    // 🛡️ Assign cancellation to `aiTimerRef` so starting a new match instantly kills active timeouts
    aiTimerRef.current = () => {
      clearTimeout(timer0);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      setIsAiThinking(false);
    };

    return () => {
      if (aiTimerRef.current) {
        aiTimerRef.current();
      }
    };
  }, [gameState.currentTurn]);

  const handleConfirmSwapOrSkip = (selectedCardIds: string[]) => {
    if (selectedCardIds.length === 0) {
      // ⏭️ SKIP TURN
      const nextPasses = gameState.consecutivePasses + 1;

      // 🏁 Check for Stalemate Game Over
      const isStalemate =
        nextPasses >= 8 || (gameState.deck.length === 0 && nextPasses >= 4);

      if (isStalemate) {
        // 🛡️ 1. CALCULATE PENALTIES FOR UNPLAYED TILES
        const humanPenalty = calculateHandPenalty(gameState.humanHand);
        const compPenalty = calculateHandPenalty(gameState.computerHand);

        const finalHumanScore = Math.max(
          0,
          gameState.matchScores.human - humanPenalty,
        );
        const finalCompScore = Math.max(
          0,
          gameState.matchScores.computer - compPenalty,
        );

        let matchWinner: "human" | "computer" | "tie" = "tie";
        if (finalHumanScore > finalCompScore) {
          matchWinner = "human";
        } else if (finalCompScore > finalHumanScore) {
          matchWinner = "computer";
        }

        // 🎯 2. ONE CLEAN CALL: Records stats, delays the game-over banner by 1.2s
        triggerGameOver(
          matchWinner,
          finalHumanScore,
          finalCompScore,
          gameState.humanHand,
          gameState.computerHand,
        );

        setAiStatusText("Match ended in a stalemate!");
        return; // Stop here, don't run the normal skip turn logic
      }

      // Otherwise, normal skip logic continues
      setGameState((prev) => ({
        ...prev,
        currentTurn: "computer",
        consecutivePasses: nextPasses,
        hasPlayedThisTurn: false,
      }));

      setAiStatusText(`You skipped your turn. ${gameState.botName} is up...`);
    } else {
      // 🔀 SWAP TILES
      const cardsToKeep = gameState.humanHand.filter(
        (c) => !selectedCardIds.includes(c.id),
      );
      const returnedCards = gameState.humanHand.filter((c) =>
        selectedCardIds.includes(c.id),
      );

      // Return discarded cards to deck and shuffle
      const newDeck = [...gameState.deck, ...returnedCards].sort(
        () => Math.random() - 0.5,
      );

      // Draw equal number back from deck
      const drawn = newDeck.slice(0, selectedCardIds.length);
      const remainingDeck = newDeck.slice(selectedCardIds.length);

      setGameState((prev) => ({
        ...prev,
        humanHand: [...cardsToKeep, ...drawn],
        deck: remainingDeck,
        currentTurn: "computer",
        consecutivePasses: 0,
        hasPlayedThisTurn: false,
      }));

      setAiStatusText(
        `You swapped ${selectedCardIds.length} letters. ${gameState.botName} is up...`,
      );
    }
  };

  // --- START NEW MATCH HANDLER ---
  const handleStartNewMatch = () => {
    // 🛑 Instantly cancel all pending AI timers and unlock UI state
    if (aiTimerRef.current) {
      aiTimerRef.current();
      aiTimerRef.current = null;
    }

    setIsAiThinking(false); // Ensure thinking state clears out

    const deal = dealNewGame();
    const openingTurn = Math.random() < 0.5 ? "human" : "computer";

    const starterDisplayName = openingTurn === "human" ? " You!" : " Monica!";
    const tossMsg = `🎲 Coin Toss: Winner is${starterDisplayName} ${
      openingTurn === "human" ? "Make your move." : "Monica will start."
    }`;

    setAiStatusText(tossMsg);

    setGameState({
      matchScores: { human: 0, computer: 0 },
      consecutivePasses: 0,
      botName: "Monica",
      aiDifficulty: "medium",
      humanHand: deal.humanHand,
      computerHand: deal.computerHand,
      deck: deal.deck,
      wordBoard: [],
      scoringMode: scoringMode,
      currentTurn: openingTurn,
      isFirstTurn: true,
      hasPlayedThisTurn: false,
      isGameOver: false,
      winner: null,
    });

    setStagedCards([]);
    setTargetBoardWord(null);
  };

  // 🧮 Compute exact potential score for the submit button preview
  let potentialScore = 0;
  if (stagedCards.length >= 2) {
    const proposedWordText = getConstructedWord(stagedCards);
    if (isValidWord(proposedWordText)) {
      if (targetBoardWord !== null) {
        const originalCardIds = new Set(targetBoardWord.cards.map((c) => c.id));
        const newCardsFromHand = stagedCards.filter(
          (c) => !originalCardIds.has(c.id),
        );
        const isOpponentWord = targetBoardWord.playedBy !== "human";
        const cardsAddedCount = newCardsFromHand.length;

        potentialScore = isOpponentWord
          ? calculateStealScore(stagedCards, cardsAddedCount)
          : calculateWordPoints(stagedCards);
      } else {
        potentialScore = calculateWordPoints(stagedCards);
      }
    }
  }

  const handleResetStats = () => {
    if (
      window.confirm(
        "Are you sure you want to reset all career statistics? This cannot be undone.",
      )
    ) {
      setStats(DEFAULT_STATS);
      saveStoredStats(DEFAULT_STATS);
    }
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
          scoringMode={gameState.scoringMode}
          onSelectScoringMode={handleScoringModeChange}
          onSelectDifficulty={(diff) =>
            setGameState((prev) => ({ ...prev, aiDifficulty: diff }))
          }
          onStartMatch={() => {
            handleStartNewMatch();
            setIsGameActive(true);
          }}
          onOpenRules={() => setIsRulesOpen(true)}
          onOpenStats={() => setIsStatsModalOpen(true)}
        />

        <RulesModal
          isOpen={isRulesOpen}
          onClose={() => setIsRulesOpen(false)}
        />
        <StatsModal
          isOpen={isStatsModalOpen}
          stats={stats}
          onClose={() => setIsStatsModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="max-w-md mx-auto h-screen bg-neutral-950 p-2 pb-5 flex flex-col justify-start gap-1.5 relative overflow-hidden">
      {/* Scoreboard, Deck Badge & Menu Bar */}
      <div className="flex flex-col gap-1 py-1.5 px-3 bg-neutral-900/90 rounded-xl border border-neutral-800 shadow-md">
        {/* Scoreboard Row */}
        <div className="flex justify-between items-center text-xs pb-0.5 border-b border-neutral-800/80">
          {/* Deck Remaining Badge / Score Indicator */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-500/30">
              Deck: {gameState.deck.length}
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

        {/* Sticky Banner Wrapper */}
        <div className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md py-2 border-b border-slate-800/80 shadow-lg">
          <div className="text-center">
            <div
              className={`w-full max-w-xl mx-auto p-1.5 rounded-xl text-center transition-all duration-300 shadow-md ${
                gameState.currentTurn === "computer"
                  ? "bg-amber-100 border border-amber-400 text-amber-900"
                  : "bg-emerald-950/80 border border-emerald-500/50 text-emerald-100"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      gameState.currentTurn === "computer"
                        ? "bg-amber-400"
                        : "bg-emerald-400"
                    }`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      gameState.currentTurn === "computer"
                        ? "bg-amber-500"
                        : "bg-emerald-500"
                    }`}
                  ></span>
                </span>

                <h2 className="text-xs font-extrabold tracking-wide">
                  {gameState.currentTurn === "computer"
                    ? isAiThinking
                      ? aiStatusText
                      : `${gameState.botName}'s Turn...`
                    : gameState.isFirstTurn && aiStatusText
                      ? aiStatusText
                      : "👉 YOUR TURN!"}
                </h2>
              </div>

              {/* Dynamic Sub-message based on turn rules */}
              {gameState.currentTurn === "human" && (
                <p className="text-[10px] text-emerald-400/90 font-medium mt-0.5">
                  {gameState.isFirstTurn
                    ? "Turn 1: Play 1 word, trade letters, or pass."
                    : "Play 1 word, steal, trade letters, or end turn."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <DragDropContext onDragEnd={handleDragEnd}>
        {/* Main Shared Playing Field */}
        <div className="flex-1 min-h-0 flex flex-col">
          <GameBoard
            gameState={gameState}
            targetBoardWord={targetBoardWord}
            onOpenWordsModal={() => {
              console.log("📖 Words List button clicked!");
              setIsWordsModalOpen(true);
            }}
            onCardClick={(card) => {
              const isOnBoardWild = gameState.wordBoard.some((word) =>
                word.cards.some((c) => c.id === card.id),
              );

              if (isOnBoardWild && card.isWild && card.assignedLetter) {
                const matchingHandCard = gameState.humanHand.find(
                  (c) => c.letter === card.assignedLetter,
                );

                if (matchingHandCard) {
                  onHumanAttemptWildSwap(card, matchingHandCard);
                }
                return;
              }

              handleStageCard(card);
            }}
            onSelectWordForModification={handleInspectWord}
          />
        </div>

        {/* Workspace Staging Area */}
        <div className="mt-1 shrink-0">
          <Workspace
            stagedCards={stagedCards}
            onRemoveCard={handleUnstageCard}
            onClearWorkspace={handleClearWorkspace}
            onSubmitWord={handleSubmitWord}
            onOpenSwapSkip={() => setIsSwapSkipModalOpen(true)}
            isHumanTurn={gameState.currentTurn === "human"}
            isAiThinking={isAiThinking}
            potentialScore={potentialScore}
          />
        </div>
      </DragDropContext>

      {/* 🏁 GAME-OVER OVERLAY BANNER */}
      {gameState.isGameOver && (
        <div className="absolute inset-x-4 top-20 z-50 bg-slate-900/95 border-2 border-amber-500/80 rounded-2xl p-5 text-center shadow-2xl backdrop-blur-md animate-fade-in text-white">
          <h2 className="text-2xl font-extrabold tracking-wide mb-1">
            {gameState.winner === "human"
              ? "🎉 You Won the Match!"
              : gameState.winner === "computer"
                ? `🤖 ${gameState.botName} Wins!`
                : "🤝 It's a Tie / Stalemate!"}
          </h2>

          <p className="text-slate-300 text-xs mb-3">
            Final scores include penalties for unplayed tiles left in hand.
          </p>

          {/* Final Score Breakdown & Leftover Hands */}
          <div className="grid grid-cols-2 gap-3 bg-slate-800/80 p-3 rounded-xl mb-4 text-left border border-slate-700 text-xs">
            {/* Human Player */}
            <div>
              <p className="font-bold text-amber-400">You</p>
              <p className="text-xl font-black">
                {gameState.matchScores.human} pts
              </p>
              <div className="mt-1">
                <span className="text-[10px] text-slate-400 block mb-0.5">
                  Leftover Penalties:
                </span>
                {(() => {
                  const leftover = gameState.humanLeftoverHand ?? [];
                  return leftover.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {leftover.map((c, idx) => (
                        <span
                          key={c.id || `${c.letter}-${idx}`}
                          className="bg-neutral-900 border border-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
                        >
                          <span>{c.letter}</span>
                          <span className="text-rose-400/80 text-[9px]">
                            (-{c.points})
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      None (0 penalty)
                    </p>
                  );
                })()}
              </div>
            </div>

            {/* Computer / Bot Player */}
            <div>
              <p className="font-bold text-amber-400">{gameState.botName}</p>
              <p className="text-xl font-black">
                {gameState.matchScores.computer} pts
              </p>
              <div className="mt-1">
                <span className="text-[10px] text-slate-400 block mb-0.5">
                  Leftover Penalties:
                </span>
                {(() => {
                  const leftover = gameState.computerLeftoverHand ?? [];
                  return leftover.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {leftover.map((c, idx) => (
                        <span
                          key={c.id || `${c.letter}-${idx}`}
                          className="bg-neutral-900 border border-rose-500/30 text-rose-300 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1"
                        >
                          <span>{c.letter}</span>
                          <span className="text-rose-400/80 text-[9px]">
                            (-{c.points})
                          </span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400">
                      None (0 penalty)
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setIsStatsModalOpen(true)}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl shadow transition text-xs cursor-pointer"
            >
              📊 View Statistics
            </button>
            <button
              onClick={() => handleStartNewMatch()}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-xl shadow transition text-xs cursor-pointer"
            >
              🔄 New Game
            </button>
          </div>
        </div>
      )}

      {/* Modals & Overlays */}
      <WordsPlayedModal
        isOpen={isWordsModalOpen}
        onClose={() => setIsWordsModalOpen(false)}
        wordBoard={gameState.wordBoard}
      />
      <TradeModal
        isOpen={isTradeModalOpen}
        humanHand={gameState.humanHand}
        selectedTradeCardIds={selectedTradeCardIds}
        onToggleCardSelection={handleToggleTradeCardSelection}
        onConfirmTrade={handleExecuteTradeAction}
        onClose={() => {
          setIsTradeModalOpen(false);
          setSelectedTradeCardIds([]);
        }}
      />

      <WordHistoryModal
        word={inspectingWord}
        humanHand={gameState.humanHand}
        onClose={() => setInspectingWord(null)}
        onSelectToModify={(word) => {
          handleSelectWordForModification(word);
        }}
        onSwapWildCard={(targetWildCard, handCard) => {
          onHumanAttemptWildSwap(targetWildCard, handCard);
        }}
      />

      <RulesModal isOpen={isRulesOpen} onClose={() => setIsRulesOpen(false)} />

      {pendingWildCard && (
        <WildCardPickerModal
          isOpen={!!pendingWildCard}
          onSelectLetter={handleSelectWildLetter}
          onCancel={handleCancelWildPicker}
        />
      )}

      <SwapSkipModal
        isOpen={isSwapSkipModalOpen}
        onClose={() => setIsSwapSkipModalOpen(false)}
        handCards={gameState.humanHand}
        onConfirmSwapOrSkip={handleConfirmSwapOrSkip}
      />

      <StatsModal
        isOpen={isStatsModalOpen}
        stats={stats}
        onResetStats={handleResetStats}
        onClose={() => setIsStatsModalOpen(false)}
        onNewMatch={() => {
          setIsStatsModalOpen(false);
          handleStartNewMatch();
        }}
      />
    </div>
  );
}

export default App;
