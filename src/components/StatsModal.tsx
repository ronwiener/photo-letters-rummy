import React from "react";
import ReactDOM from "react-dom";
import type { GameStatistics } from "../types/game";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: GameStatistics;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  console.log("🎨 StatsModal RENDER FUNCTION CALLED. isOpen =", isOpen); // 👈 Add this log

  if (!isOpen) {
    console.log("StatsModal is returning null because isOpen is false");
    return null;
  }

  console.log("StatsModal is actively rendering the modal markup!");

  const safeStats = stats || {
    gamesPlayed: 0,
    gamesWon: 0,
    totalWordsPlayed: 0,
    highestScoringWord: { word: "", score: 0 },
    longestWord: "",
    cutthroatWins: 0,
    accumulatorWins: 0,
  };

  const gamesPlayed = safeStats.gamesPlayed ?? 0;
  const gamesWon = safeStats.gamesWon ?? 0;
  const totalWordsPlayed = safeStats.totalWordsPlayed ?? 0;
  const winRate =
    gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  const highestWord = safeStats.highestScoringWord?.word || "None yet";
  const highestScore = safeStats.highestScoringWord?.score ?? 0;
  const longestWordStr =
    typeof safeStats.longestWord === "string" &&
    safeStats.longestWord.length > 0
      ? safeStats.longestWord
      : "None yet";
  const longestWordLen =
    typeof safeStats.longestWord === "string"
      ? safeStats.longestWord.length
      : 0;

  // 🚀 createPortal mounts this directly to document.body, escaping all parent CSS traps
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-cyan-500/20 text-slate-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800">
          <h2 className="text-2xl font-bold text-cyan-400 tracking-wide">
            Career Statistics & Records
          </h2>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          {/* Overview Grid */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
              <div className="text-3xl font-extrabold text-cyan-400">
                {gamesPlayed}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
                Games Played
              </div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
              <div className="text-3xl font-extrabold text-emerald-400">
                {winRate}%
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
                Win Rate
              </div>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 p-4 rounded-xl">
              <div className="text-3xl font-extrabold text-purple-400">
                {totalWordsPlayed}
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
                Words Formed
              </div>
            </div>
          </div>

          {/* Records & Highlights */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Personal Records
            </h3>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-slate-400">
                  Highest-Scoring Word
                </div>
                <div className="text-lg font-bold text-cyan-300 mt-0.5">
                  {highestWord}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-amber-400">
                  {highestScore}{" "}
                  <span className="text-xs text-slate-400 font-normal">
                    pts
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex justify-between items-center">
              <div>
                <div className="text-sm text-slate-400">Longest Word</div>
                <div className="text-lg font-bold text-cyan-300 mt-0.5">
                  {longestWordStr}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-purple-400">
                  {longestWordLen}{" "}
                  <span className="text-xs text-slate-400 font-normal">
                    letters
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Mode Breakdown */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              Wins vs Monica
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/40 border border-slate-700/40 p-3 rounded-xl flex justify-between items-center">
                <span className="text-sm text-slate-300">Aggressive</span>
                <span className="font-bold text-cyan-400">
                  {safeStats.cutthroatWins ?? 0} wins
                </span>
              </div>
              <div className="bg-slate-800/40 border border-slate-700/40 p-3 rounded-xl flex justify-between items-center">
                <span className="text-sm text-slate-300">Passive</span>
                <span className="font-bold text-cyan-400">
                  {safeStats.accumulatorWins ?? 0} wins
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-cyan-600/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};
