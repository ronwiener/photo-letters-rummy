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
        <div className="flex items-center border-b border-neutral-800 pb-3">
          <div>
            <span
              className={`text-xs font-black uppercase tracking-widest ${
                isCutthroat ? "text-red-500" : "text-white/80"
              }`}
            >
              Scoring Mode Rule
            </span>
            <h3 className="text-xl font-black text-white">
              {isCutthroat ? "High Risk" : "Low Risk"}
            </h3>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-col gap-3 leading-relaxed">
          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 space-y-2">
            <h4 className="font-extrabold text-neutral-400 uppercase text-xs tracking-wider">
              How Stealing Works
            </h4>
            <p className="text-base leading-relaxed text-neutral-300">
              {isCutthroat ? (
                <>
                  When you or Monica steal a word, the thief takes ownership and
                  gets full points.{" "}
                  <strong className="text-red-500">
                    But beware the risk is high, the original owner's score is
                    reduced by the point value of the stolen word!
                  </strong>
                </>
              ) : (
                <>
                  <span className="text-red-500">
                    When you or Monica steal a word, the thief takes ownership
                    and gets full points.{" "}
                  </span>
                  <strong className="text-white">
                    However, the original owner keeps all points they previously
                    earned from that word! Now the strategy changes, do you
                    build your own word or steal?
                  </strong>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              if (onSelectMode) onSelectMode(mode);
              onConfirm();
              onClose();
            }}
            className={`flex-1 py-3 font-extrabold text-sm uppercase tracking-wider rounded-xl transition-all cursor-pointer ${
              isCutthroat
                ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950/40"
                : "bg-white hover:bg-neutral-100 text-red-600 shadow-lg shadow-black/40"
            }`}
          >
            Select {isCutthroat ? "High Risk" : "Low Risk"}
          </button>
        </div>
      </div>
    </div>
  );
};
