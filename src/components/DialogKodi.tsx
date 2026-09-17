import React, { useState } from 'react';
import { Bot, Check, X, Radio } from 'lucide-react';

interface DialogKodiProps {
  tip: string;
  onDismiss: () => void;
}

export const DialogKodi: React.FC<DialogKodiProps> = ({ tip, onDismiss }) => {
  const [closed, setClosed] = useState(false);

  if (closed || !tip) return null;

  const handleClose = () => {
    setClosed(true);
    onDismiss();
  };

  return (
    <div
      id="kodi-dialog"
      className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg z-40 pointer-events-auto select-none animate-in fade-in duration-200 font-['Outfit',sans-serif]"
    >
      <div className="bg-slate-900 border border-slate-700/90 rounded-xl p-3.5 sm:p-4 shadow-xl flex items-start gap-3">
        {/* Crisp AI Companion Terminal Avatar */}
        <div className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
          <Bot className="w-6 h-6" />
        </div>

        {/* Tip Dialogue Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-emerald-400" />
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider font-['Orbitron'] uppercase">
                TRANSMISI KODI
              </span>
            </div>
            <button
              id="kodi-dismiss-button"
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
              title="Tutup dialog"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
            {tip}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          onClick={handleClose}
          className="shrink-0 self-center px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700/80"
        >
          OK
        </button>
      </div>
    </div>
  );
};
