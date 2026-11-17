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
  const botName = gameState?.botName ?? "Monica";

  // Color coding for unified deck badge level
  const getDeckBadgeColor = (count: number) => {
    if (count > 20)
      return "bg-emerald-500/20 border-emerald-500/50 text-emerald-400";
    if (count >= 10)
      return "bg-amber-500/20 border-amber-500/50 text-amber-400";
    return "bg-rose-500/20 border-rose-500/50 text-rose-400";
  };

  return (
    <div className="flex flex-col gap-1.5 w-full h-full">
      {/* Top Section: Single-Line Balanced Scores Bar & Action Buttons */}
      <div className="flex items-center justify-between gap-1 bg-neutral-900/80 py-1.5 px-2.5 rounded-xl border border-neutral-800 shadow-sm">
        {/* Human Player Score */}
        <div className="flex items-baseline gap-1 whitespace-nowrap">
          <span className="text-xs text-neutral-300 uppercase font-bold tracking-wide">
            You
          </span>
          <span className="text-base font-extrabold text-cyan-400">
            {gameState?.matchScores?.human ?? 0}
            <span className="text-[11px] font-semibold text-neutral-400 ml-0.5">
              pts
            </span>
          </span>
        </div>

        {/* 🎮 Compact Single-Line Rules & Menu Buttons with Larger Gap */}
        <div className="flex items-center gap-3 bg-neutral-800/70 p-1 rounded-lg border border-neutral-700/50 shrink-0">
          <button
            type="button"
            onClick={onOpenRules}
            className="px-2.5 py-1 bg-neutral-900/80 hover:bg-neutral-700 text-cyan-300 rounded text-xs font-extrabold whitespace-nowrap border border-cyan-500/20 transition-colors cursor-pointer flex items-center gap-1"
            title="View Rules"
          >
            <span>Rules</span>
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
            className="px-2.5 py-1 bg-neutral-900/80 hover:bg-neutral-700 text-neutral-300 rounded text-xs font-extrabold whitespace-nowrap border border-neutral-700/60 transition-colors cursor-pointer flex items-center gap-1"
            title="Main Menu"
          >
            <span>Menu</span>
          </button>
        </div>

        {/* Monica Score & Compact Hand Pill */}
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-extrabold text-pink-400">
              {gameState?.matchScores?.computer ?? 0}
              <span className="text-[11px] font-semibold text-neutral-400 ml-0.5">
                pts
              </span>
            </span>
            <span className="text-xs text-neutral-300 uppercase font-bold tracking-wide">
              {gameState.botName}
            </span>
          </div>

          {/* Compact Hand Count Pill */}
          <span
            className="px-1.5 py-0.5 bg-pink-500/20 border border-pink-500/40 text-pink-300 text-[11px] font-extrabold rounded-full"
            title={`${gameState.botName} has ${gameState?.computerHand?.length ?? 0} cards`}
          >
            {gameState?.computerHand?.length ?? 0}{" "}
            {gameState?.computerHand?.length === 1 ? "card" : "cards"}
          </span>
        </div>
      </div>

      {/* Middle Section: Compact Deck Counter & Words Played Summary */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-900/80 rounded-lg border border-neutral-800 text-xs text-neutral-200">
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
          onClick={onOpenWordsModal}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-sm font-semibold text-slate-100 rounded-lg border border-slate-700 transition-all shadow-sm cursor-pointer"
        >
          📖 Words List
        </button>

        {/* Played Words Count */}
        <div className="flex items-center gap-1.5 font-medium">
          <span className="text-neutral-300 font-bold uppercase text-[12px] tracking-wide">
            Words Played:
          </span>
          <span className="text-sm font-black text-emerald-400 bg-neutral-800/80 px-2 py-0.5 rounded border border-neutral-700">
            {wordBoard.length}
          </span>
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
