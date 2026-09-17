import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, ArrowRight, RotateCcw, Map, Award } from 'lucide-react';

interface LevelClearModalProps {
  levelName: string;
  worldName: string;
  score: number;
  stardust: number;
  timeLeft: number;
  hasNextLevel: boolean;
  onNextLevel: () => void;
  onReplay: () => void;
  onWorldMap: () => void;
}

export const LevelClearModal: React.FC<LevelClearModalProps> = ({
  levelName,
  worldName,
  score,
  stardust,
  timeLeft,
  hasNextLevel,
  onNextLevel,
  onReplay,
  onWorldMap
}) => {
  useEffect(() => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
  }, []);

  const totalBonus = Math.floor(timeLeft * 10) + stardust * 20;
  const finalScore = score + totalBonus;
  const stars = finalScore > 3500 ? 3 : finalScore > 1800 ? 2 : 1;

  return (
    <div id="level-clear-modal" className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 select-none font-['Outfit',sans-serif]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 max-w-xs sm:max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
        {/* Victory Crest */}
        <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center mb-3 text-emerald-400">
          <Award className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-black text-white font-['Orbitron'] tracking-wider uppercase mb-0.5">
          SEKTOR BERSIH
        </h2>
        <p className="text-xs text-slate-400 mb-4 font-mono">
          {worldName} • {levelName}
        </p>

        {/* Stars Unit */}
        <div className="flex items-center justify-center gap-2.5 mb-5">
          {[1, 2, 3].map(starNum => (
            <Star
              key={starNum}
              className={`w-7 h-7 transition-all ${
                starNum <= stars
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Tabular Score Breakdown (Flattened Hierarchy) */}
        <div className="w-full pb-4 mb-5 border-y border-slate-800/80 py-3 space-y-2 text-xs">
          <div className="flex justify-between items-center text-slate-400">
            <span>Skor Lapangan</span>
            <span className="font-bold text-white font-['Orbitron']">{score.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Bonus Waktu ({Math.floor(timeLeft)}s)</span>
            <span className="font-bold text-emerald-400 font-['Orbitron']">+{Math.floor(timeLeft * 10)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Bonus Stardust (x{stardust})</span>
            <span className="font-bold text-amber-400 font-['Orbitron']">+{stardust * 20}</span>
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-200">Total Skor</span>
            <span className="text-emerald-400 font-['Orbitron'] text-base">{finalScore.toLocaleString()}</span>
          </div>
        </div>

        {/* Tactile Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          {hasNextLevel ? (
            <button
              id="clear-next-button"
              onClick={onNextLevel}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 text-slate-950 font-bold text-sm tracking-wide transition-all cursor-pointer font-['Orbitron']"
            >
              <span>Sektor Berikutnya</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              id="clear-map-finish-button"
              onClick={onWorldMap}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 text-slate-950 font-bold text-sm tracking-wide transition-all cursor-pointer font-['Orbitron']"
            >
              <span>Kembali ke Peta Sektor</span>
              <Map className="w-4 h-4" />
            </button>
          )}

          <div className="flex gap-2 w-full">
            <button
              id="clear-replay-button"
              onClick={onReplay}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 text-slate-200 font-semibold text-xs tracking-wide transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Main Lagi</span>
            </button>

            <button
              id="clear-map-button"
              onClick={onWorldMap}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 text-slate-200 font-semibold text-xs tracking-wide transition-all cursor-pointer"
            >
              <Map className="w-3.5 h-3.5 text-emerald-400" />
              <span>Peta Sektor</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
