import React from "react";
import type { ScoringMode } from "../types/game";

interface ScoringModeModalProps {
  mode: ScoringMode | null;
  onSelectMode?: (mode: ScoringMode) => void;
  onClose: () => void;
  onConfirm: () => void;
}

export const ScoringModeModal: React.FC<ScoringModeModalProps> = ({
  mode,
  onClose,
  onSelectMode,
  onConfirm,
}) => {
  if (!mode) return null;

  const isCutthroat = mode === "cutthroat";

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-4 text-neutral-200">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl font-bold ${
              isCutthroat
                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
            }`}
          >
            {isCutthroat ? "🗡️" : "🔋"}
          </div>
          <div>
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${
                isCutthroat ? "text-rose-400" : "text-emerald-400"
              }`}
            >
              Scoring Mode Rule
            </span>
            <h3 className="text-lg font-black text-white">
              {isCutthroat ? "Aggressive" : "Passive"}
            </h3>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-3 text-xs leading-relaxed">
          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-2">
            <h4 className="font-extrabold text-amber-400 uppercase text-[11px]">
              How Stealing Works
            </h4>
            <p className="text-neutral-300">
              {isCutthroat ? (
                <>
                  When you or Monica steal a word, the thief takes ownership and
                  gets full points.{" "}
                  <strong className="text-rose-400">
                    The original owner's score is reduced by the point value of
                    the stolen word!
                  </strong>
                </>
              ) : (
                <>
                  When you or Monica steal a word, the thief takes ownership and
                  gets full points.{" "}
                  <strong className="text-emerald-400">
                    The original owner keeps all points they previously earned
                    from that word!
                  </strong>
                </>
              )}
            </p>
          </div>

          <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
            <h4 className="font-extrabold text-cyan-400 uppercase text-[11px]">
              Gameplay Vibe
            </h4>
            <p className="text-neutral-400">
              {isCutthroat
                ? "High risk, aggressive swings! Scores fluctuate dynamically, making every steal a double blow to your opponent."
                : "Fast-paced, high-scoring matches! Focuses on offensive word building without losing hard-earned points to steals."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              if (onSelectMode) onSelectMode(mode);
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-2.5 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-slate-950 ${
              isCutthroat
                ? "bg-rose-400 hover:bg-rose-300 shadow-lg shadow-rose-950/40"
                : "bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-950/40"
            }`}
          >
            Select {isCutthroat ? "Aggressive" : "Passive"}
          </button>
        </div>
      </div>
    </div>
  );
};
