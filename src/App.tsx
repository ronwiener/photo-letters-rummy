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
import { getStoredStats, saveStoredStats } from "./utils/statsStorage";
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
    newHand: [...hand, ...drawn],
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
      scoringMode: "cutthroat",
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
  const [scoringMode, setScoringMode] = useState<ScoringMode>("cutthroat");
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [stats, setStats] = useState<GameStatistics>(() => {
    const loaded = getStoredStats();
    return loaded && typeof loaded === "object"
      ? loaded
      : {
          gamesPlayed: 0,
          gamesWon: 0,
          wins: 0,
          losses: 0,
          totalWordsPlayed: 0,
          highestScoringWord: { word: "", score: 0 },
          longestWord: "",
          cutthroatWins: 0,
          accumulatorWins: 0,
        };
  });

  useEffect(() => {
    console.log("🔔 isStatsModalOpen state changed to:", isStatsModalOpen);
  }, [isStatsModalOpen]);

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

  const matchWordsRef = useRef<
    { word: string; score: number; playerId: "human" | "computer" }[]
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

    // Dropped outside any valid droppable area
    if (!destination) return;

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

    // 3. STAGING A CARD FROM PLAYER HAND TO WORKSPACE
    if (sourceId === "player-hand" && destId === "workspace-rack") {
      const draggedCard = gameState.humanHand[source.index];
      if (!draggedCard) return;

      if (stagedCards.some((c) => c.id === draggedCard.id)) return;

      // 🌟 BULLETPROOF WILD CARD CHECK (matches your handleStageCard logic)
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

      // 1. Remove from staged cards
      setStagedCards((prev) => prev.filter((c) => c.id !== removedCard.id));

      // 2. Add back to player hand at the destination index
      setGameState((prev) => {
        const updatedHand = Array.from(prev.humanHand);
        // Prevent duplicate IDs just in case
        if (!updatedHand.some((c) => c.id === removedCard.id)) {
          updatedHand.splice(destination.index, 0, removedCard);
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

    // 🛡️ Guard: Only 1 action allowed per turn on Turn 2+ (optional safeguard now that turn auto-ends)
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
      // --- MODIFICATION, EXTENSION & STEALING LOGIC (Turn 2+) ---
      const originalCardIds = new Set(targetBoardWord.cards.map((c) => c.id));
      const currentStagedIds = new Set(stagedCards.map((c) => c.id));

      // 1. Must add at least 1 new card from hand
      const newCardsFromHand = stagedCards.filter(
        (c) => !originalCardIds.has(c.id),
      );

      if (newCardsFromHand.length < 1) {
        alert(
          "You must add at least one letter from your hand to modify or steal a word!",
        );
        return;
      }

      // 2. Must keep all letters from the original board word
      const missingOriginalCards = targetBoardWord.cards.some(
        (c) => !currentStagedIds.has(c.id),
      );

      if (missingOriginalCards) {
        alert(
          "You must use all letters from the original word when modifying or stealing!",
        );
        return;
      }

      const isOpponentWord = targetBoardWord.playedBy !== "human";
      const cardsAddedCount = newCardsFromHand.length;

      // 🧮 EXACT SCORING USING scoreUtils
      let pointsAwarded = 0;
      if (isOpponentWord) {
        pointsAwarded = calculateStealScore(stagedCards, cardsAddedCount);
      } else {
        pointsAwarded = calculateWordPoints(stagedCards);
      }

      // 📊 RECORD PLAYED WORD FOR CAREER STATS
      matchWordsRef.current.push({
        word: proposedWordText,
        score: pointsAwarded,
        playerId: "human",
      });

      const existingHistory = targetBoardWord.history || [];
      const updatedPlayedWord: PlayedWord = {
        id: targetBoardWord.id,
        word: proposedWordText,
        cards: [...stagedCards],
        playedBy: "human",
        originalWord: targetBoardWord.word,
        scoreAwarded: (targetBoardWord.scoreAwarded || 0) + pointsAwarded,
        history: [
          ...existingHistory,
          {
            action: isOpponentWord ? "stolen" : "created",
            player: "human",
            description: isOpponentWord
              ? `⚡ Stole "${targetBoardWord.word}" with ${cardsAddedCount} added letter(s) into "${proposedWordText}" (${cardsAddedCount >= 2 ? "2x double points" : "base points"}) (+${pointsAwarded} pts)!`
              : `Extended "${targetBoardWord.word}" into "${proposedWordText}" (+${pointsAwarded} pts).`,
            timestamp: Date.now(),
          },
        ],
      };

      const updatedWordBoard = gameState.wordBoard.map((w) =>
        w.id === targetBoardWord.id ? updatedPlayedWord : w,
      );

      const usedHandCardIds = new Set(newCardsFromHand.map((c) => c.id));
      const remainingHandRaw = gameState.humanHand.filter(
        (handCard) => !usedHandCardIds.has(handCard.id),
      );

      // 🛡️ Replenish hand using helper function
      const { newHand: remainingHand, newDeck } = replenishHand(
        remainingHandRaw,
        updatedDeck,
        8,
      );
      updatedDeck = newDeck;

      const previousOwner = targetBoardWord.playedBy;
      const previousScore = targetBoardWord.scoreAwarded || 0;

      const isMatchOver =
        updatedDeck.length === 0 &&
        (remainingHand.length === 0 || gameState.consecutivePasses >= 1);

      let finalMatchScores = {
        human: gameState.matchScores.human + pointsAwarded,
        computer: gameState.matchScores.computer,
      };

      if (
        gameState.scoringMode === "cutthroat" &&
        isOpponentWord &&
        previousOwner &&
        previousOwner !== "human"
      ) {
        finalMatchScores[previousOwner] = Math.max(
          0,
          finalMatchScores[previousOwner] - previousScore,
        );
      }

      let matchWinner: "human" | "computer" | "tie" | "draw" | null = null;

      if (isMatchOver) {
        const humanPenalty = calculateHandPenalty(remainingHand);
        const compPenalty = calculateHandPenalty(gameState.computerHand);

        finalMatchScores.human = Math.max(
          0,
          finalMatchScores.human - humanPenalty,
        );
        finalMatchScores.computer = Math.max(
          0,
          finalMatchScores.computer - compPenalty,
        );

        if (finalMatchScores.human > finalMatchScores.computer) {
          matchWinner = "human";
        } else if (finalMatchScores.computer > finalMatchScores.human) {
          matchWinner = "computer";
        } else {
          matchWinner = "tie";
        }

        const didHumanWin = matchWinner === "human";
        const wordsPlayedSnapshot = [...matchWordsRef.current];
        matchWordsRef.current = [];

        updateStats((currentStats: GameStatistics) =>
          calculateUpdatedStats(currentStats, {
            didWin: didHumanWin,
            scoringMode: gameState.scoringMode,
            wordsPlayedThisMatch: wordsPlayedSnapshot.filter(
              (word) => word.playerId === "human",
            ),
          }),
        );
      }

      // 🤖 TRIGGER COMPUTER TURN AUTOMATICALLY
      if (!isMatchOver) {
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
      }));
    } else if (isStandaloneWord) {
      // --- STANDARD NEW WORD PLAY ---
      const pointsAwarded = calculateWordPoints(stagedCards);

      matchWordsRef.current.push({
        word: proposedWordText,
        score: pointsAwarded,
        playerId: "human",
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
            description: `Created new word "${proposedWordText}" for ${pointsAwarded} points.`,
            timestamp: Date.now(),
          },
        ],
      };

      const usedHandCardIds = new Set(stagedCards.map((c) => c.id));
      const remainingHandRaw = gameState.humanHand.filter(
        (handCard) => !usedHandCardIds.has(handCard.id),
      );

      // 🛡️ FIX: Use replenishHand consistently for both Turn 1 and later turns!
      const { newHand: remainingHand, newDeck } = replenishHand(
        remainingHandRaw,
        updatedDeck,
        8,
      );
      updatedDeck = newDeck;

      const isMatchOver =
        updatedDeck.length === 0 &&
        (remainingHand.length === 0 || gameState.consecutivePasses >= 1);

      let finalMatchScores = {
        human: gameState.matchScores.human + pointsAwarded,
        computer: gameState.matchScores.computer,
      };

      let matchWinner: "human" | "computer" | "tie" | "draw" | null = null;

      if (isMatchOver) {
        const humanPenalty = calculateHandPenalty(remainingHand);
        const compPenalty = calculateHandPenalty(gameState.computerHand);

        finalMatchScores.human = Math.max(
          0,
          finalMatchScores.human - humanPenalty,
        );
        finalMatchScores.computer = Math.max(
          0,
          finalMatchScores.computer - compPenalty,
        );

        if (finalMatchScores.human > finalMatchScores.computer) {
          matchWinner = "human";
        } else if (finalMatchScores.computer > finalMatchScores.human) {
          matchWinner = "computer";
        } else {
          matchWinner = "tie";
        }

        const didHumanWin = matchWinner === "human";
        const wordsPlayedSnapshot = [...matchWordsRef.current];
        matchWordsRef.current = [];

        updateStats((currentStats: GameStatistics) =>
          calculateUpdatedStats(currentStats, {
            didWin: didHumanWin,
            scoringMode: gameState.scoringMode,
            wordsPlayedThisMatch: wordsPlayedSnapshot.filter(
              (word) => word.playerId === "human",
            ),
          }),
        );
      }

      // 🤖 TRIGGER COMPUTER TURN AUTOMATICALLY
      if (!isMatchOver) {
        setAiStatusText(`${gameState.botName} is taking her turn...`);

        setGameState((prev) => ({
          ...prev,
          wordBoard: [...prev.wordBoard, newPlayedWord],
          matchScores: finalMatchScores,
          humanHand: remainingHand,
          deck: updatedDeck,
          isFirstTurn: false,
          currentTurn: "computer",
          consecutivePasses: 0,
          isGameOver: isMatchOver,
          winner: matchWinner,
        }));
      } else {
        setGameState((prev) => ({
          ...prev,
          wordBoard: [...prev.wordBoard, newPlayedWord],
          matchScores: finalMatchScores,
          humanHand: remainingHand,
          deck: updatedDeck,
          isFirstTurn: false,
          isGameOver: true,
          winner: matchWinner,
        }));
      }
    }

    // Reset workspace staging
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
      // 🛡️ 1. CALCULATE HAND PENALTIES FOR BOTH PLAYERS
      const humanPenalty = calculateHandPenalty(gameState.humanHand);
      const compPenalty = calculateHandPenalty(gameState.computerHand); // Or botHand / aiHand

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

      // 📊 2. RECORD CAREER STATS
      const didHumanWin = matchWinner === "human";
      const wordsPlayedSnapshot = [...matchWordsRef.current];
      matchWordsRef.current = [];

      updateStats((currentStats: GameStatistics) =>
        calculateUpdatedStats(currentStats, {
          didWin: didHumanWin,
          scoringMode: gameState.scoringMode,
          wordsPlayedThisMatch: wordsPlayedSnapshot.filter(
            (word) => word.playerId === "human",
          ),
        }),
      );

      setGameState((prev) => ({
        ...prev,
        matchScores: {
          human: adjustedHumanScore,
          computer: adjustedCompScore,
        },
        isGameOver: true,
        winner: matchWinner,
      }));
    }
  }, [
    gameState.deck.length,
    gameState.consecutivePasses,
    gameState.isGameOver,
    gameState.matchScores,
    gameState.humanHand,
    gameState.computerHand,
    gameState.scoringMode,
  ]);
  // -------------------------------------------------------------
  // MONICA AI TURN ENGINE (Continuous Phase-Less Flow & Steal Mechanics)
  // -------------------------------------------------------------
  useEffect(() => {
    if (gameState.currentTurn !== "computer" || gameState.isGameOver) return;

    setIsAiThinking(true);

    // 🕒 Delay before Monica replaces the Coin Toss announcement message
    const initialDelay = gameState.isFirstTurn ? 2200 : 0;

    const timer0 = setTimeout(() => {
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

    const timer1 = setTimeout(() => {
      let compHand = [...gameState.computerHand];
      let currentDeck = [...gameState.deck];
      // Immutably clone wordBoard structure
      let newBoard = gameState.wordBoard.map((w) => ({
        ...w,
        cards: [...w.cards],
      }));

      // 🌟 WILD SWAP CHECK: Swap matching letters from hand with assigned Wild Cards on board
      newBoard = newBoard.map((playedWord) => {
        const updatedCards = playedWord.cards.map((card) => {
          if (card.isWild && card.assignedLetter) {
            const matchingHandCard = compHand.find(
              (c) => c.letter === card.assignedLetter,
            );

            if (matchingHandCard) {
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

      // Step 2: Word Evaluation & Play Execution
      const timer2 = setTimeout(() => {
        let compMatchScore = gameState.matchScores.computer;
        let humanMatchScore = gameState.matchScores.human;
        let aiPlayedWord = false;
        let statusAnnouncement = "";

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
          const pointsAwarded = calculateStealScore(
            correctlyOrderedStealCards,
            cardsAddedCount,
          );

          compMatchScore += pointsAwarded;

          // 📊 RECORD MONICA'S STEAL FOR MATCH HISTORY
          matchWordsRef.current.push({
            word: stealCandidate.newWordText,
            score: pointsAwarded,
            playerId: "computer",
          });

          if (previousOwner === "human") {
            // 🛡️ Explicitly resolve the stolen word string with fallbacks
            const stolenWordText =
              targetWord.word ||
              targetWord.originalWord ||
              getConstructedWord(targetWord.cards) ||
              "word";

            const newWordText = stealCandidate.newWordText || "a new word";

            if (gameState.scoringMode === "cutthroat") {
              humanMatchScore = Math.max(0, humanMatchScore - previousScore);
              statusAnnouncement = `⚡ ${gameState.botName} stole your word "${stolenWordText}" to make "${newWordText}" (+${pointsAwarded} pts)!`;
            } else {
              statusAnnouncement = `⚡ ${gameState.botName} stole your word "${stolenWordText}" to make "${newWordText}" (+${pointsAwarded} pts)!`;
            }
          } else {
            const baseWordText = targetWord?.word || "word";
            const newWordText = stealCandidate?.newWordText || "a new word";
            statusAnnouncement = `${gameState.botName} expanded her word "${baseWordText}" into "${newWordText}" (+${pointsAwarded} pts)`;
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
              compMatchScore += playResult.score;

              const sanitizedNewCards = sanitizeAiCards(
                playResult.cardsUsed,
                playResult.wordText,
                0,
              );

              statusAnnouncement = `${gameState.botName} played "${playResult.wordText}" (+${playResult.score} pts)!`;

              newBoard.push({
                id: `word-ai-${Date.now()}-${Math.random()}`,
                word: playResult.wordText,
                cards: sanitizedNewCards,
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
              // 📊 RECORD MONICA'S PLAY FOR MATCH HISTORY
              matchWordsRef.current.push({
                word: playResult.wordText,
                score: playResult.score,
                playerId: "computer", // 👈 Mark as computer
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
              const cardsAddedCount = correctlyOrderedExtensionCards.filter(
                (c) => !originalCardIds.has(c.id),
              ).length;

              const pointsAwarded = calculateStealScore(
                correctlyOrderedExtensionCards,
                cardsAddedCount,
              );

              compMatchScore += pointsAwarded;

              // 📊 RECORD MONICA'S EXTENSION FOR MATCH HISTORY
              matchWordsRef.current.push({
                word: playResult.wordText,
                score: pointsAwarded,
                playerId: "computer",
              });

              if (previousOwner === "human") {
                if (gameState.scoringMode === "cutthroat") {
                  humanMatchScore = Math.max(
                    0,
                    humanMatchScore - previousScore,
                  );
                  statusAnnouncement = `⚡ ${gameState.botName} stole your word and expanded it to "${playResult.wordText}" (+${pointsAwarded} pts)!`;
                } else {
                  statusAnnouncement = `⚡ ${gameState.botName} stole your word and expanded it to "${playResult.wordText}" (+${pointsAwarded} pts)!`;
                }
              } else {
                statusAnnouncement = `${gameState.botName} extended a word to "${playResult.wordText}" (+${pointsAwarded} pts)`;
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
                    history: [
                      ...existingHistory,
                      {
                        action: "stolen",
                        player: "computer",
                        description: `${gameState.botName} stole word to "${playResult.wordText}" (+${pointsAwarded} pts)`,
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
            statusAnnouncement = `${gameState.botName} traded ${cardsToTradeCount} cards — your turn!`;
          } else {
            statusAnnouncement = `${gameState.botName} passed — your turn!`;
          }
        }

        setAiStatusText(statusAnnouncement);

        const timer3 = setTimeout(() => {
          setGameState((prev) => {
            // 🏁 Check if the 100-card deck is empty and Monica emptied her hand (or human hand is empty)
            const isMatchOver =
              (currentDeck.length === 0 &&
                (compHand.length === 0 || prev.humanHand.length === 0)) ||
              (currentDeck.length === 0 && (prev.consecutivePasses ?? 0) >= 1);

            // Calculate final hand penalties
            const humanPenalty = calculateHandPenalty(prev.humanHand);
            const compPenalty = calculateHandPenalty(compHand);

            const finalHumanScore = Math.max(0, humanMatchScore - humanPenalty);
            const finalCompScore = Math.max(0, compMatchScore - compPenalty);

            const updatedMatchScores = {
              human: finalHumanScore,
              computer: finalCompScore,
            };

            let matchWinner: PlayerId | "tie" | "draw" | null = null;

            if (isMatchOver) {
              if (updatedMatchScores.human > updatedMatchScores.computer) {
                matchWinner = "human";
              } else if (
                updatedMatchScores.computer > updatedMatchScores.human
              ) {
                matchWinner = "computer";
              } else {
                matchWinner = "tie";
              }

              // 📊 UPDATE CAREER STATS ON MATCH END
              const didHumanWin = matchWinner === "human";
              const wordsPlayedSnapshot = [...matchWordsRef.current];
              matchWordsRef.current = [];

              updateStats((currentStats: GameStatistics) =>
                calculateUpdatedStats(currentStats, {
                  didWin: didHumanWin,
                  scoringMode: prev.scoringMode,
                  wordsPlayedThisMatch: wordsPlayedSnapshot.filter(
                    (word) => word.playerId === "human",
                  ),
                }),
              );
            }

            return {
              ...prev,
              wordBoard: newBoard,
              matchScores: isMatchOver
                ? updatedMatchScores
                : { human: humanMatchScore, computer: compMatchScore },
              computerHand: compHand,
              deck: currentDeck,
              isFirstTurn: false,
              currentTurn: isMatchOver ? "computer" : "human",
              consecutivePasses: aiPlayedWord ? 0 : prev.consecutivePasses + 1,
              isGameOver: isMatchOver,
              winner: matchWinner,
            };
          });

          setIsAiThinking(false);
        }, 3500);

        return () => clearTimeout(timer3);
      }, 3500);

      return () => clearTimeout(timer2);
    }, 4500);

    return () => {
      clearTimeout(timer0);
      clearTimeout(timer1);
    };
  }, [gameState.currentTurn]);

  const handleConfirmSwapOrSkip = (selectedCardIds: string[]) => {
    if (selectedCardIds.length === 0) {
      // ⏭️ SKIP TURN
      setGameState((prev) => {
        const nextPasses = prev.consecutivePasses + 1;

        // 🏁 Check for Stalemate Game Over (4 passes with empty deck OR 8 consecutive passes)
        const isStalemate =
          nextPasses >= 8 || (prev.deck.length === 0 && nextPasses >= 4);

        let matchWinner:
          | "human"
          | "computer"
          | "tie"
          | "draw"
          | PlayerId
          | null = prev.winner;

        let finalMatchScores = { ...prev.matchScores };

        if (isStalemate) {
          // 🛡️ 1. CALCULATE PENALTIES FOR UNPLAYED TILES
          const humanPenalty = calculateHandPenalty(prev.humanHand);
          const compPenalty = calculateHandPenalty(prev.computerHand);

          // 🛡️ 2. SUBTRACT PENALTIES FROM SCORES
          finalMatchScores = {
            human: Math.max(0, prev.matchScores.human - humanPenalty),
            computer: Math.max(0, prev.matchScores.computer - compPenalty),
          };

          // 🛡️ 3. DETERMINE WINNER FROM PENALIZED SCORES
          if (finalMatchScores.human > finalMatchScores.computer) {
            matchWinner = "human";
          } else if (finalMatchScores.computer > finalMatchScores.human) {
            matchWinner = "computer";
          } else {
            matchWinner = "tie";
          }

          // 📊 4. RECORD MATCH STATS ON STALEMATE GAME OVER
          const didHumanWin = matchWinner === "human";
          const wordsPlayedSnapshot = [...matchWordsRef.current];
          matchWordsRef.current = [];

          updateStats((currentStats: GameStatistics) =>
            calculateUpdatedStats(currentStats, {
              didWin: didHumanWin,
              scoringMode: prev.scoringMode,
              wordsPlayedThisMatch: wordsPlayedSnapshot.filter(
                (word) => word.playerId === "human",
              ),
            }),
          );
        }

        return {
          ...prev,
          matchScores: finalMatchScores, // 👈 Update with penalized scores
          currentTurn: isStalemate ? "human" : "computer",
          consecutivePasses: nextPasses,
          hasPlayedThisTurn: false,
          isGameOver: isStalemate,
          winner: matchWinner,
        };
      });

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
    const deal = dealNewGame();

    // 🎲 50/50 coin toss to decide who starts the new match
    const openingTurn: PlayerId = Math.random() < 0.5 ? "human" : "computer";

    const starterDisplayName = openingTurn === "human" ? " You!" : " Monica!";
    const tossMsg = `🎲 Coin Toss: Winner is${starterDisplayName} ${
      openingTurn === "human" ? "Make your move." : "Monica will start."
    }`;

    // Set initial announcement message
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

    // Reset workspace staging state
    setStagedCards([]);
    setTargetBoardWord(null);
  };

  useEffect(() => {
    if (gameState.isGameOver) {
      setIsStatsModalOpen(true);
    }
  }, [gameState.isGameOver]);

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
    <div className="max-w-md mx-auto h-screen bg-neutral-950 p-2 flex flex-col justify-start gap-1.5 relative overflow-hidden">
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

        {/* Workspace Staging Area */}
        <div className="mt-0.5">
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
        isGameOver={gameState.isGameOver}
        winner={gameState.winner}
        matchScores={gameState.matchScores}
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
