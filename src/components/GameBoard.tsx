import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { GameState, Card, PlayedWord } from "../types/game";
import { CardComponent } from "./CardComponent";

interface GameBoardProps {
  gameState: GameState;
  onCardClick?: (card: Card) => void;
  targetBoardWord?: PlayedWord | null;
  onOpenWordsModal: () => void;
  onSelectWordForModification?: (playedWord: PlayedWord) => void;
  onOpenRules: () => void;
  onReturnToMenu: () => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardClick,
  onOpenWordsModal,
  onOpenRules,
  onReturnToMenu,
  targetBoardWord,
  onSelectWordForModification,
}) => {
  const humanHand = gameState?.humanHand ?? [];
  const wordBoard = gameState?.wordBoard ?? [];
  const deckCount = gameState?.deck?.length ?? 0;

  // Color coding for unified deck badge level
  const getDeckBadgeColor = (count: number) => {
    if (count > 20)
      return "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
    if (count >= 10)
      return "bg-amber-500/20 border-amber-500/50 text-amber-400";
    return "bg-rose-500/20 border-rose-500/50 text-rose-400";
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-1.5 w-full">
      {/* Top Section: Mirror-balanced Scores Bar */}
      <div className="flex items-center justify-between gap-2 bg-neutral-900/90 py-2 px-3 rounded-xl border border-neutral-800 shadow-md">
        {/* Human Player Score (Label left, Score right) */}
        <div className="flex items-baseline gap-1.5 whitespace-nowrap bg-neutral-800/50 px-3 py-1 rounded-lg border border-neutral-700/40">
          <span className="text-xs text-neutral-300 uppercase font-bold tracking-wide">
            You
          </span>
          <span className="text-base font-extrabold text-cyan-400">
            {gameState?.matchScores?.human ?? 0}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span
            style={{
              WebkitTextStroke: "1px #ffffff",
              paintOrder: "stroke fill",
            }}
            className="text-base font-black uppercase tracking-[0.2em] text-red-600 drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]"
          >
            WORD WAR
          </span>
        </div>

        {/* Monica Score - Mirrored (Name left, Score right) */}
        <div className="flex items-baseline gap-1.5 whitespace-nowrap bg-neutral-800/50 px-3 py-1 rounded-lg border border-neutral-700/40">
          <span className="text-xs text-neutral-300 uppercase font-bold tracking-wide">
            {gameState.botName}
          </span>
          <span className="text-base font-extrabold text-pink-400">
            {gameState?.matchScores?.computer ?? 0}
          </span>
        </div>
      </div>

      {/* Middle Section: Deck Counter, Words List Button, & Relocated Rules/Menu */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-neutral-900/80 rounded-lg border border-neutral-800 text-xs text-neutral-200">
        {/* Unified Deck Counter Badge */}
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-neutral-300 font-bold uppercase text-[14px] tracking-wide">
            Deck:
          </span>
          <span
            className={`px-2 py-0.5 text-sm font-black border rounded-full ${getDeckBadgeColor(
              deckCount,
            )}`}
          >
            {deckCount}
          </span>
        </div>

        {/* CENTER: Words Played Button */}
        <button
          type="button"
          onClick={onOpenWordsModal}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-semibold text-slate-100 rounded-lg border border-slate-700 transition-all shadow-sm cursor-pointer"
        >
          Words List
        </button>

        {/* 🎮 Relocated Rules & Menu Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenRules}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 rounded text-xs font-extrabold border border-cyan-500/30 transition-colors cursor-pointer"
            title="View Rules"
          >
            Rules
          </button>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  "Return to main menu? Your current match progress will be lost.",
                )
              ) {
                onReturnToMenu();
              }
            }}
            className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs font-extrabold border border-neutral-700 transition-colors cursor-pointer"
            title="Main Menu"
          >
            Menu
          </button>
        </div>
      </div>

      {/* Shared Neon Word Board (Unchanged internal styles) */}
      <div className="bg-neutral-900/60 p-3 rounded-xl border border-neutral-800 flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        {wordBoard.length === 0 ? (
          <p className="text-xs text-neutral-400 italic my-auto text-center">
            No words played yet. Be the first to build one!
          </p>
        ) : (
          <div className="my-auto flex flex-col gap-3 w-full">
            {wordBoard.map((played) => {
              const isSelected = targetBoardWord?.id === played.id;

              return (
                <button
                  key={played.id}
                  type="button"
                  onClick={() =>
                    onSelectWordForModification &&
                    onSelectWordForModification(played)
                  }
                  className={`max-w-full flex items-center p-1.5 rounded-xl transition-colors duration-150 cursor-pointer shrink-0 self-center ${
                    isSelected
                      ? "border-2 border-amber-400 bg-amber-500/30 ring-2 ring-amber-400/50"
                      : played.playedBy === "human"
                        ? "border border-cyan-400 bg-cyan-950/50 hover:border-cyan-300"
                        : "border border-pink-400 bg-pink-950/50 hover:border-pink-300"
                  }`}
                  title={
                    isSelected
                      ? "Currently selected for extension"
                      : "Tap to extend or steal this word"
                  }
                >
                  {/* Scroll container nested inside with padding to protect end cards from clipping */}
                  <div className="w-full overflow-x-auto scrollbar-none touch-pan-x px-1 py-0.5">
                    <div className="flex items-center gap-1.5 min-w-max">
                      {played.cards.map((card, idx) => (
                        <CardComponent
                          key={`${played.id}-${card.id}-${idx}`}
                          card={card}
                          size="md"
                          state="active"
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Human Hand Header */}
      <div className="flex justify-between items-center px-1.5 mt-1">
        <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
          Your Hand ({humanHand.length} cards)
        </span>
      </div>

      {/* Human Cards Droppable Rack */}
      <Droppable droppableId="player-hand" direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`max-w-2xl mx-auto shrink-0 flex flex-row flex-nowrap justify-center items-center gap-1 p-2 rounded-xl border overflow-x-auto transition-all ${
              snapshot.isDraggingOver
                ? "bg-neutral-900 border-amber-400/60"
                : "bg-neutral-900/60 border-neutral-800"
            }`}
          >
            {humanHand.map((card, index) => (
              <Draggable key={card.id} draggableId={card.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`touch-none ${
                      snapshot.isDragging ? "z-50 scale-105" : ""
                    }`}
                  >
                    <CardComponent
                      card={card}
                      state="active"
                      onClick={() => onCardClick && onCardClick(card)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
