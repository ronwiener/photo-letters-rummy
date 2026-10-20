import React, { useState } from "react";
import type { Card } from "../types/game";
import { getCardPointValue } from "../utils/scoreUtils";

interface CardComponentProps {
  card: Card;
  state?: "inactive" | "active" | "selected" | "illuminated";
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
}

export const CardComponent: React.FC<CardComponentProps> = ({
  card,
  state = "inactive",
  onClick,
  size = "md",
}) => {
  const [imgError, setImgError] = useState(false);

  // 📐 REDUCED CARD DIMENSIONS & TEXT SIZES TO SAVE VIEW SPACE
  const sizeClasses = {
    sm: "w-8 h-11 text-[9px]", // Board word tiles (was w-10 h-14)
    md: "w-11 h-16 text-[10px]", // Hand & workspace cards (was w-14 h-20)
    lg: "w-16 h-22 text-xs", // Featured/selected cards (was w-20 h-28)
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(card));
    e.dataTransfer.effectAllowed = "move";
  };

  const pointValue = getCardPointValue(card);
  const isWild = card.isWild || card.letter === "WILD";
  const displayLetter = card.assignedLetter || (isWild ? "WILD" : card.letter);

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`letter-card-container relative overflow-hidden cursor-pointer transition-all duration-200 ease-out border rounded-md ${
        isWild
          ? "bg-linear-to-br from-amber-950 via-neutral-900 to-purple-950 border-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.2)]"
          : "bg-neutral-900 border-neutral-700/50"
      } ${sizeClasses[size]} card-state-${state}`}
    >
      {/* 📸 CARD PHOTO IMAGE */}
      {card.photoUrl && !imgError ? (
        <img
          src={card.photoUrl}
          alt={`Photo letter ${displayLetter}`}
          className="letter-card-img pointer-events-none w-full h-full object-cover brightness-105 contrast-105"
          onError={() => setImgError(true)}
        />
      ) : (
        /* 🎨 STYLED FALLBACK / UNASSIGNED WILD CARD DISPLAY */
        <div className="w-full h-full flex flex-col items-center justify-center p-0.5 text-center bg-gradient-to-b from-neutral-800 to-neutral-950">
          <span
            className={`font-black tracking-wider ${
              isWild && !card.assignedLetter
                ? "text-[8px] text-amber-400 uppercase drop-shadow-[0_0_6px_rgba(245,158,11,0.6)]"
                : "text-base text-cyan-300"
            }`}
          >
            {displayLetter}
          </span>
        </div>
      )}

      {/* 🌟 WILD CARD OVERLAY (BOARD ASSIGNED) */}
      {isWild && card.assignedLetter && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center border-2 border-cyan-400">
          <span className="text-base font-black text-cyan-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {card.assignedLetter}
          </span>
        </div>
      )}

      {/* 🌟 POINT BADGE FOR REGULAR CARDS */}
      {!isWild && (
        <div className="absolute bottom-0.5 right-0.5 z-10 pointer-events-none flex items-center justify-center w-3.5 h-3.5 rounded-full bg-black/20 backdrop-blur-[1px] text-yellow-300 text-[8px] font-black leading-none border border-yellow-400/40 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {pointValue}
        </div>
      )}

      {/* 🌟 WILD CARD STAR BADGE */}
      {isWild && (
        <div className="absolute bottom-0 right-0 z-10 pointer-events-none flex items-center justify-center w-3.5 h-3.5 bg-purple-900/40 backdrop-blur-[1px] text-amber-300 text-[8px] font-black leading-none border-t border-l border-amber-400/40 drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.95)]">
          ★
        </div>
      )}
    </div>
  );
};
