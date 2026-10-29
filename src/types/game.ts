export type Letter =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "U"
  | "V"
  | "W"
  | "X"
  | "Y"
  | "Z"
  | "WILD";

export interface Card {
  id: string;
  letter: Letter;
  photoUrl: string;
  points?: number;
  isWild?: boolean; // 👈 Tracks whether card is a Wild Card
  assignedLetter?: string; // 👈 Stores the assigned letter (A-Z) when played on board
}

export interface GameStatistics {
  gamesPlayed: number;
  gamesWon: number;
  totalWordsPlayed: number;
  highestScoringWord: { word: string; score: number };
  longestWord: string;
  cutthroatWins: number;
  accumulatorWins: number;
}

export const DEFAULT_STATS: GameStatistics = {
  gamesPlayed: 0,
  gamesWon: 0,
  totalWordsPlayed: 0,
  highestScoringWord: { word: "", score: 0 },
  longestWord: "",
  cutthroatWins: 0,
  accumulatorWins: 0,
};

export type PlayerId = "human" | "computer";
export type ScoringMode = "cutthroat" | "accumulator";

export interface HistoryEntry {
  action: "created" | "stolen";
  player: PlayerId;
  description: string;
  timestamp: number;
}

export interface PlayedWord {
  id: string;
  word: string;
  cards: Card[];
  playedBy: PlayerId;
  originalWord?: string;
  scoreAwarded?: number;
  history?: HistoryEntry[];
}

export type AIDifficulty = "easy" | "medium" | "pro";

export interface GameState {
  matchScores: { human: number; computer: number };

  consecutivePasses: number;
  botName: string;
  aiDifficulty: AIDifficulty;

  // Hand & Deck management
  humanHand: Card[];
  computerHand: Card[];
  deck: Card[]; // 👈 Unified 100-card pool (replaces drawPile & discardPile)

  // Board & Turn state
  wordBoard: PlayedWord[];
  currentTurn: PlayerId;
  isFirstTurn: boolean; // 👈 Enforces single standalone word on Turn 1
  hasPlayedThisTurn: boolean; // 👈 ADD THIS LINE HERE
  scoringMode: ScoringMode;

  // Game lifecycle

  lastRoundPenalties?: { human: number; computer: number };
  isGameOver: boolean;
  winner: PlayerId | "tie" | "draw" | null;
  pendingWildCard?: Card | null;
}
