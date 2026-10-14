// src/components/WildCardPickerModal.tsx
import React from "react";

interface WildCardPickerModalProps {
  isOpen: boolean;
  onSelectLetter: (letter: string) => void;
  onCancel: () => void;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export const WildCardPickerModal: React.FC<WildCardPickerModalProps> = ({
  isOpen,
  onSelectLetter,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
        <h3 className="text-xl font-bold text-amber-400 mb-1 flex items-center justify-center gap-2">
          <span>★</span> Select a Letter for Wild Card
        </h3>
        <p className="text-sm text-slate-400 mb-6">
          Choose which letter this Wild Card will represent on the board.
        </p>

        <div className="grid grid-cols-6 gap-2 mb-6">
          {ALPHABET.map((letter) => (
            <button
              key={letter}
              onClick={() => onSelectLetter(letter)}
              className="h-12 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 font-bold text-lg
                         hover:bg-amber-500 hover:text-slate-950 hover:border-amber-400 transition-all duration-150
                         active:scale-95 shadow-md"
            >
              {letter}
            </button>
          ))}
        </div>

        <button
          onClick={onCancel}
          className="text-sm text-slate-400 hover:text-slate-200 underline transition-colors"
        >
          Cancel & Return Card to Hand
        </button>
      </div>
    </div>
  );
};
