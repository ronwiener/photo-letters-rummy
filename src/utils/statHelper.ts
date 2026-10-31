import type { GameStatistics } from "../types/game";
import type { ScoringMode } from "../types/game";

interface MatchResultArgs {
  didWin: boolean;
  scoringMode: ScoringMode;
  wordsPlayedThisMatch: { word: string; score: number; playerId: string }[]; // 👈 Add playerId
}

export const calculateUpdatedStats = (
  prevStats: GameStatistics,
  result: MatchResultArgs,
): GameStatistics => {
  let highestWord = prevStats.highestScoringWord || { word: "", score: 0 };
  // 🛡️ Default to an empty string matching GameStatistics type
  let longestWord = prevStats.longestWord || "";
  let totalWordsCount = prevStats.totalWordsPlayed || 0;

  for (const wp of result.wordsPlayedThisMatch) {
    totalWordsCount += 1;

    // 🛡️ Compare lengths, store the winning word string
    if (wp.word.length > longestWord.length) {
      longestWord = wp.word;
    }

    // Check highest scoring word
    if (wp.score > highestWord.score) {
      highestWord = { word: wp.word, score: wp.score };
    }
  }

  const didWin = result.didWin;

  return {
    ...prevStats,
    gamesPlayed: prevStats.gamesPlayed + 1,
    gamesWon: (prevStats.gamesWon || 0) + (didWin ? 1 : 0),
    wins: (prevStats.wins || 0) + (didWin ? 1 : 0),
    losses: (prevStats.losses || 0) + (!didWin ? 1 : 0),
    totalWordsPlayed: totalWordsCount,
    highestScoringWord: highestWord,
    longestWord: longestWord, // 👈 Assigned as a string correctly
    cutthroatWins:
      (prevStats.cutthroatWins || 0) +
      (didWin && result.scoringMode === "cutthroat" ? 1 : 0),
    accumulatorWins:
      (prevStats.accumulatorWins || 0) +
      (didWin && result.scoringMode === "accumulator" ? 1 : 0),
  };
};
