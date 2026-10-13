import React, { useState } from "react";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "scoring" | "extensions" | "match"
  >("overview");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-hidden text-neutral-200">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400">
              Official Guide
            </span>
            <h2 className="text-xl font-black text-white">
              How to Play Photo Letter Rummy
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-[11px] font-extrabold text-center">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-cyan-600 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Turn Flow
          </button>
          <button
            onClick={() => setActiveTab("scoring")}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "scoring"
                ? "bg-cyan-600 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Scoring
          </button>
          <button
            onClick={() => setActiveTab("extensions")}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "extensions"
                ? "bg-cyan-600 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Extensions
          </button>
          <button
            onClick={() => setActiveTab("match")}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "match"
                ? "bg-cyan-600 text-white"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Match Rules
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-1 text-xs flex flex-col gap-3 leading-relaxed">
          {activeTab === "overview" && (
            <div className="flex flex-col gap-3">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-amber-400 uppercase text-[11px] mb-1">
                  1. Draw Phase
                </h3>
                <p>
                  Start your turn by tapping either the{" "}
                  <strong>Draw Pile</strong> (face-down) or the{" "}
                  <strong>Discard Pile</strong> (top face-up card).
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-cyan-400 uppercase text-[11px] mb-1">
                  2. Word Play Phase
                </h3>
                <p>
                  Form a new valid English word on the board or extend an
                  existing word using hand cards. You can also skip this step by
                  tapping <strong>Skip Word Play</strong>.
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-pink-400 uppercase text-[11px] mb-1">
                  3. Discard Phase
                </h3>
                <p>
                  Complete your turn by selecting 1 card from your hand to place
                  onto the Discard Pile.
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-emerald-400 uppercase text-[11px] mb-1">
                  4. Hand Replenish
                </h3>
                <p>
                  If you played cards onto the board, you automatically draw
                  back up to keep your hand filled for the next turn.
                </p>
              </div>
            </div>
          )}

          {activeTab === "scoring" && (
            <div className="flex flex-col gap-3">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-amber-400 uppercase text-[11px] mb-2">
                  Word Length Points
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex justify-between bg-neutral-900 p-2 rounded border border-neutral-800">
                    <span>3 Letters</span>
                    <span className="font-bold text-cyan-400">+10 pts</span>
                  </div>
                  <div className="flex justify-between bg-neutral-900 p-2 rounded border border-neutral-800">
                    <span>4 Letters</span>
                    <span className="font-bold text-cyan-400">+20 pts</span>
                  </div>
                  <div className="flex justify-between bg-neutral-900 p-2 rounded border border-neutral-800">
                    <span>5 Letters</span>
                    <span className="font-bold text-cyan-400">+35 pts</span>
                  </div>
                  <div className="flex justify-between bg-neutral-900 p-2 rounded border border-neutral-800">
                    <span>6+ Letters</span>
                    <span className="font-bold text-cyan-400">+50+ pts</span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-rose-400 uppercase text-[11px] mb-2">
                  Round End Hand Penalties
                </h3>
                <p className="mb-2 text-neutral-400">
                  At round end, remaining hand cards deduct points based on
                  letter rarity:
                </p>
                <ul className="list-disc list-inside space-y-1 text-neutral-300">
                  <li>
                    <strong className="text-white">
                      Common (A, E, I, O, U, T, N, S):
                    </strong>{" "}
                    -5 pts each
                  </li>
                  <li>
                    <strong className="text-white">
                      Medium (B, C, D, F, G, H, L, M, P, R):
                    </strong>{" "}
                    -10 pts each
                  </li>
                  <li>
                    <strong className="text-white">
                      Rare (J, K, Q, V, W, X, Y, Z):
                    </strong>{" "}
                    -20 pts each
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "extensions" && (
            <div className="flex flex-col gap-3">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-cyan-400 uppercase text-[11px] mb-1">
                  Building on Existing Words
                </h3>
                <p>
                  Select any word on the board to modify or extend it with your
                  hand cards. You can add prefix letters, suffix letters, or
                  insert cards to transform the word into a valid new word!
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-amber-400 uppercase text-[11px] mb-1">
                  Extension Point Delta
                </h3>
                <p>
                  When you extend a word, you earn points equal to the{" "}
                  <strong>difference in score</strong> between the new expanded
                  word and the previous word score.
                </p>
              </div>
            </div>
          )}

          {activeTab === "match" && (
            <div className="flex flex-col gap-3">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-amber-400 uppercase text-[11px] mb-1">
                  First to 1,000 Points
                </h3>
                <p>
                  Matches consist of multiple rounds. Net points earned each
                  round are added to your cumulative match total. The first
                  player to reach <strong>1,000 match points</strong> wins the
                  overall match!
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-pink-400 uppercase text-[11px] mb-1">
                  Round End Conditions
                </h3>
                <ul className="list-disc list-inside space-y-1 text-neutral-300">
                  <li>
                    <strong>Going Out:</strong> A player plays or discards their
                    final hand card.
                  </li>
                  <li>
                    <strong>Stalemate:</strong> Draw and discard piles are
                    depleted, or 4 consecutive passes occur with no playable
                    moves.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Close Action */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
};
