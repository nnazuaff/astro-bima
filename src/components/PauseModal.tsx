import React from 'react';
import { Play, RotateCcw, Map, Volume2, VolumeX, Music, Pause } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onWorldMap: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onWorldMap,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic
}) => {
  return (
    <div id="pause-modal" className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 select-none font-['Outfit',sans-serif]">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 max-w-xs sm:max-w-sm w-full shadow-2xl flex flex-col items-center text-center">
        {/* Crisp Arcade Pause Symbol */}
        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 mb-3">
          <Pause className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-black text-white uppercase tracking-wider font-['Orbitron'] mb-1">
          MISI DIJEDA
        </h2>
        <p className="text-xs text-slate-400 mb-5 font-mono">
          STATUS // MENUNGGU INPUT ASTRONAUT
        </p>

        {/* Tactile Action Buttons */}
        <div className="flex flex-col gap-2.5 w-full mb-5">
          <button
            id="pause-resume-button"
            onClick={onResume}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 text-slate-950 font-bold text-sm tracking-wide transition-all cursor-pointer font-['Orbitron']"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Lanjutkan Misi</span>
          </button>

          <button
            id="pause-restart-button"
            onClick={onRestart}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 text-slate-200 font-semibold text-xs tracking-wide transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ulangi Sektor</span>
          </button>

          <button
            id="pause-map-button"
            onClick={onWorldMap}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border-b-4 border-slate-950 active:border-b-0 active:translate-y-1 text-slate-200 font-semibold text-xs tracking-wide transition-all cursor-pointer"
          >
            <Map className="w-4 h-4 text-emerald-400" />
            <span>Peta Sektor Galaksi</span>
          </button>
        </div>

        {/* Audio Console Switches */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-800 w-full justify-center text-xs">
          <button
            onClick={onToggleSound}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-slate-950 border-slate-800 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-rose-400" />}
            <span>SFX</span>
          </button>

          <button
            onClick={onToggleMusic}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              musicEnabled
                ? 'bg-slate-950 border-slate-800 text-emerald-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>BGM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
