import React, { useState } from "react";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "wilds" | "scoring" | "extensions" | "match"
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
        <div className="grid grid-cols-5 gap-1 bg-neutral-950 p-1 rounded-xl border border-neutral-800 text-[10px] font-extrabold text-center">
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
            onClick={() => setActiveTab("wilds")}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "wilds"
                ? "bg-amber-500 text-slate-950 font-black"
                : "text-amber-400/80 hover:text-amber-300"
            }`}
          >
            ★ Wilds
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
                  Start your turn by drawing 1 card from either the face-down{" "}
                  <strong>Draw Pile</strong> or the top of the{" "}
                  <strong>Discard Pile</strong>.
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-cyan-400 uppercase text-[11px] mb-1">
                  2. Word Play Phase
                </h3>
                <p>
                  Form a new word (3+ letters) or extend an existing word on the
                  board using cards from your hand. You can also skip word play
                  if you have no valid moves.
                </p>
              </div>

              {/* 🦹‍♂️ WORD STEALING RULE HIGHLIGHT */}
              <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-800/60">
                <h3 className="font-extrabold text-amber-300 uppercase text-[11px] mb-1 flex items-center gap-1">
                  ⚡ Special Action: Word Stealing
                </h3>
                <p className="text-amber-100 text-xs leading-relaxed">
                  Steal an opponent’s word by adding{" "}
                  <strong>2 or more cards</strong> from your hand to form a new
                  valid word. Full ownership and point value transfer to you!
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
            </div>
          )}

          {activeTab === "wilds" && (
            <div className="flex flex-col gap-3">
              <div className="bg-amber-950/30 p-3 rounded-xl border border-amber-500/30">
                <h3 className="font-extrabold text-amber-400 uppercase text-[11px] mb-1 flex items-center gap-1">
                  ★ Playing a Wild Card
                </h3>
                <p className="text-neutral-200">
                  When staging a Wild Card, a picker allows you to assign it any
                  letter from <strong>A to Z</strong>.
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-cyan-400 uppercase text-[11px] mb-1 flex items-center gap-1">
                  ↺ Wild Card Swapping
                </h3>
                <p className="text-neutral-300 mb-2">
                  If a Wild Card on the board is acting as a letter (e.g.{" "}
                  <strong>"E"</strong>), any player holding a physical card of
                  that exact letter can swap it during their turn!
                </p>
                <p className="text-neutral-400 text-[11px]">
                  Your natural card replaces the Wild Card on the board, and the
                  Wild Card returns to your hand unassigned!
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-rose-400 uppercase text-[11px] mb-1">
                  Wild Card Scoring & Penalties
                </h3>
                <p className="text-neutral-300">
                  Wild Cards add <strong>0 base points</strong> to played words,
                  and carry a heavy <strong>-30 point penalty</strong> if left
                  in your hand at round end.
                </p>
              </div>
            </div>
          )}

          {activeTab === "scoring" && (
            <div className="flex flex-col gap-3">
              {/* Option A Base Letter Scoring */}
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-amber-400 uppercase text-[11px] mb-1">
                  1. Base Letter Values
                </h3>
                <p className="text-neutral-400 text-[11px] mb-2">
                  Each card displays its point value in the bottom-right corner:
                </p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800 flex justify-between">
                    <span className="text-neutral-300">
                      A, E, I, O, U, L, N, S, T, R
                    </span>
                    <span className="font-bold text-amber-300">1 pt</span>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800 flex justify-between">
                    <span className="text-neutral-300">D, G</span>
                    <span className="font-bold text-amber-300">2 pts</span>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800 flex justify-between">
                    <span className="text-neutral-300">B, C, M, P</span>
                    <span className="font-bold text-amber-300">3 pts</span>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800 flex justify-between">
                    <span className="text-neutral-300">F, H, V, W, Y</span>
                    <span className="font-bold text-amber-300">4 pts</span>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800 flex justify-between">
                    <span className="text-neutral-300">K</span>
                    <span className="font-bold text-amber-300">5 pts</span>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800 flex justify-between">
                    <span className="text-neutral-300">J, X</span>
                    <span className="font-bold text-amber-300">8 pts</span>
                  </div>
                  <div className="bg-neutral-900 p-1.5 rounded border border-neutral-800 flex justify-between col-span-2">
                    <span className="text-neutral-300">Q, Z</span>
                    <span className="font-bold text-amber-300">10 pts</span>
                  </div>
                </div>
              </div>

              {/* Option A Tier-Based Length Bonus */}
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-cyan-400 uppercase text-[11px] mb-1">
                  2. Word Length Bonuses
                </h3>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="flex justify-between bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span>3 Letters</span>
                    <span className="font-bold text-cyan-400">+2 pts</span>
                  </div>
                  <div className="flex justify-between bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span>4 Letters</span>
                    <span className="font-bold text-cyan-400">+5 pts</span>
                  </div>
                  <div className="flex justify-between bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span>5 Letters</span>
                    <span className="font-bold text-cyan-400">+10 pts</span>
                  </div>
                  <div className="flex justify-between bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span>6 Letters</span>
                    <span className="font-bold text-cyan-400">+16 pts</span>
                  </div>
                  <div className="flex justify-between bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span>7 Letters</span>
                    <span className="font-bold text-cyan-400">+25 pts</span>
                  </div>
                  <div className="flex justify-between bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span>8+ Letters</span>
                    <span className="font-bold text-cyan-400">+10 / extra</span>
                  </div>
                </div>
              </div>

              {/* Updated Hand Penalties & Last-Card Tax */}
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-rose-400 uppercase text-[11px] mb-1">
                  3. Round End Hand Penalties
                </h3>
                <p className="mb-2 text-neutral-400 text-[11px]">
                  At round end, unplayed hand cards deduct points based on
                  letter rarity:
                </p>
                <ul className="list-disc list-inside space-y-1 text-neutral-300 text-[11px]">
                  <li>
                    <strong className="text-white">Standard:</strong> -5 pts
                    each
                  </li>
                  <li>
                    <strong className="text-white">Medium:</strong> -10 pts each
                  </li>
                  <li>
                    <strong className="text-white">High Value:</strong> -20 pts
                    each
                  </li>
                  <li>
                    <strong className="text-white">Wild Card:</strong> -30 pts
                  </li>
                </ul>
                <div className="mt-2 bg-rose-950/40 p-2 rounded border border-rose-800/60 text-[11px] text-rose-200">
                  <strong>🚨 Last-Card Tax:</strong> Players ending the round
                  with 1 or 2 remaining cards incur an extra{" "}
                  <strong>-2 point penalty</strong>!
                </div>
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
                  hand cards. You can add prefixes, suffixes, or rearrange
                  letters to transform it into a valid new word!
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-amber-400 uppercase text-[11px] mb-1">
                  Extension Scoring
                </h3>
                <p>
                  When extending or modifying a word, you earn points equal to
                  the <strong>difference in score</strong> between the new
                  expanded word total and the previous word value.
                </p>
              </div>
            </div>
          )}

          {activeTab === "match" && (
            <div className="flex flex-col gap-3">
              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-amber-400 uppercase text-[11px] mb-1">
                  First to 500 Points
                </h3>
                <p>
                  Matches span multiple rounds. Net points earned each round are
                  added to your cumulative total. The first player to reach{" "}
                  <strong>1,000 match points</strong> wins!
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-pink-400 uppercase text-[11px] mb-1">
                  Round End Conditions
                </h3>
                <ul className="list-disc list-inside space-y-1 text-neutral-300">
                  <li>
                    <strong>Going Out:</strong> A player plays down to 0
                    remaining hand cards.
                  </li>
                  <li>
                    <strong>Stalemate:</strong> Triggers after{" "}
                    <strong>8 consecutive passes total</strong> (4 turns each)
                    when players are stuck.
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
