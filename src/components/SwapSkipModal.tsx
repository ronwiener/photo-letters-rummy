import React, { useState } from "react";
import type { Card } from "../types/game";

interface SwapSkipModalProps {
  isOpen: boolean;
  onClose: () => void;
  handCards: Card[];
  onConfirmSwapOrSkip: (selectedCardIds: string[]) => void;
}

export const SwapSkipModal: React.FC<SwapSkipModalProps> = ({
  isOpen,
  onClose,
  handCards,
  onConfirmSwapOrSkip,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const toggleSelectCard = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === handCards.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(handCards.map((c) => c.id));
    }
  };

  const handleAction = () => {
    onConfirmSwapOrSkip(selectedIds);
    setSelectedIds([]);
    onClose();
  };

  const isSwapping = selectedIds.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center">
        <h3 className="text-lg font-bold text-slate-100 mb-1">
          Swap / Skip Turn
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Choose the tiles you want to change. Select no tiles to skip your
          turn.
        </p>

        {/* Tile Selection Grid */}
        <div className="flex flex-wrap gap-2 justify-center my-4 max-h-48 overflow-y-auto p-2 bg-slate-950/50 rounded-xl border border-slate-800">
          {handCards.map((card) => {
            const isSelected = selectedIds.includes(card.id);
            return (
              <button
                key={card.id}
                onClick={() => toggleSelectCard(card.id)}
                className={`w-11 h-13 rounded-lg flex flex-col items-center justify-center font-black transition-all border ${
                  isSelected
                    ? "bg-amber-500 text-slate-950 border-amber-300 scale-105 shadow-lg ring-2 ring-amber-400"
                    : "bg-slate-800 text-slate-200 border-slate-600 hover:border-slate-400"
                }`}
              >
                <span className="text-base">
                  {card.isWild ? "★" : card.letter}
                </span>
                <span className="text-[10px] opacity-75">{card.points}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Controls */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleSelectAll}
            className="flex-1 py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl border border-slate-600 text-xs transition-all"
          >
            {selectedIds.length === handCards.length
              ? "Deselect All"
              : "Select All"}
          </button>

          <button
            onClick={handleAction}
            className={`flex-1 py-2.5 px-3 font-extrabold rounded-xl border text-xs transition-all shadow-md ${
              isSwapping
                ? "bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400"
                : "bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-500"
            }`}
          >
            {isSwapping ? `Swap (${selectedIds.length})` : "Skip Turn"}
          </button>
        </div>

        {/* Cancel/Close */}
        <button
          onClick={() => {
            setSelectedIds([]);
            onClose();
          }}
          className="mt-4 text-xs text-slate-500 hover:text-slate-300 underline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
