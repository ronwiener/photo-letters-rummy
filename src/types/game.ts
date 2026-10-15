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

export type PlayerId = "human" | "computer";

export interface HistoryEntry {
  action: "created" | "extended" | "rearranged" | "stolen";
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
  roundScores: { human: number; computer: number };
  roundNumber: number;
  consecutivePasses: number;
  botName: string;
  aiDifficulty: AIDifficulty;
  humanHand: Card[];
  computerHand: Card[];
  drawPile: Card[];
  discardPile: Card[];
  wordBoard: PlayedWord[];
  currentTurn: PlayerId;
  isRoundOver: boolean;
  roundEndReason?: "went_out" | "stalemate" | null;
  lastRoundPenalties?: { human: number; computer: number };
  isGameOver: boolean;
  winner: PlayerId | "tie" | null;
  pendingWildCard?: Card | null; // 👈 Optional state tracker for Wild Card staging
}
