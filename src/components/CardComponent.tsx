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
  // Size mappings optimized for mobile touch targets
  const sizeClasses = {
    sm: "w-10 h-14 text-[10px]",
    md: "w-14 h-20 text-xs",
    lg: "w-20 h-28 text-sm",
  };

  const handleDragStart = (e: React.DragEvent) => {
    // 🌟 Pass the entire card JSON so drop targets (Workspace/Board) receive full metadata
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
        alt={`Photo letter ${card.letter}`}
        className="letter-card-img pointer-events-none w-full h-full object-cover brightness-105 contrast-105"
        onError={(e) => {
          // Fallback if an image fails to load
          (e.target as HTMLImageElement).src = "/photo-letters/fallback.jpg";
        }}
      />
    </div>
  );
};
