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
  let highestWord = prevStats.highestScoringWord;
  let longestWord = prevStats.longestWord;
  let totalWordsCount = prevStats.totalWordsPlayed;

  // Evaluate every word played in this match against current records
  for (const wp of result.wordsPlayedThisMatch) {
    totalWordsCount += 1;

    // Check longest word
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
    gamesPlayed: prevStats.gamesPlayed + 1,
    gamesWon: (prevStats.gamesWon || 0) + (didWin ? 1 : 0),
    wins: (prevStats.wins || 0) + (didWin ? 1 : 0),
    losses: (prevStats.losses || 0) + (!didWin ? 1 : 0),
    totalWordsPlayed: totalWordsCount,
    highestScoringWord: highestWord,
    longestWord: longestWord,
    cutthroatWins:
      prevStats.cutthroatWins +
      (didWin && result.scoringMode === "cutthroat" ? 1 : 0),
    accumulatorWins:
      prevStats.accumulatorWins +
      (didWin && result.scoringMode === "accumulator" ? 1 : 0),
  };
};
