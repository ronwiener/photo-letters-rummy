import React from "react";
import type { GameStatistics, PlayerId } from "../types/game";

interface StatsModalProps {
  isOpen: boolean;
  stats: GameStatistics;
  isGameOver?: boolean;
  winner?: "human" | "computer" | "tie" | "draw" | PlayerId | null;
  matchScores?: { human: number; computer: number };
  onClose: () => void;
  onNewMatch?: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  isOpen,
  stats,
  isGameOver,
  winner,
  matchScores,
  onClose,
  onNewMatch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl text-white flex flex-col gap-4">
        {/* Game Over Banner (Renders if open via Game Over) */}
        {isGameOver && (
          <div className="text-center bg-neutral-800/80 p-3 rounded-xl border border-amber-500/30">
            <h2 className="text-xl font-black tracking-wide text-amber-400">
              {winner === "human"
                ? "🏆 VICTORY!"
                : winner === "computer"
                  ? "🤖 MONICA WINS!"
                  : "🤝 TIE MATCH!"}
            </h2>
            {matchScores && (
              <p className="text-xs text-neutral-300 font-bold mt-1">
                Final Score — You: {matchScores.human} | Monica:{" "}
                {matchScores.computer}
              </p>
            )}
          </div>
        )}

        {/* Modal Title */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-300">
            Career Statistics
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Existing Stats Display (Wins, Losses, High Scores, Words) */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between bg-neutral-800/50 p-2 rounded">
            <span className="text-neutral-400">Matches Played:</span>
            <span className="font-bold text-white">{stats.gamesPlayed}</span>
          </div>
          <div className="flex justify-between bg-neutral-800/50 p-2 rounded">
            <span className="text-neutral-400">Wins:</span>
            <span className="font-bold text-emerald-400">
              {stats.wins}
            </span>{" "}
            {/* 👈 Use prop */}
          </div>
          <div className="flex justify-between bg-neutral-800/50 p-2 rounded">
            <span className="text-neutral-400">Losses:</span>
            <span className="font-bold text-rose-400">{stats.losses}</span>{" "}
            {/* 👈 Use prop */}
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-800">
          {onNewMatch && (
            <button
              onClick={onNewMatch}
              className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs rounded-xl transition-colors shadow-md"
            >
              🎮 Start New Game
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-2 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs rounded-xl border border-neutral-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
