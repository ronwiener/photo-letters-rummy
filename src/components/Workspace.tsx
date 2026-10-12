import React, { useState } from "react";
import type { Card } from "../types/game";
import { CardComponent } from "./CardComponent";
import { getWordScore } from "../constants/gameConstants";

interface WorkspaceProps {
  stagedCards: Card[];
  onRemoveCard: (card: Card) => void;
  onReorderCards: (newCards: Card[]) => void;
  onClearWorkspace: () => void;
  onSubmitWord: () => void;
  isValidWord: boolean;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  stagedCards,
  onRemoveCard,
  onReorderCards,
  onClearWorkspace,
  onSubmitWord,
  isValidWord,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const potentialScore =
    stagedCards.length >= 3 ? getWordScore(stagedCards.length) : 0;

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...stagedCards];
    const [movedCard] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedCard);

    // 🚀 Updates stagedCards directly in App.tsx
    onReorderCards(updated);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="flex flex-col gap-1.5 p-2 bg-neutral-900/95 rounded-xl border border-neutral-800 shadow-2xl">
      {/* Action Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          {stagedCards.length > 0 && (
            <button
              onClick={onClearWorkspace}
              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600 active:scale-95 transition-all cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <button
          onClick={onSubmitWord}
          disabled={stagedCards.length < 3 || !isValidWord}
          className={`px-3.5 py-1.5 text-xs font-black rounded-lg transition-all shadow-md ${
            stagedCards.length < 3
              ? /* State 1: Need 3+ Letters - High-contrast subtle warning */
                "bg-neutral-800 text-amber-300 border-2 border-amber-500/70 opacity-100 cursor-not-allowed"
              : !isValidWord
                ? /* State 2: Invalid Word - High-visibility crimson / rose warning */
                  "bg-rose-950 text-rose-200 border-2 border-rose-500 opacity-100 cursor-not-allowed"
                : /* State 3: Valid Word - Super vibrant neon pink/cyan gradient with dark bold text */
                  "bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-slate-950 font-black border-2 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-95 cursor-pointer"
          }`}
        >
          {stagedCards.length < 3 ? (
            <span className="flex items-center gap-1">
              <span>⚠️</span> Need 3+ Letters
            </span>
          ) : !isValidWord ? (
            <span className="flex items-center gap-1">
              <span>🚫</span> Invalid Word
            </span>
          ) : (
            <span className="flex items-center gap-1 tracking-wide">
              <span>✨</span> Play Word (+{potentialScore} pts)
            </span>
          )}
        </button>
      </div>

      {/* Staged Cards Container */}
      <div className="min-h-16 p-1.5 bg-neutral-950/80 rounded-lg border border-cyan-500/30 flex items-center justify-center gap-1 overflow-x-auto scrollbar-none">
        {stagedCards.length === 0 ? (
          <p className="text-[11px] text-neutral-500 italic text-center">
            Tap or drag cards from your hand to build a word
          </p>
        ) : (
          stagedCards.map((card, index) => (
            <div
              key={card.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onRemoveCard(card)}
              className={`flex-shrink-0 cursor-grab active:cursor-grabbing transition-all ${
                draggedIndex === index ? "opacity-30 scale-95" : ""
              } ${
                dragOverIndex === index
                  ? "border-b-2 border-cyan-400 -translate-y-1"
                  : ""
              }`}
              title="Drag to reorder, or tap to return to hand"
            >
              <CardComponent card={card} size="sm" state="active" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
