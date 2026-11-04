import type { GameStatistics, ScoringMode } from "../types/game";

export interface MatchResultArgs {
  didWin: boolean;
  scoringMode: ScoringMode;
  wordsPlayedThisMatch: { word: string; score: number; playerId: string }[];
  humanScore: number;
  computerScore: number;
  bingosCount: number;
}

export const calculateUpdatedStats = (
  prevStats: GameStatistics,
  result: MatchResultArgs,
): GameStatistics => {
  let highestWord = prevStats.highestScoringWord || { word: "", score: 0 };
  let totalWordsCount = prevStats.totalWordsPlayed || 0;

  for (const wp of result.wordsPlayedThisMatch) {
    totalWordsCount += 1;

    // Check highest scoring word
    if (wp.score > highestWord.score) {
      highestWord = { word: wp.word, score: wp.score };
    }
  }

  const didWin = result.didWin;

  // 🧮 Calculate margin of victory if human won
  const scoreMargin = didWin
    ? Math.max(0, (result.humanScore || 0) - (result.computerScore || 0))
    : 0;

  const newBiggestMargin = Math.max(
    prevStats.biggestMarginOfVictory || 0,
    scoreMargin,
  );

  return {
    ...prevStats,
    gamesPlayed: prevStats.gamesPlayed + 1,
    gamesWon: (prevStats.gamesWon || 0) + (didWin ? 1 : 0),
    wins: (prevStats.wins || 0) + (didWin ? 1 : 0),
    losses: (prevStats.losses || 0) + (!didWin ? 1 : 0),
    totalWordsPlayed: totalWordsCount,
    highestScoringWord: highestWord,
    cutthroatWins:
      (prevStats.cutthroatWins || 0) +
      (didWin && result.scoringMode === "cutthroat" ? 1 : 0),
    accumulatorWins:
      (prevStats.accumulatorWins || 0) +
      (didWin && result.scoringMode === "accumulator" ? 1 : 0),
    biggestMarginOfVictory: newBiggestMargin,
    bingos: (prevStats.bingos || 0) + (result.bingosCount || 0), // 👈 Accrue Bingos here
  };
};
