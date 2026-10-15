// src/components/CardComponent.tsx

import type { Card } from "../types/game";

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
  const sizeClasses = {
    sm: "w-10 h-14 text-[10px]",
    md: "w-14 h-20 text-xs",
    lg: "w-20 h-28 text-sm",
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(card));
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onClick={onClick}
      className={`letter-card-container relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 ease-out bg-neutral-900 border border-neutral-700/50 ${sizeClasses[size]} card-state-${state}`}
    >
      <img
        src={card.photoUrl}
        alt={`Photo letter ${card.assignedLetter || card.letter}`}
        className="letter-card-img pointer-events-none w-full h-full object-cover brightness-105 contrast-105"
        onError={(e) => {
          // Fallback image if path fails to resolve
          (e.target as HTMLImageElement).src = "/photo-letters/fallback.jpg";
        }}
      />

      {/* 🌟 WILD CARD OVERLAY: Shows selected assigned letter clearly on top */}
      {card.isWild && card.assignedLetter && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center border-2 border-cyan-400 rounded-xl">
          <span className="text-xl font-black text-cyan-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {card.assignedLetter}
          </span>
        </div>
      )}
    </div>
  );
};
