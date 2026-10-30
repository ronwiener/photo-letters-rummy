import { Droppable, Draggable } from "@hello-pangea/dnd";
import type { Card } from "../types/game";
import { CardComponent } from "./CardComponent";
import { calculateWordPoints } from "../utils/scoreUtils";
import { isValidWord as checkDictionaryWord } from "../utils/wordChecker";

interface WorkspaceProps {
  stagedCards: Card[];
  onStageCard?: (card: Card) => void;
  onRemoveCard: (card: Card) => void;
  onReorderCards: (newCards: Card[]) => void;
  onClearWorkspace: () => void;
  onSubmitWord: () => void;
  isValidWord: boolean;
  potentialScore: number;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  stagedCards,
  onRemoveCard,
  onClearWorkspace,
  potentialScore,
  onSubmitWord,
}) => {
  // 🛡️ Compute the resolved word string and dictionary validation boolean locally
  const stagedWordText = stagedCards
    .map((c) =>
      c.isWild || c.letter === "WILD" ? c.assignedLetter || "" : c.letter,
    )
    .join("")
    .toUpperCase();

  const isValidWord =
    stagedWordText.length >= 2 && checkDictionaryWord(stagedWordText);

  return (
    <div className="flex flex-col gap-1 p-1.5 bg-neutral-900/95 rounded-xl border border-neutral-800 shadow-2xl">
      {/* Action Header */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1">
          {stagedCards.length > 0 && (
            <button
              onClick={onClearWorkspace}
              className="px-2 py-0.5 text-[11px] font-bold rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600 active:scale-95 transition-all cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        <button
          onClick={onSubmitWord}
          disabled={stagedCards.length < 2 || !isValidWord}
          className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all shadow-md ${
            stagedCards.length < 2
              ? "bg-neutral-800 text-amber-300 border-2 border-amber-500/70 opacity-100 cursor-not-allowed"
              : !isValidWord
                ? "bg-rose-950 text-rose-200 border-2 border-rose-500 opacity-100 cursor-not-allowed"
                : "bg-linear-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-400 hover:to-cyan-400 text-slate-950 font-black border-2 border-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.5)] active:scale-95 cursor-pointer"
          }`}
        >
          {stagedCards.length < 2 ? (
            <span className="flex items-center gap-1">
              <span>⚠️</span> 2+ Letters Required
            </span>
          ) : !isValidWord ? (
            <span className="flex items-center gap-1">
              <span>🚫</span> Invalid Word
            </span>
          ) : (
            <span className="flex items-center gap-1 tracking-wide">
              <span>✨</span> Play Word (+{potentialScore} pts){" "}
              {/* 👈 Displays exact calculated score */}
            </span>
          )}
        </button>
      </div>

      {/* Staged Cards Container with Droppable zone */}
      <Droppable droppableId="workspace-rack" direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-12 p-1 rounded-lg border transition-all flex items-center justify-center gap-1 overflow-x-auto scrollbar-none ${
              snapshot.isDraggingOver
                ? "bg-cyan-950/40 border-cyan-400/80 border-dashed"
                : "bg-neutral-950/80 border-cyan-500/30"
            }`}
          >
            {stagedCards.length === 0 && !snapshot.isDraggingOver ? (
              <p className="text-[10px] text-neutral-500 italic text-center">
                Tap cards from your hand to build a word
              </p>
            ) : (
              stagedCards.map((card, index) => (
                <Draggable key={card.id} draggableId={card.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onClick={() => onRemoveCard(card)}
                      className={`shrink-0 cursor-grab active:cursor-grabbing transition-all touch-none ${
                        snapshot.isDragging ? "z-50 scale-105 opacity-80" : ""
                      }`}
                      title="Drag to reorder, or tap to return to hand"
                    >
                      <CardComponent card={card} size="sm" state="active" />
                    </div>
                  )}
                </Draggable>
              ))
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};
