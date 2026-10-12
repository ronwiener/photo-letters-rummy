import React from "react";
import type { GameState, Card, PlayedWord } from "../types/game";
import { CardComponent } from "./CardComponent";

interface GameBoardProps {
  gameState: GameState;
  onCardClick?: (card: Card) => void;
  onDrawPileClick?: () => void;
  onDiscardPileClick?: () => void;
  targetBoardWord?: PlayedWord | null;
  onSelectWordForModification?: (playedWord: PlayedWord) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onCardClick,
  onDrawPileClick,
  onDiscardPileClick,
  targetBoardWord,
  onSelectWordForModification,
}) => {
  const discardPile = gameState?.discardPile ?? [];
  const topDiscardCard =
    discardPile.length > 0 ? discardPile[discardPile.length - 1] : null;

  const humanHand = gameState?.humanHand ?? [];
  const wordBoard = gameState?.wordBoard ?? [];
  const drawPile = gameState?.drawPile ?? [];
  const botName = gameState?.botName ?? "Monica";

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Top Section: Balanced Side-by-Side Scores Bar */}
      <div className="flex items-center justify-between bg-neutral-900/80 py-2.5 px-4 rounded-xl border border-neutral-800 shadow-sm">
        {/* Human Player Score */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">
            You
          </span>
          <span className="text-lg font-extrabold text-cyan-400">
            {gameState?.roundScores?.human ?? 0}{" "}
            <span className="text-xs font-semibold text-neutral-500">pts</span>
          </span>
        </div>

        <div className="h-4 w-px bg-neutral-800" />
        {/* Monica Score & Hand Count */}
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-pink-400">
            {gameState?.roundScores?.computer ?? 0}{" "}
            <span className="text-xs font-semibold text-neutral-500">pts</span>
          </span>
          <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">
            {botName}
          </span>

          {/* 🎴 MONICA'S CARD COUNT BADGE */}
          <span className="px-2 py-0.5 bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-extrabold rounded-full ml-1">
            {gameState?.computerHand?.length ?? 0}{" "}
            {gameState?.computerHand?.length === 1 ? "card" : "cards"}
          </span>
        </div>
      </div>

      {/* Middle Section: Piles & Played Word Summary */}
      <div className="grid grid-cols-3 gap-2 bg-neutral-900/80 p-2.5 rounded-2xl border border-neutral-800 items-center">
        {/* Draw Pile */}
        <button
          onClick={onDrawPileClick}
          className="flex flex-col items-center justify-center bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl p-2 transition-all active:scale-95 cursor-pointer"
        >
          <span className="text-xl font-black text-cyan-400">
            {drawPile.length}
          </span>
          <span className="text-[10px] text-neutral-400 uppercase font-bold">
            Draw Pile
          </span>
        </button>

        {/* Discard Pile */}
        <button
          onClick={onDiscardPileClick}
          className="flex flex-col items-center justify-center bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 rounded-xl p-2 transition-all active:scale-95 cursor-pointer"
        >
          {topDiscardCard ? (
            <div className="w-8 h-10 flex items-center justify-center">
              <CardComponent card={topDiscardCard} size="sm" state="active" />
            </div>
          ) : (
            <span className="text-xs text-neutral-500 font-bold">Empty</span>
          )}
          <span className="text-[10px] text-neutral-400 uppercase font-bold mt-1">
            Discard
          </span>
        </button>

        {/* Played Words Count */}
        <div className="flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold text-emerald-400">
            {wordBoard.length}
          </span>
          <span className="text-[10px] text-neutral-400 uppercase font-bold">
            Words Played
          </span>
        </div>
      </div>

      {/* Shared Neon Word Board */}
      <div className="bg-neutral-900/60 p-3 rounded-2xl border border-neutral-800 min-h-20 max-h-35 overflow-y-auto flex flex-wrap gap-2.5 items-center justify-center scrollbar-thin scrollbar-thumb-neutral-700">
        {wordBoard.length === 0 ? (
          <p className="text-xs text-neutral-500 italic">
            No words played yet. Be the first to build one!
          </p>
        ) : (
          wordBoard.map((played) => {
            // Check if this word is currently selected for extension/editing
            const isSelected = targetBoardWord?.id === played.id;

            return (
              <button
                key={played.id}
                onClick={() =>
                  onSelectWordForModification &&
                  onSelectWordForModification(played)
                }
                className={`flex p-1.5 rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
                  isSelected
                    ? /* 🌟 SELECTED TARGET WORD: High-visibility glowing amber ring */
                      "border-2 border-amber-400 bg-amber-500/30 ring-4 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.8)] scale-105 z-10"
                    : played.playedBy === "human"
                      ? /* 🩵 PLAYER WORD: Bright cyan neon border */
                        "border-2 border-cyan-400 bg-cyan-950/50 shadow-[0_0_12px_rgba(6,182,212,0.4)] hover:border-cyan-300 hover:shadow-[0_0_18px_rgba(6,182,212,0.6)]"
                      : /* 🩷 MONICA WORD: Bright pink neon border */
                        "border-2 border-pink-400 bg-pink-950/50 shadow-[0_0_12px_rgba(236,72,153,0.4)] hover:border-pink-300 hover:shadow-[0_0_18px_rgba(236,72,153,0.6)]"
                }`}
                title={
                  isSelected
                    ? "Currently selected for extension"
                    : "Tap to extend or rearrange this word"
                }
              >
                {played.cards.map((card) => (
                  <CardComponent
                    key={card.id}
                    card={card}
                    size="sm"
                    state="active"
                  />
                ))}
              </button>
            );
          })
        )}
      </div>

      {/* Human Hand Header */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Your Hand ({humanHand.length} cards)
        </span>
      </div>

      {/* Human Cards */}
      <div className="max-w-md mx-auto grid grid-cols-5 gap-2 p-3 bg-neutral-900/60 rounded-2xl border border-neutral-800 justify-items-center">
        {humanHand.map((card) => (
          <CardComponent
            key={card.id}
            card={card}
            state="active"
            onClick={() => onCardClick && onCardClick(card)}
          />
        ))}
      </div>
    </div>
  );
};
