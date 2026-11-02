import type { GameStatistics } from "../types/game";

const STATS_STORAGE_KEY = "game_stats";

export const DEFAULT_STATS: GameStatistics = {
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

/**
 * Retrieves stored statistics from localStorage, merging with defaults
 * to ensure all expected properties are present.
 */
export const getStoredStats = (): GameStatistics => {
  try {
    const saved = localStorage.getItem(STATS_STORAGE_KEY);
    if (!saved) return DEFAULT_STATS;

    const parsed = JSON.parse(saved);
    // Merge saved stats over defaults so new properties never come back undefined
    return { ...DEFAULT_STATS, ...parsed };
  } catch (e) {
    console.error("Failed to load or parse stored game stats:", e);
    return DEFAULT_STATS;
  }
};

/**
 * Saves current statistics to localStorage.
 */
export const saveStoredStats = (stats: GameStatistics): void => {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error("Failed to save game stats to localStorage:", e);
  }
};
