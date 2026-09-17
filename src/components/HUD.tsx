import React from 'react';
import { Volume2, VolumeX, Music, Pause, Sparkles, Heart, Zap, Shield, Clock } from 'lucide-react';
import { PlayerState, PowerUpType } from '../types';

interface HUDProps {
  player: PlayerState;
  timeLeft: number;
  levelName: string;
  worldName: string;
  themeColor: string;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onPause: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  player,
  timeLeft,
  levelName,
  worldName,
  themeColor,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic,
  onPause
}) => {
  const getPowerUpLabel = (type: PowerUpType) => {
    switch (type) {
      case 'serum_giga':
        return { name: 'GIGA', color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50', icon: '🧪' };
      case 'jetpack':
        return { name: 'JETPACK', color: 'bg-sky-950/80 text-sky-300 border-sky-500/50', icon: '🚀' };
      case 'energy_glove':
        return { name: 'BLASTER', color: 'bg-purple-950/80 text-purple-300 border-purple-500/50', icon: '⚡' };
      default:
        return null;
    }
  };

  const powerUpInfo = getPowerUpLabel(player.powerUp);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = Math.floor(timeLeft % 60);
  const timeFormatted = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  const isTimeLow = timeLeft < 30;

  return (
    <div id="game-hud" className="absolute inset-x-0 top-0 p-2 sm:p-3 pointer-events-none flex flex-col select-none overflow-hidden z-30 font-['Outfit',sans-serif]">
      {/* Top Arcade HUD Strip */}
      <div className="flex items-center justify-between gap-2 max-w-6xl mx-auto w-full">
        {/* Left Status Console (Lives, Stardust, Score) */}
        <div className="shrink-0 flex items-center gap-2.5 sm:gap-4 bg-slate-900/95 px-3 py-1.5 sm:py-2 rounded-xl border border-slate-800 shadow-md pointer-events-auto">
          {/* Lives Indicator */}
          <div className="flex items-center gap-1.5 border-r border-slate-800 pr-2.5 sm:pr-3">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
            <span className="text-sm sm:text-base font-extrabold text-white font-['Orbitron']">
              {player.lives}
            </span>
          </div>

          {/* Stardust Gauge */}
          <div className="flex items-center gap-1.5 border-r border-slate-800 pr-2.5 sm:pr-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-sm sm:text-base font-bold text-amber-300 font-['Orbitron']">
              {player.stardust}
              <span className="hidden sm:inline text-xs text-slate-400 font-normal font-mono">/100</span>
            </span>
          </div>

          {/* Score Digit Display */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">SKOR</span>
            <span className="text-sm sm:text-base font-black text-white font-['Orbitron'] tracking-wider">
              {player.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Center: Mission Sector (Visible on medium+ screens) */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300">
          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            {worldName}
          </span>
          <span className="text-slate-600">•</span>
          <span className="font-bold text-white">
            {levelName}
          </span>
        </div>

        {/* Right Status Console (Buffs, Stopwatch, Pause & Audio) */}
        <div className="shrink-0 flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
          {/* Active Permanent Powerup */}
          {powerUpInfo && (
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold tracking-wider uppercase font-['Orbitron'] shadow-sm ${powerUpInfo.color}`}>
              <span>{powerUpInfo.icon}</span>
              <span className="hidden sm:inline">{powerUpInfo.name}</span>
            </div>
          )}

          {/* Temporary Buff Countdown */}
          {player.tempBuffs.map((buff, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold font-['Orbitron'] border shadow-sm ${
                buff.type === 'shield'
                  ? 'bg-sky-950/80 text-sky-300 border-sky-500/50'
                  : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
              }`}
            >
              {buff.type === 'shield' ? <Shield className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{Math.ceil(buff.timeLeft)}s</span>
            </div>
          ))}

          {/* Mission Timer */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold font-['Orbitron'] ${
            isTimeLow
              ? 'bg-rose-950/90 border-rose-600 text-rose-300'
              : 'bg-slate-900/95 border-slate-800 text-slate-200'
          }`}>
            <Clock className={`w-3.5 h-3.5 ${isTimeLow ? 'text-rose-400' : 'text-slate-400'}`} />
            <span>{timeFormatted}</span>
          </div>

          {/* Audio & Pause Buttons */}
          <div className="flex items-center bg-slate-900/95 p-1 rounded-xl border border-slate-800 shadow-sm">
            <button
              id="hud-toggle-sound"
              onClick={onToggleSound}
              className={`p-1.5 rounded-lg transition-colors ${
                soundEnabled ? 'text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
              }`}
              title="Efek Suara (SFX)"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
            </button>
            <button
              id="hud-toggle-music"
              onClick={onToggleMusic}
              className={`p-1.5 rounded-lg transition-colors ${
                musicEnabled ? 'text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
              }`}
              title="Musik Latar"
            >
              <Music className="w-4 h-4" />
            </button>
            <button
              id="hud-pause-button"
              onClick={onPause}
              className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors ml-0.5"
              title="Jeda (Esc)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
