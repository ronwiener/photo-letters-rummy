import React from "react";
import type { PlayedWord } from "../types/game";
import { CardComponent } from "./CardComponent";

interface WordHistoryModalProps {
  word: PlayedWord | null;
  onClose: () => void;
  onSelectToModify?: (word: PlayedWord) => void;
}

export const WordHistoryModal: React.FC<WordHistoryModalProps> = ({
  word,
  onClose,
  onSelectToModify,
}) => {
  if (!word) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 w-full max-w-sm shadow-2xl flex flex-col gap-4 relative">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-lg font-black text-cyan-400 tracking-wider">
              WORD INSPECTOR
            </h3>
            <span className="text-[10px] text-neutral-400 uppercase font-semibold">
              Rule 9 History & Details
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Current Word Display */}
        <div className="flex flex-col items-center gap-2 bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800">
          <div className="flex gap-1.5">
            {word.cards.map((card) => (
              <CardComponent key={card.id} card={card} size="md" />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs uppercase px-2 py-0.5 rounded-full font-bold bg-neutral-800 text-neutral-300">
              Played by: {word.playedBy.toUpperCase()}
            </span>
            {word.scoreAwarded !== undefined && (
              <span className="text-xs font-extrabold text-emerald-400">
                +{word.scoreAwarded} pts
              </span>
            )}
          </div>
        </div>

        {/* History Timeline Log */}
        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
          <span className="text-xs font-bold text-neutral-400 uppercase">
            Evolution History
          </span>
          {word.history && word.history.length > 0 ? (
            word.history.map((entry, idx) => (
              <div
                key={idx}
                className="bg-neutral-950/40 border border-neutral-800/80 rounded-xl p-2.5 text-xs flex flex-col gap-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-cyan-400 uppercase">
                    {entry.action}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-neutral-300">{entry.description}</p>
                <span className="text-[10px] text-neutral-500 uppercase">
                  Player: {entry.player}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-neutral-500 italic">
              Created as initial word with no prior modifications.
            </p>
          )}
        </div>

        {/* Action Button */}
        {onSelectToModify && (
          <button
            onClick={() => {
              onSelectToModify(word);
              onClose();
            }}
            className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            Modify / Extend Word
          </button>
        )}
      </div>
    </div>
  );
};
