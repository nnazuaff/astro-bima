import React from 'react';
import { RotateCcw, Map, AlertTriangle } from 'lucide-react';

interface GameOverModalProps {
  score: number;
  onRetry: () => void;
  onWorldMap: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  score,
  onRetry,
  onWorldMap
}) => {
  return (
    <div id="game-over-modal" className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 select-none font-['Outfit',sans-serif]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 max-w-xs sm:max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
        {/* Warning Icon Container */}
        <div className="w-12 h-12 rounded-xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center mb-3 text-rose-400">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-black text-rose-400 uppercase tracking-wider font-['Orbitron'] mb-1">
          SINYAL TERPUTUS
        </h2>
        <p className="text-xs text-slate-400 mb-5 font-mono">
          BIMA KEHABISAN ENERGI SETELAH MISI
        </p>

        {/* Clean Score Readout (Flattened Depth) */}
        <div className="w-full pb-4 mb-5 border-b border-slate-800 flex items-baseline justify-between px-1">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-medium">Skor Akhir</span>
          <span className="text-2xl font-black text-white font-['Orbitron']">
            {score.toLocaleString()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            id="gameover-retry-button"
            onClick={onRetry}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 text-white font-bold text-sm tracking-wide transition-all cursor-pointer font-['Orbitron']"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Coba Lagi (3 Nyawa)</span>
          </button>

          <button
            id="gameover-map-button"
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
