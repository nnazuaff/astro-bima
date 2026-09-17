import React from 'react';
import { ArrowLeft, ArrowRight, ArrowDown, ChevronUp, Zap } from 'lucide-react';
import { InputKeys, PlayerState } from '../types';

interface TouchControlsProps {
  player: PlayerState;
  input: InputKeys;
  onSetInputKey: (key: keyof InputKeys, active: boolean) => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  player,
  input,
  onSetInputKey
}) => {
  return (
    <div id="touch-controls" className="absolute inset-x-0 bottom-0 p-3 sm:p-4 pointer-events-none flex items-end justify-between select-none z-30 font-['Outfit',sans-serif]">
      {/* Left: Direction D-Pad */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          id="touch-left-button"
          onPointerDown={() => onSetInputKey('left', true)}
          onPointerUp={() => onSetInputKey('left', false)}
          onPointerLeave={() => onSetInputKey('left', false)}
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            input.left
              ? 'bg-emerald-500 text-slate-950 translate-y-1 border-b-0'
              : 'bg-slate-900 border border-slate-700 border-b-4 border-b-slate-950 text-slate-200'
          }`}
          title="Kiri"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          id="touch-down-button"
          onPointerDown={() => onSetInputKey('down', true)}
          onPointerUp={() => onSetInputKey('down', false)}
          onPointerLeave={() => onSetInputKey('down', false)}
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            input.down
              ? 'bg-amber-500 text-slate-950 translate-y-1 border-b-0'
              : 'bg-slate-900 border border-slate-700 border-b-4 border-b-slate-950 text-slate-200'
          }`}
          title="Bawah / Tunduk"
        >
          <ArrowDown className="w-6 h-6" />
        </button>

        <button
          id="touch-right-button"
          onPointerDown={() => onSetInputKey('right', true)}
          onPointerUp={() => onSetInputKey('right', false)}
          onPointerLeave={() => onSetInputKey('right', false)}
          className={`w-13 h-13 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
            input.right
              ? 'bg-emerald-500 text-slate-950 translate-y-1 border-b-0'
              : 'bg-slate-900 border border-slate-700 border-b-4 border-b-slate-950 text-slate-200'
          }`}
          title="Kanan"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Right: Action & Jump Buttons */}
      <div className="flex items-center gap-2.5 pointer-events-auto">
        {/* Action / Shoot Button (visible when having energy glove) */}
        {player.powerUp === 'energy_glove' && (
          <button
            id="touch-action-button"
            onPointerDown={() => onSetInputKey('action', true)}
            onPointerUp={() => onSetInputKey('action', false)}
            onPointerLeave={() => onSetInputKey('action', false)}
            className={`w-13 h-13 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              input.action
                ? 'bg-purple-500 text-white translate-y-1 border-b-0'
                : 'bg-purple-950 border border-purple-700 border-b-4 border-b-purple-950 text-purple-300'
            }`}
            title="Tembak Energi"
          >
            <Zap className="w-6 h-6 fill-current" />
          </button>
        )}

        {/* Jump Button */}
        <button
          id="touch-jump-button"
          onPointerDown={() => onSetInputKey('jump', true)}
          onPointerUp={() => onSetInputKey('jump', false)}
          onPointerLeave={() => onSetInputKey('jump', false)}
          className={`w-16 h-16 sm:w-18 sm:h-18 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer shrink-0 ${
            input.jump
              ? 'bg-emerald-400 text-slate-950 translate-y-1 border-b-0'
              : 'bg-emerald-500 border border-emerald-400 border-b-4 border-b-emerald-700 text-slate-950 shadow-md'
          }`}
          title="Lompat"
        >
          <ChevronUp className="w-7 h-7 -mb-0.5 stroke-[2.5]" />
          <span className="text-[10px] font-black tracking-wider uppercase font-['Orbitron']">
            {player.powerUp === 'jetpack' && !player.isGrounded ? 'BOOST' : 'JUMP'}
          </span>
        </button>
      </div>
    </div>
  );
};
