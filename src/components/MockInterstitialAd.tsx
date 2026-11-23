import React, { useEffect, useState } from "react";

interface MockInterstitialAdProps {
  isOpen: boolean;
  onClose: () => void;
  testUrl?: string;
}

export const MockInterstitialAd: React.FC<MockInterstitialAdProps> = ({
  isOpen,
  onClose,
  testUrl = "https://example.com",
}) => {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(5);
      return;
    }

    if (secondsLeft <= 0) return;

    const timer = setTimeout(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [isOpen, secondsLeft]);

  if (!isOpen) return null;

  const canClose = secondsLeft <= 0;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 flex flex-col justify-between p-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] text-white">
      {/* Top Bar: Test Label + Countdown / Close Button */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
          Test Ad Placeholder
        </span>

        <button
          type="button"
          disabled={!canClose}
          onClick={onClose}
          className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition ${
            canClose
              ? "bg-white text-slate-950 hover:bg-slate-200 cursor-pointer"
              : "bg-slate-800 text-slate-400 cursor-not-allowed"
          }`}
        >
          {canClose ? "✕ Close Ad" : `Skip in ${secondsLeft}s`}
        </button>
      </div>

      {/* Center Mock Ad Creative */}
      <div className="max-w-sm mx-auto w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center shadow-2xl">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-3xl shadow-lg">
          📣
        </div>
        <h3 className="text-xl font-black mb-2">Sample Sponsor Ad</h3>
        <p className="text-sm text-slate-300 mb-5">
          This simulates a full-screen interstitial ad between games on iOS
          TestFlight.
        </p>
        <a
          href={testUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm uppercase tracking-wide transition"
        >
          Visit Test Ad Site
        </a>
      </div>

      {/* Bottom Disclaimer */}
      <p className="text-center text-xs text-slate-500">
        TestFlight UI & Safe-Area Verification Build
      </p>
    </div>
  );
};
