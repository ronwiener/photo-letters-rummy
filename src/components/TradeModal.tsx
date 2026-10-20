import React from "react";
import type { Card } from "../types/game";

interface TradeModalProps {
  isOpen: boolean;
  humanHand: Card[];
  selectedTradeCardIds: string[];
  onToggleCardSelection: (cardId: string) => void;
  onConfirmTrade: () => void;
  onClose: () => void;
}

export const TradeModal: React.FC<TradeModalProps> = ({
  isOpen,
  humanHand,
  selectedTradeCardIds,
  onToggleCardSelection,
  onConfirmTrade,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 border border-neutral-700 p-5 rounded-2xl max-w-xs w-full text-white shadow-2xl">
        <h3 className="text-base font-extrabold mb-1">Trade Letters</h3>
        <p className="text-xs text-neutral-400 mb-3">
          Select hand cards to swap into the deck. Fresh cards will be drawn and
          your turn will end.
        </p>

        {/* Hand Card Selection Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4 max-h-48 overflow-y-auto p-1">
          {humanHand.map((card) => {
            const isSelected = selectedTradeCardIds.includes(card.id);
            return (
              <div
                key={card.id}
                onClick={() => onToggleCardSelection(card.id)}
                className={`p-2 rounded-lg border cursor-pointer text-center transition-all flex flex-col items-center justify-center select-none ${
                  isSelected
                    ? "border-sky-400 bg-sky-600/30 scale-105 shadow-md shadow-sky-500/20"
                    : "border-neutral-700 bg-neutral-800 hover:border-neutral-500"
                }`}
              >
                <span className="text-lg font-black">{card.letter}</span>
              </div>
            );
          })}
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-xs font-semibold transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmTrade}
            disabled={selectedTradeCardIds.length === 0}
            className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition shadow-md"
          >
            Trade ({selectedTradeCardIds.length})
          </button>
        </div>
      </div>
    </div>
  );
};
