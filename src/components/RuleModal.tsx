import React, { useState } from "react";

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    "overview" | "stealing" | "wilds" | "scoring" | "match"
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
            onClick={() => setActiveTab("stealing")}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "stealing"
                ? "bg-amber-500 text-slate-950 font-black"
                : "text-amber-400/80 hover:text-amber-300"
            }`}
          >
            ⚡ Stealing
          </button>
          <button
            onClick={() => setActiveTab("wilds")}
            className={`py-1.5 rounded-lg transition-all cursor-pointer ${
              activeTab === "wilds"
                ? "bg-cyan-600 text-white"
                : "text-neutral-400 hover:text-neutral-200"
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
                  1. Unified Deck & Hand Size
                </h3>
                <p>
                  Games use a single <strong>100-card deck</strong> with no
                  discard pile. Each player maintains a hand of{" "}
                  <strong>8 cards</strong>, which automatically replenishes back
                  to 8 at the end of every turn until the deck runs out.
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-pink-400 uppercase text-[11px] mb-1">
                  2. Turn Actions
                </h3>
                <p>
                  On the very 1st turn whether it's Monica or you, there is a
                  choice of three actions:
                </p>
                <ul className="list-disc list-inside space-y-1 text-neutral-300 mt-1">
                  <li>
                    <strong>Submit Word:</strong> Players may only play 1 word
                    from their hand. All words must be two or more letters.
                  </li>
                  <li>
                    <strong>Trade Letters:</strong> Swap hand cards back into
                    the deck for fresh ones (ends turn).
                  </li>
                  <li>
                    <strong>Pass Turn:</strong> Skip your turn if you have no
                    moves.
                  </li>
                  <h3 className="font-extrabold text-pink-400 uppercase text-[11px] mb-1">
                    On subsequent turns, 1 submitted word is allowed but the
                    option of word steals is open.
                  </h3>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "stealing" && (
            <div className="flex flex-col gap-3">
              <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-800/60">
                <h3 className="font-extrabold text-amber-300 uppercase text-[11px] mb-1 flex items-center gap-1">
                  ⚡ Word Stealing Mechanics
                </h3>
                <p className="text-amber-100 text-xs leading-relaxed">
                  Starting on Turn 2, anytime you add{" "}
                  <strong>1 or more cards</strong> from your hand to an
                  opponent’s word to make a valid new word, it counts as a{" "}
                  <strong>Steal</strong>!
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-cyan-400 uppercase text-[11px] mb-1">
                  Double Points Awarded
                </h3>
                <p className="text-neutral-300 leading-relaxed">
                  Executing a steal transfers full ownership of the word to you
                  and awards <strong>Double Points (2x)</strong> for the new
                  word value! Your opponent loses the original points earned
                  from that word.
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
                  ↺ How to Swap a Wild Card
                </h3>
                <p className="text-neutral-300 mb-2">
                  If a Wild Card on the board is acting as a letter (e.g.{" "}
                  <strong>"E"</strong>) and you hold that exact natural letter
                  card in your hand:
                </p>

                <ol className="list-decimal list-inside text-neutral-300 text-xs flex flex-col gap-1 my-2 bg-neutral-900/80 p-2.5 rounded-lg border border-neutral-800">
                  <li>
                    Tap the board word to open the{" "}
                    <strong>Word Inspector</strong>.
                  </li>
                  <li>
                    Tap the amber <strong>"Swap Wild Card"</strong> button.
                  </li>
                  <li>
                    Your letter replaces the Wild on the board, and the Wild
                    Card returns to your hand!
                  </li>
                </ol>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-rose-400 uppercase text-[11px] mb-1">
                  Wild Card Penalties
                </h3>
                <p className="text-neutral-300">
                  Wild Cards add <strong>0 base points</strong> to played words
                  and carry a heavy <strong>-30 point penalty</strong> if left
                  in your hand at round end.
                </p>
              </div>
            </div>
          )}

          {activeTab === "scoring" && (
            <div className="flex flex-col gap-3">
              <div className="bg-cyan-950/40 p-3 rounded-xl border border-cyan-800/60">
                <h3 className="font-extrabold text-cyan-300 uppercase text-[11px] mb-1">
                  How Words Are Scored
                </h3>
                <p className="text-cyan-100 text-xs leading-relaxed">
                  Words are scored by adding individual base letter values plus
                  any word length bonus. Words can be{" "}
                  <strong>2 or more letters</strong>.
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-amber-400 uppercase text-[11px] mb-1">
                  1. Base Letter Values
                </h3>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] mt-2">
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

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-cyan-400 uppercase text-[11px] mb-1">
                  2. Word Length Bonuses
                </h3>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="flex justify-between bg-neutral-900 p-1.5 rounded border border-neutral-800">
                    <span>2 Letters</span>
                    <span className="font-bold text-cyan-400">+0 pts</span>
                  </div>
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
                    <span>7+ Letters</span>
                    <span className="font-bold text-cyan-400">+25+ pts</span>
                  </div>
                </div>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-rose-400 uppercase text-[11px] mb-1">
                  3. Round End Hand Penalties
                </h3>
                <p className="text-neutral-300 text-[11px] leading-relaxed">
                  A player who goes out incurs <strong>0 penalty points</strong>
                  . The opponent has the base point values of all remaining hand
                  cards deducted from their total (plus <strong>-30 pts</strong>{" "}
                  per wild card). On stalemates, both players receive hand
                  deductions.
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
                  <strong>500 match points</strong> wins!
                </p>
              </div>

              <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                <h3 className="font-extrabold text-pink-400 uppercase text-[11px] mb-1">
                  Round End Conditions
                </h3>
                <ul className="list-disc list-inside space-y-1 text-neutral-300">
                  <li>
                    <strong>Going Out:</strong> A player plays down to 0
                    remaining hand cards when the deck is empty.
                  </li>
                  <li>
                    <strong>Stalemate:</strong> Triggers after{" "}
                    <strong>8 consecutive passes total</strong> (or 4 passes
                    when the deck is empty).
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
