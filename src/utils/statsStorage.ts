import { type GameStatistics, DEFAULT_STATS } from "../types/game"; // Adjust path if needed

const STATS_STORAGE_KEY = "photoletter_game_stats";

export const getStoredStats = (): GameStatistics => {
  try {
    const saved = localStorage.getItem(STATS_STORAGE_KEY);
    if (!saved) return DEFAULT_STATS;
    return JSON.parse(saved);
  } catch (error) {
    console.error("Failed to load stats from localStorage", error);
    return DEFAULT_STATS;
  }
};

export const saveStoredStats = (stats: GameStatistics): void => {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error("Failed to save stats to localStorage", error);
  }
};
