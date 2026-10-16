import type { GameState } from "../types/game";

interface RoundEndModalProps {
  gameState: GameState;
  onNextRound: () => void;
  onNewMatch: () => void;
}

export const RoundEndModal: React.FC<RoundEndModalProps> = ({
  gameState,
  onNextRound,
  onNewMatch,
}) => {
  if (!gameState.isRoundOver && !gameState.isGameOver) return null;

  const {
    roundNumber,
    roundScores,
    matchScores,
    lastRoundPenalties,
    roundEndReason,
    isGameOver,
    winner,
  } = gameState;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 text-center relative">
        {/* Banner Title */}
        <div>
          <span className="text-xs font-black uppercase text-cyan-400 tracking-widest">
            {isGameOver ? "MATCH COMPLETE" : `ROUND ${roundNumber} COMPLETE`}
          </span>
          <h2 className="text-2xl font-black text-white mt-1">
            {isGameOver
              ? winner === "human"
                ? "🎉 VICTORY! YOU WIN!"
                : winner === "computer"
                  ? `${gameState.botName.toUpperCase()} WINS!`
                  : "IT'S A MATCH TIE!"
              : roundEndReason === "went_out"
                ? "PLAYER WENT OUT!"
                : "STALEMATE DRAW"}
          </h2>
        </div>

        {/* Round Breakdown */}
        <div className="bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800/80 flex flex-col gap-3">
          <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
            Round {roundNumber} Score Summary
          </span>

          <div className="grid grid-cols-2 gap-3 text-left">
            {/* Human Column */}
            <div className="bg-neutral-900/80 p-3 rounded-xl border border-cyan-500/30">
              <span className="text-xs text-cyan-400 font-bold block">YOU</span>
              <div className="text-sm font-semibold text-neutral-300 mt-1">
                Words: +{roundScores.human}
              </div>
              <div className="text-xs text-rose-400 font-semibold">
                Penalties: -{lastRoundPenalties?.human || 0}
              </div>
              <div className="text-base font-extrabold text-white mt-1 border-t border-neutral-800 pt-1">
                Net: {roundScores.human - (lastRoundPenalties?.human || 0)} pts
              </div>
            </div>

            {/* NeonBot Column */}
            <div className="bg-neutral-900/80 p-3 rounded-xl border border-pink-500/30">
              <span className="text-xs text-pink-400 font-bold block">
                {gameState.botName.toUpperCase()}
              </span>
              <div className="text-sm font-semibold text-neutral-300 mt-1">
                Words: +{roundScores.computer}
              </div>
              <div className="text-xs text-rose-400 font-semibold">
                Penalties: -{lastRoundPenalties?.computer || 0}
              </div>
              <div className="text-base font-extrabold text-white mt-1 border-t border-neutral-800 pt-1">
                Net:{" "}
                {roundScores.computer - (lastRoundPenalties?.computer || 0)} pts
              </div>
            </div>
          </div>
        </div>

        {/* Cumulative Match Score Standings */}
        <div className="bg-neutral-950/90 p-4 rounded-2xl border border-amber-500/30 flex justify-between items-center">
          <div>
            <span className="text-[10px] text-neutral-400 uppercase font-extrabold block">
              TOTAL MATCH SCORE
            </span>
            <span className="text-[10px] text-amber-400 font-semibold">
              First to 500 Points
            </span>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <span className="text-[10px] text-cyan-400 font-bold block">
                YOU
              </span>
              <span className="text-xl font-black text-cyan-300">
                {matchScores.human}
              </span>
            </div>
            <span className="text-neutral-600 font-black text-lg">:</span>
            <div className="text-left">
              <span className="text-[10px] text-pink-400 font-bold block">
                {gameState.botName.toUpperCase()}
              </span>
              <span className="text-xl font-black text-pink-300">
                {matchScores.computer}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {isGameOver ? (
          <button
            onClick={onNewMatch}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer"
          >
            Start New 500-Pt Match
          </button>
        ) : (
          <button
            onClick={onNextRound}
            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer"
          >
            Start Round {roundNumber + 1}
          </button>
        )}
      </div>
    </div>
  );
};
