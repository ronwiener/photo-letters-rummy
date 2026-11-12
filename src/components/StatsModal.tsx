import React from "react";
import type { GameStatistics } from "../types/game";

interface StatsModalProps {
  isOpen: boolean;
  stats: GameStatistics;
  onClose: () => void;
  onNewMatch?: () => void;
  onResetStats?: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  stats,
  onClose,
  onNewMatch,
  onResetStats,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-white flex flex-col gap-4">
        {/* Modal Title & Close */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300">
            Statistics
          </h3>
        </div>

        {/* Expanded Career Statistics Display */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between bg-neutral-800/50 p-2.5 rounded-xl">
            <span className="text-neutral-400">Total Matches Played:</span>
            <span className="font-bold text-white">{stats.gamesPlayed}</span>
          </div>

          <div className="flex justify-between bg-neutral-800/50 p-2.5 rounded-xl">
            <span className="text-neutral-400">Total Wins:</span>
            <span className="font-bold text-emerald-400">{stats.wins}</span>
          </div>
          {stats.biggestMarginOfVictory > 0 && (
            <div className="flex justify-between bg-neutral-800/50 p-2.5 rounded-xl">
              <span className="text-neutral-400">
                Biggest Margin of Victory:
              </span>
              <span className="font-bold text-emerald-400">
                +{stats.biggestMarginOfVictory} pts
              </span>
            </div>
          )}
          <div className="flex justify-between bg-neutral-800/50 p-2.5 rounded-xl">
            <span className="text-neutral-400">Total Losses:</span>
            <span className="font-bold text-rose-400">{stats.losses}</span>
          </div>

          {/* Mode-Specific Win Breakdowns */}
          <div className="flex justify-between bg-neutral-800/30 p-2 rounded-lg ml-3 border-l-2 border-emerald-500/40">
            <span className="text-neutral-400">High Risk Wins:</span>
            <span className="font-bold text-emerald-300">
              {stats.cutthroatWins}
            </span>
          </div>
          <div className="flex justify-between bg-neutral-800/30 p-2 rounded-lg ml-3 border-l-2 border-emerald-500/40">
            <span className="text-neutral-400">Low Risk Wins:</span>
            <span className="font-bold text-emerald-300">
              {stats.accumulatorWins}
            </span>
          </div>

          {/* 🌟 Total Bingos Stat Row */}
          <div className="flex justify-between bg-neutral-800/50 p-2.5 rounded-xl">
            <span className="text-neutral-400">
              Total Bingos (8 letter words):
            </span>
            <span className="font-bold text-amber-400">
              {stats.bingos || 0}
            </span>
          </div>

          {stats.highestScoringWord?.word && (
            <div className="flex justify-between bg-neutral-800/50 p-2.5 rounded-xl">
              <span className="text-neutral-400">Highest Scoring Word:</span>
              <span className="font-bold text-amber-300">
                {stats.highestScoringWord.word} (
                {stats.highestScoringWord.score} pts)
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons Footer */}
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            {onNewMatch && (
              <button
                onClick={onNewMatch}
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs rounded-xl transition-colors shadow-md cursor-pointer"
              >
                🎮 Start New Game
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 py-2 px-3 bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-200 font-bold text-xs rounded-xl border border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.25)] transition-all active:scale-95 cursor-pointer"
            >
              Close
            </button>
          </div>

          {/* 🗑️ Reset Stats Button */}
          {onResetStats && (
            <button
              onClick={onResetStats}
              className="w-full py-1.5 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-semibold text-[11px] rounded-xl border border-rose-800/50 transition-colors cursor-pointer"
            >
              🗑️ Reset Statistics
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
