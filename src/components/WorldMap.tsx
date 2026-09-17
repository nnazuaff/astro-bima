import React, { useState } from 'react';
import { ChevronLeft, Star, Lock, Sparkles, Play, ShieldAlert, Award, Volume2, VolumeX, Music, Globe } from 'lucide-react';
import { WORLDS } from '../game/levels';
import { UserProgress, WorldId, CompletedLevelData } from '../types';

interface WorldMapProps {
  progress: UserProgress;
  onSelectLevel: (levelId: string) => void;
  onBackToMenu: () => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  onToggleSound: () => void;
  onToggleMusic: () => void;
}

export const WorldMap: React.FC<WorldMapProps> = ({
  progress,
  onSelectLevel,
  onBackToMenu,
  soundEnabled,
  musicEnabled,
  onToggleSound,
  onToggleMusic
}) => {
  const [selectedWorldIndex, setSelectedWorldIndex] = useState(0);
  const currentWorld = WORLDS[selectedWorldIndex];

  // Helper to check if level is unlocked
  const isLevelUnlocked = (worldIdx: number, levelIdx: number, levelId: string) => {
    // World 1 first level is always unlocked
    if (worldIdx === 0 && levelIdx === 0) return true;
    // If completed before, it's unlocked
    if (progress.completedLevels[levelId]) return true;

    // Check previous level in same world
    if (levelIdx > 0) {
      const prevLvlId = currentWorld.levels[levelIdx - 1].id;
      return !!progress.completedLevels[prevLvlId];
    }

    // First level of world 2, 3, 4 unlocked if previous world's boss is beaten
    if (worldIdx > 0 && levelIdx === 0) {
      const prevWorld = WORLDS[worldIdx - 1];
      const prevBossId = prevWorld.levels[prevWorld.levels.length - 1].id;
      return !!progress.completedLevels[prevBossId];
    }

    return false;
  };

  const totalStars = Object.values(progress.completedLevels).reduce(
    (acc: number, curr: CompletedLevelData) => acc + (curr?.stars || 0),
    0
  );

  return (
    <div id="world-map-screen" className="relative w-full h-full min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto overflow-x-hidden select-none p-4 sm:p-6 font-['Outfit',sans-serif]">
      {/* Subtle Deep Space Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,_rgba(16,185,129,0.06),_transparent_60%)] pointer-events-none -z-10" />

      {/* Header Console Bar */}
      <div className="flex items-center justify-between gap-2 max-w-5xl mx-auto w-full z-10 pt-1 sm:pt-2">
        <button
          id="map-back-menu-button"
          onClick={onBackToMenu}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer shadow-sm text-xs font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali ke Base</span>
        </button>

        {/* Shards & Stars Counters */}
        <div className="shrink-0 flex items-center gap-3 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800 shadow-sm text-xs">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline text-slate-400 font-medium">Kristal:</span>
            <span className="font-bold text-amber-300 font-['Orbitron']">
              {progress.crystalsCollected}/4
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline text-slate-400 font-medium">Bintang:</span>
            <span className="font-bold text-emerald-300 font-['Orbitron']">
              {totalStars}
            </span>
          </div>
        </div>

        {/* Audio Switches */}
        <div className="shrink-0 flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              soundEnabled ? 'text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title="Efek Suara"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>
          <button
            onClick={onToggleMusic}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              musicEnabled ? 'text-emerald-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-800'
            }`}
            title="Musik"
          >
            <Music className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Sector Navigation */}
      <div className="max-w-5xl mx-auto w-full my-6 flex flex-col items-center z-10">
        {/* Planetary Sector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full mb-6">
          {WORLDS.map((world, idx) => {
            const isUnlocked = idx === 0 || isLevelUnlocked(idx, 0, world.levels[0].id);
            const isSelected = idx === selectedWorldIndex;
            return (
              <button
                key={world.id}
                id={`world-tab-${world.id}`}
                onClick={() => isUnlocked && setSelectedWorldIndex(idx)}
                disabled={!isUnlocked}
                className={`relative flex flex-col items-start p-3 rounded-xl border transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-slate-600 shadow-md ring-1 ring-emerald-500/50'
                    : isUnlocked
                    ? 'bg-slate-900/70 hover:bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    : 'bg-slate-950/60 border-slate-900 text-slate-600 cursor-not-allowed opacity-50'
                }`}
              >
                {!isUnlocked && (
                  <div className="absolute top-2.5 right-2.5">
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                )}
                <span className="text-[10px] font-bold font-['Orbitron'] text-emerald-400 uppercase tracking-wider mb-0.5">
                  SEKTOR 0{idx + 1}
                </span>
                <span className="text-sm font-bold text-white truncate max-w-full">
                  {world.name}
                </span>
                <span className="text-[11px] text-slate-400 truncate max-w-full">
                  {world.planetName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Sector Briefing & Missions Sheet */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          {/* Sector Title & Objectives */}
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-5 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-wider uppercase text-slate-400 font-['Orbitron']">
                  {currentWorld.planetName}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-['Orbitron']">
                {currentWorld.name}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-md">
              {currentWorld.description}
            </p>
          </div>

          {/* Level Nodes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {currentWorld.levels.map((lvl, lIdx) => {
              const unlocked = isLevelUnlocked(selectedWorldIndex, lIdx, lvl.id);
              const completedData = progress.completedLevels[lvl.id];
              const isBoss = lvl.isBossLevel;

              return (
                <div
                  key={lvl.id}
                  id={`level-node-${lvl.id}`}
                  className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                    unlocked
                      ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-950/40 border-slate-900 opacity-40 cursor-not-allowed'
                  } ${isBoss && unlocked ? 'border-amber-500/40 bg-amber-950/20' : ''}`}
                >
                  <div>
                    {/* Node Header */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black font-['Orbitron'] text-slate-400">
                        {lvl.id}
                      </span>
                      {isBoss ? (
                        <span className="text-[10px] font-bold text-rose-400 bg-rose-950 border border-rose-800/80 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" />
                          <span>BOSS</span>
                        </span>
                      ) : unlocked ? (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3].map(s => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                completedData && s <= completedData.stars
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-slate-700" />
                      )}
                    </div>

                    <h3 className="text-xs sm:text-sm font-bold text-white mb-1 leading-snug">
                      {lvl.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-tight mb-3 line-clamp-2 font-normal">
                      {lvl.subtitle}
                    </p>
                  </div>

                  {/* Launch Action */}
                  {unlocked ? (
                    <button
                      id={`play-btn-${lvl.id}`}
                      onClick={() => onSelectLevel(lvl.id)}
                      className="w-full mt-2 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-200 border border-slate-700/80 active:translate-y-0.5 font-['Orbitron'] tracking-wider"
                    >
                      <Play className="w-3 h-3 fill-current text-emerald-400" />
                      <span>{completedData ? 'MAIN LAGI' : 'LUNCURKAN'}</span>
                    </button>
                  ) : (
                    <div className="w-full mt-2 py-2 text-center text-[11px] text-slate-600 font-mono">
                      TERKUNCI
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="text-center text-xs text-slate-500 max-w-md mx-auto pb-2 font-mono">
        Selesaikan misi tiap sektor untuk membuka sektor baru dan merebut kembali Kristal Inti.
      </div>
    </div>
  );
};
