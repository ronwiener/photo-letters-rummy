import React from "react";
import type { PlayedWord } from "../types/game";

interface WordsPlayedModalProps {
  isOpen: boolean;
  onClose: () => void;
  wordBoard: PlayedWord[];
}

export const WordsPlayedModal: React.FC<WordsPlayedModalProps> = ({
  isOpen,
  onClose,
  wordBoard,
}) => {
  if (!isOpen) return null;

  // Filter words played/stolen by each player
  const playerWords = wordBoard.filter((w) => w.playedBy === "human");
  const monicaWords = wordBoard.filter(
    (w) => w.playedBy === "monica" || (w.playedBy as string) === "computer",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-white max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="pb-4 border-b border-slate-800">
          <h2 className="text-xl font-bold tracking-wide text-emerald-400">
            📜 Words Played History
          </h2>
        </div>

        {/* Content Columns */}
        <div className="grid grid-cols-2 gap-4 py-4 overflow-y-auto flex-1">
          {/* You Column */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
              <h3 className="font-semibold text-sky-400">You</h3>
              <span className="text-xs bg-sky-950 text-sky-300 px-2 py-0.5 rounded-full border border-sky-800">
                {playerWords.length}
              </span>
            </div>
            {playerWords.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No words played yet.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {playerWords.map((item) => (
                  <li
                    key={item.id}
                    className="text-sm font-mono tracking-wider bg-slate-900/60 px-2.5 py-1 rounded border border-slate-700/30 text-slate-200"
                  >
                    {item.word.toUpperCase()}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Monica Column */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
              <h3 className="font-semibold text-pink-400">Monica</h3>
              <span className="text-xs bg-pink-950 text-pink-300 px-2 py-0.5 rounded-full border border-pink-800">
                {monicaWords.length}
              </span>
            </div>
            {monicaWords.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No words played yet.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {monicaWords.map((item) => (
                  <li
                    key={item.id}
                    className="text-sm font-mono tracking-wider bg-slate-900/60 px-2.5 py-1 rounded border border-slate-700/30 text-slate-200"
                  >
                    {item.word.toUpperCase()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-900/20 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
