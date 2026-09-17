import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { RotateCcw, Map, Sparkles } from 'lucide-react';

interface VictoryModalProps {
  totalScore: number;
  onPlayAgain: () => void;
  onWorldMap: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  totalScore,
  onPlayAgain,
  onWorldMap
}) => {
  useEffect(() => {
    // Grand celebration confetti
    const duration = 2500;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 50,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 50,
        origin: { x: 1 }
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  return (
    <div id="victory-story-modal" className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 select-none font-['Outfit',sans-serif]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-2xl flex flex-col items-center text-center">
        {/* Core Crystal Emblem */}
        <div className="w-14 h-14 rounded-2xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center mb-3.5 text-amber-400">
          <Sparkles className="w-7 h-7" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5 font-['Orbitron'] tracking-wide">
          GALAKSI DISELAMATKAN!
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-5 max-w-sm">
          Bima berhasil melintasi 4 sektor galaksi, mengalahkan <span className="text-purple-400 font-bold">Zorgax</span>, dan mengembalikan pecahan Kristal Inti ke pusat Nébula Prisma.
        </p>

        {/* Total Score Readout */}
        <div className="w-full pb-4 mb-5 border-y border-slate-800 py-3.5 flex items-baseline justify-between px-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">
            Total Skor Kosmik
          </span>
          <span className="text-2xl sm:text-3xl font-black text-amber-300 font-['Orbitron']">
            {totalScore.toLocaleString()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            id="victory-again-button"
            onClick={onPlayAgain}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 border-b-4 border-amber-700 active:border-b-0 active:translate-y-1 text-slate-950 font-extrabold text-sm tracking-wide transition-all cursor-pointer font-['Orbitron']"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Mulai Petualangan Baru</span>
          </button>

          <button
            id="victory-map-button"
            onClick={onWorldMap}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 text-slate-200 font-semibold text-xs tracking-wide transition-all cursor-pointer"
          >
            <Map className="w-4 h-4 text-emerald-400" />
            <span>Peta Sektor Galaksi</span>
          </button>
        </div>
      </div>
    </div>
  );
};
