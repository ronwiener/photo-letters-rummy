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
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardClick,
  onOpenWordsModal,
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
      {/* Top Section: Balanced Side-by-Side Scores Bar */}
      <div className="flex items-center justify-between bg-neutral-900/80 py-1.5 px-3 rounded-xl border border-neutral-800 shadow-sm">
        {/* Human Player Score */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider">
            You
          </span>
          <span className="text-base font-extrabold text-cyan-400">
            {gameState?.roundScores?.human ?? 0}{" "}
            <span className="text-[10px] font-semibold text-neutral-500">
              pts
            </span>
          </span>
        </div>

        <div className="h-3.5 w-px bg-neutral-800" />

        {/* Monica Score & Hand Count */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-extrabold text-pink-400">
            {gameState?.roundScores?.computer ?? 0}{" "}
            <span className="text-[10px] font-semibold text-neutral-500">
              pts
            </span>
          </span>
          <span className="text-[11px] text-neutral-400 uppercase font-bold tracking-wider">
            {botName}
          </span>

          {/* Monica's Card Count Badge */}
          <span className="px-1.5 py-0.2 bg-pink-500/20 border border-pink-500/40 text-pink-300 text-[10px] font-extrabold rounded-full ml-0.5">
            {gameState?.computerHand?.length ?? 0}{" "}
            {gameState?.computerHand?.length === 1 ? "card" : "cards"}
          </span>
        </div>
      </div>

      {/* Middle Section: Compact Deck Counter & Words Played Summary */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-neutral-900/80 rounded-lg border border-neutral-800 text-[11px] text-neutral-300">
        {/* Unified Deck Counter Badge */}
        <div className="flex items-center gap-1 font-medium">
          <span className="text-neutral-400 font-bold uppercase text-[9px] tracking-wide">
            Deck:
          </span>
          <span
            className={`px-1.5 py-0.2 text-[10px] font-black border rounded-full ${getDeckBadgeColor(
              deckCount,
            )}`}
          >
            {deckCount}
          </span>
        </div>

        {/* CENTER: Words Played Button */}
        <button
          onClick={onOpenWordsModal}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 active:scale-95 text-xs font-medium text-slate-200 rounded-lg border border-slate-700 transition-all shadow-sm cursor-pointer"
        >
          📖 Words List
        </button>

        {/* Played Words Count */}
        <div className="flex items-center gap-1 font-medium">
          <span className="text-neutral-400 font-bold uppercase text-[9px] tracking-wide">
            Words Played:
          </span>
          <span className="text-[10px] font-black text-emerald-400 bg-neutral-800/80 px-1.5 py-0.2 rounded border border-neutral-700">
            {wordBoard.length}
          </span>
        </div>
      </div>

      {/* Shared Neon Word Board */}
      <div className="bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 flex-1 min-h-24 max-h-64 sm:max-h-80 overflow-y-auto overflow-x-hidden flex flex-wrap content-start items-start justify-center gap-x-3.5 gap-y-2.5 sm:gap-x-4 sm:gap-y-3 scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
        {wordBoard.length === 0 ? (
          <p className="text-[11px] text-neutral-500 italic my-auto">
            No words played yet. Be the first to build one!
          </p>
        ) : (
          wordBoard.map((played) => {
            const isSelected = targetBoardWord?.id === played.id;
            const isShortWord = played.cards.length <= 3;

            return (
              <button
                key={played.id}
                type="button"
                onClick={() =>
                  onSelectWordForModification &&
                  onSelectWordForModification(played)
                }
                className={`flex p-0.5 rounded-lg transition-all duration-200 active:scale-95 cursor-pointer flex-shrink-0 max-w-full overflow-x-auto ${
                  isShortWord ? "w-auto" : "w-full sm:w-auto justify-center"
                } ${
                  isSelected
                    ? "border-2 border-amber-400 bg-amber-500/30 ring-2 ring-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.8)] scale-105 z-10"
                    : played.playedBy === "human"
                      ? "border border-cyan-400 bg-cyan-950/50 shadow-[0_0_8px_rgba(6,182,212,0.3)] hover:border-cyan-300"
                      : "border border-pink-400 bg-pink-950/50 shadow-[0_0_8px_rgba(236,72,153,0.3)] hover:border-pink-300"
                }`}
                title={
                  isSelected
                    ? "Currently selected for extension"
                    : "Tap to extend or steal this word"
                }
              >
                {played.cards.map((card, idx) => (
                  <CardComponent
                    key={`${played.id}-${card.id}-${idx}`}
                    card={card}
                    size="md"
                    state="active"
                  />
                ))}
              </button>
            );
          })
        )}
      </div>

      {/* Human Hand Header */}
      <div className="flex justify-between items-center px-1 mt-0.5">
        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
          Your Hand ({humanHand.length} cards)
        </span>
      </div>

      {/* Human Cards Droppable Rack */}
      <Droppable droppableId="player-hand" direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`max-w-2xl mx-auto flex flex-row flex-nowrap justify-center items-center gap-1 p-1.5 rounded-xl border overflow-x-auto transition-all ${
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
