import React, { useState } from 'react';
import { Play, Map, HelpCircle, Volume2, VolumeX, Music, Sparkles, X, Compass, Shield, Zap, Crosshair, Github, ExternalLink } from 'lucide-react';
import { UserProgress } from '../types';

interface MainMenuProps {
  progress: UserProgress;
  onStartGame: () => void;
  onOpenMap: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  progress,
  onStartGame,
  onOpenMap,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic
}) => {
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  return (
    <div id="main-menu-screen" className="relative w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-4 sm:p-6 select-none overflow-y-auto font-['Outfit',sans-serif]">
      {/* Subtle Deep Space Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,_rgba(16,185,129,0.08),_transparent_50%)] pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(56,189,248,0.06),_transparent_40%)] pointer-events-none -z-10" />

      {/* Top Console Bar */}
      <div className="flex items-center justify-between w-full max-w-4xl z-10 pt-1 sm:pt-2">
        {/* Crystal Shards Collection Status */}
        <div className="flex items-center gap-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-slate-400">Pecahan Kristal:</span>
          <span className="font-bold text-amber-300 font-['Orbitron']">
            {progress.crystalsCollected}/4
          </span>
        </div>

        {/* Audio Console Switches */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-sm">
          <button
            id="menu-toggle-sound"
            onClick={onToggleSound}
            className={`p-2 rounded-lg transition-colors ${
              soundEnabled ? 'text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title="Efek Suara (SFX)"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
          <button
            id="menu-toggle-music"
            onClick={onToggleMusic}
            className={`p-2 rounded-lg transition-colors ${
              musicEnabled ? 'text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title="Musik Latar"
          >
            <Music className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hero Title & Emblem Unit */}
      <div className="flex flex-col items-center text-center my-auto py-6 sm:py-8 z-10 max-w-md w-full">
        {/* Crisp Arcade Character Crest */}
        <div className="relative mb-5 flex flex-col items-center">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-slate-900 border-2 border-slate-700/80 p-2 shadow-xl flex flex-col items-center justify-center relative">
            <span className="text-5xl sm:text-6xl select-none">🦝</span>
            <div className="absolute -bottom-2.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 tracking-wider font-['Orbitron'] uppercase">
              BIMA
            </div>
          </div>
        </div>

        {/* Crisp Game Title */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-2 font-['Orbitron']">
          ASTRO BIMA
        </h1>
        <p className="text-sm sm:text-base text-slate-300 font-normal mb-8 max-w-xs sm:max-w-sm">
          Lompatan Menuju Galaksi Kristal Nébula Prisma
        </p>

        {/* Tactile Arcade Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs mb-5">
          <button
            id="menu-play-button"
            onClick={onStartGame}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 border-b-4 border-emerald-700 active:border-b-0 active:translate-y-1 text-slate-950 font-extrabold text-base tracking-wide transition-all cursor-pointer shadow-md font-['Orbitron'] uppercase"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Mulai Misi</span>
          </button>

          <button
            id="menu-map-button"
            onClick={onOpenMap}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 border-b-4 border-b-slate-950 active:border-b active:translate-y-1 text-slate-100 font-bold text-sm tracking-wide transition-all cursor-pointer shadow-md"
          >
            <Map className="w-4 h-4 text-emerald-400" />
            <span>Peta Sektor Galaksi</span>
          </button>
        </div>

        <button
          id="menu-howto-button"
          onClick={() => setShowHowToPlay(true)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 py-1.5 px-3 rounded-lg hover:bg-slate-900 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
          <span>Panduan Kontrol & Mekanika</span>
        </button>

        {/* Developer Attribution Unit */}
        <div id="developer-credits" className="mt-5 flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs shadow-sm backdrop-blur-xs">
          <span className="text-slate-400">Developer:</span>
          <span className="font-semibold text-slate-200">Fauzan Zhahir A</span>
          <span className="text-slate-700">|</span>
          <a
            id="developer-github-link"
            href="https://github.com/nnazuaff"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition-colors hover:underline"
            title="Kunjungi profil GitHub Fauzan Zhahir A"
          >
            <Github className="w-3.5 h-3.5" />
            <span>github.com/nnazuaff</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>

      {/* Footer Baseline */}
      <div className="text-center text-xs text-slate-500 z-10 pb-2 font-mono">
        4 SEKTOR KOSMIK • 20 LEVEL • PERTEMPURAN BOSS • MULTI-POWERUP
      </div>

      {/* Mission Briefing Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 select-none">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-7 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[85vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white font-['Orbitron'] tracking-wide uppercase">
                  PANDUAN OPERASI
                </h2>
              </div>
              <button
                onClick={() => setShowHowToPlay(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-sm text-slate-300 mb-6">
              {/* Controls */}
              <div>
                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Kontrol Keyboard & Layar Sentuh</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400">Gerak</span>
                    <div className="flex gap-1 font-mono">
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">A</kbd>
                      <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200">D</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400">Lompat</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded text-slate-200 font-mono">Spasi</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400">Tembak (Glove)</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded text-slate-200 font-mono">X</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-400">Jeda (Pause)</span>
                    <kbd className="px-2 py-0.5 bg-slate-800 rounded text-slate-200 font-mono">Esc</kbd>
                  </div>
                </div>
              </div>

              {/* Powerups */}
              <div className="pt-3 border-t border-slate-800">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Sistem Power-Up</span>
                </h3>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-emerald-400 shrink-0">Serum Giga:</span>
                    <span>Tubuh Bima membesar, mampu memecahkan blok kristal dari bawah, dan memberi pertahanan 1 pukulan tambahan.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-sky-400 shrink-0">Jetpack:</span>
                    <span>Lompatan ganda (double-jump) dan meluncur di udara saat tombol lompat ditahan.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-semibold text-purple-400 shrink-0">Sarung Tangan Energi:</span>
                    <span>Menembakkan proyektil energi untuk mengeliminasi musuh dan drone Zorgax.</span>
                  </li>
                </ul>
              </div>

              {/* Checkpoints & Stars */}
              <div className="pt-3 border-t border-slate-800">
                <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Checkpoint & Ekstra Nyawa</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sentuh tiang suar untuk mengaktifkan Checkpoint. Mengumpulkan 100 Stardust memberikan +1 Nyawa Ekstra secara instan.
                </p>
              </div>

              {/* Developer Credit in Guide */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Developer: <strong className="text-slate-200">Fauzan Zhahir A</strong></span>
                <a
                  href="https://github.com/nnazuaff"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>@nnazuaff</span>
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm transition-colors cursor-pointer"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
