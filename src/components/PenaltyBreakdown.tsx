import React from "react";
import type { Card } from "../types/game";
import { getCardPointValue } from "../utils/scoreUtils";

interface PenaltyBreakdownProps {
  playerName: string;
  hand: Card[];
  totalPenalty: number;
}

export const PenaltyBreakdown: React.FC<PenaltyBreakdownProps> = ({
  playerName,
  hand,
  totalPenalty,
}) => {
  if (!hand || hand.length === 0) {
    return (
      <div className="flex justify-between items-center bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800 text-xs">
        <span className="font-bold text-neutral-400">{playerName}</span>
        <span className="font-bold text-emerald-400">Clean Hand (0 pts)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 bg-neutral-900/80 p-2.5 rounded-xl border border-red-900/30">
      {/* Header with Player Name & Total Penalty */}
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-red-300 tracking-wider">
          {playerName}'s Leftover Hand ({hand.length})
        </span>
        <span className="text-xs font-black text-red-400 bg-red-950/80 px-2 py-0.5 rounded-md border border-red-800/40">
          -{totalPenalty} pts
        </span>
      </div>

      {/* Compact Pill Container */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {hand.map((card, idx) => {
          const isWild = card.isWild || card.letter === "WILD";
          const penaltyVal = isWild ? 30 : getCardPointValue(card);
          const displayLetter = isWild
            ? "WILD"
            : card.assignedLetter || card.letter;

          return (
            <div
              key={`${card.id}-${idx}`}
              className={`px-2 py-0.5 rounded-md text-xs font-extrabold flex items-center gap-1 border ${
                isWild
                  ? "bg-amber-950/60 border-amber-500/50 text-amber-300"
                  : "bg-red-950/50 border-red-800/40 text-neutral-200"
              }`}
            >
              <span>{displayLetter}</span>
              <span
                className={
                  isWild
                    ? "text-amber-400 text-[10px]"
                    : "text-red-400 text-[10px]"
                }
              >
                -{penaltyVal}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
