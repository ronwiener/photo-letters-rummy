import React, { useState } from "react";
import type { AIDifficulty, ScoringMode } from "../types/game";
import { ScoringModeModal } from "./ScoringModeModal";

interface MainMenuProps {
  botName: string;
  aiDifficulty: AIDifficulty;
  scoringMode: ScoringMode;
  onSelectDifficulty: (diff: AIDifficulty) => void;
  onSelectScoringMode: (mode: ScoringMode) => void;
  onStartMatch: () => void;
  onOpenRules: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  botName,
  aiDifficulty,
  scoringMode,
  onSelectDifficulty,
  onSelectScoringMode,
  onStartMatch,
  onOpenRules,
}) => {
  // State to manage the explanation modal for mode selection
  const [explainMode, setExplainMode] = useState<ScoringMode | null>(null);

  const handleModeClick = (mode: ScoringMode) => {
    onSelectScoringMode(mode);
    setExplainMode(mode);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col justify-between items-center p-6 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Title Header */}
      <div className="flex flex-col items-center text-center mt-12 z-10">
        <span className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400 bg-cyan-950/50 px-3 py-1 rounded-full border border-cyan-500/30 mb-3">
          Word Card Game
        </span>
        <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-pink-500 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]">
          PHOTO LETTER RUMMY
        </h1>
        <h2 className="text-base text-neutral-400 mt-2 max-w-xs leading-relaxed">
          Form words, extend board plays, and race against {botName} to reach
          500 points!
        </h2>
      </div>

      {/* Main Options Card */}
      <div className="w-full max-w-xs flex flex-col gap-4 z-10 bg-neutral-900/80 p-6 rounded-3xl border border-neutral-800 backdrop-blur-md shadow-2xl">
        {/* Play Button */}
        <button
          onClick={onStartMatch}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-black font-black text-sm uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer transform active:scale-95"
        >
          🎮 Play vs {botName}
        </button>

        {/* Rules Button */}
        <button
          onClick={onOpenRules}
          className="w-full py-3.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 font-bold text-xs uppercase tracking-wider rounded-2xl border border-neutral-700 transition-all cursor-pointer"
        >
          📖 How to Play & Rules
        </button>

        {/* AI Opponent Difficulty Selector */}
        <div className="pt-2 border-t border-neutral-800/80 flex flex-col gap-2 text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
            {botName} AI Difficulty
          </span>
          <div className="grid grid-cols-3 gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            {(["easy", "medium", "pro"] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => onSelectDifficulty(diff)}
                className={`py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer ${
                  aiDifficulty === diff
                    ? "bg-pink-600 text-white shadow-[0_0_10px_rgba(219,39,119,0.5)]"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                {diff === "medium" ? "MED" : diff}
              </button>
            ))}
          </div>
        </div>

        {/* 🗡️ GAME SCORING MODE TOGGLE */}
        <div className="pt-2 border-t border-neutral-800/80 flex flex-col gap-2 text-center">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
            Game Play Style
          </span>
          <div className="grid grid-cols-2 gap-1.5 bg-neutral-950 p-1 rounded-xl border border-neutral-800">
            <button
              type="button"
              onClick={() => handleModeClick("cutthroat")}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                scoringMode === "cutthroat"
                  ? "bg-rose-600 text-white shadow-[0_0_10px_rgba(225,29,72,0.5)]"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Aggressive
            </button>
            <button
              type="button"
              onClick={() => handleModeClick("accumulator")}
              className={`py-1.5 px-2 rounded-lg text-[11px] font-black uppercase transition-all cursor-pointer ${
                scoringMode === "accumulator"
                  ? "bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Passive
            </button>
          </div>
          <p className="text-[10px] text-neutral-400 italic leading-tight px-1 mt-0.5">
            {scoringMode === "cutthroat"
              ? "Stealing deducts points from your opponent and transfers them to you, but beware Monica can also steal from you!"
              : "Stealing awards new points while both players still keep all original points."}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-[10px] text-neutral-500 text-center mb-4 z-10 flex flex-col gap-1">
        <span>v1.0.0 • Offline Ready</span>
        <span>Goal: 500 Points Match</span>
      </div>

      {/* 📜 Scoring Mode Explanation Modal */}
      <ScoringModeModal
        mode={explainMode}
        onSelectMode={onSelectScoringMode}
        onClose={() => setExplainMode(null)}
        onConfirm={() => setExplainMode(null)}
      />
    </div>
  );
};
