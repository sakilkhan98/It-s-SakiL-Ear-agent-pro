import React from 'react';
import { ThemeConfig, ThemeId, THEMES, AudioRoutingMode } from '../types';
import { 
  Headphones, 
  Keyboard, 
  Info, 
  MoreVertical, 
  Bluetooth, 
  Smartphone, 
  CornerUpLeft, 
  Send, 
  Crown,
  Laptop
} from 'lucide-react';

interface HeaderProps {
  currentTheme: ThemeConfig;
  onThemeSelect: (themeId: ThemeId) => void;
  routingMode: AudioRoutingMode;
  onRoutingModeChange: (mode: AudioRoutingMode) => void;
  isPremium: boolean;
  onShowShortcuts: () => void;
  onShowAbout: () => void;
  onShowMoreSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTheme,
  onThemeSelect,
  routingMode,
  onRoutingModeChange,
  isPremium,
  onShowShortcuts,
  onShowAbout,
  onShowMoreSettings,
}) => {
  return (
    <header className="space-y-4 relative z-20">
      
      {/* SAKIL KHAN BRANDING & TELEGRAM JOIN ACCENT HEADER BANNER */}
      <div className="bg-gradient-to-r from-red-600/30 via-yellow-500/20 to-blue-600/30 border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-red-500 via-yellow-400 to-blue-500 animate-pulse" />
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
          <p className="text-xs font-bold tracking-wide text-gray-200">
            Make by <span className="text-yellow-400 font-extrabold underline decoration-wavy decoration-red-500 font-mono">SakiL khan</span>
          </p>
        </div>
        <a 
          href="https://t.me/Sharechat_ns_098"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-extrabold tracking-wider rounded-lg transition-all active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.4)] uppercase"
        >
          <Send className="w-3.5 h-3.5 shrink-0" />
          <span>JOIN Telegram (SakiL Khan)</span>
        </a>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-white/10">
        
        {/* Title block with mic indicator */}
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gradient-to-tr from-gray-900 to-gray-800 border border-white/10 ${currentTheme.glow} relative`}>
            {isPremium ? (
              <Crown className="w-6 h-6 text-yellow-400 animate-bounce" />
            ) : (
              <Headphones className="w-6 h-6" style={{ color: currentTheme.primary }} />
            )}
            {isPremium && (
              <div className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full border border-black animate-ping" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5 font-sans">
              Ear Agent 
              {isPremium ? (
                <span className="text-xs font-black tracking-widest text-black bg-gradient-to-r from-yellow-400 to-amber-500 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(234,179,8,0.6)] flex items-center gap-0.5 uppercase">
                  👑 VIP PRO
                </span>
              ) : (
                <span style={{ color: currentTheme.primary }} className="text-sm font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10">PRO MIC</span>
              )}
            </h1>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5 tracking-wider uppercase">
              Military-Grade Audio Amplifier & DSP Monitor
            </p>
          </div>
        </div>

        {/* Audio Routing Deck & Tool controllers */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          
          {/* ========================================================
              AUDIO ROUTING QUICK-DECK (Requested top corner options)
              ======================================================== */}
          <div className="flex items-center gap-1 bg-black/60 border border-white/15 p-1 rounded-2xl shadow-inner">
            
            {/* Headphones option */}
            <button
              onClick={() => onRoutingModeChange('headphones')}
              title="Wired Headphones / Headset Mode"
              className={`p-2 rounded-xl transition-all flex items-center justify-center relative ${
                routingMode === 'headphones' 
                  ? 'bg-red-500 text-white shadow-[0_0_8px_rgba(239,68,68,0.5)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              style={{
                backgroundColor: routingMode === 'headphones' ? currentTheme.primary : '',
              }}
            >
              <Headphones className="w-4 h-4" />
              {routingMode === 'headphones' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-ping" />
              )}
            </button>

            {/* Bluetooth option */}
            <button
              onClick={() => onRoutingModeChange('bluetooth')}
              title="Bluetooth Headset Mode"
              className={`p-2 rounded-xl transition-all flex items-center justify-center relative ${
                routingMode === 'bluetooth' 
                  ? 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.5)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Bluetooth className="w-4 h-4" />
              {routingMode === 'bluetooth' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-ping" />
              )}
            </button>

            {/* Phone button (Receiver) */}
            <button
              onClick={() => onRoutingModeChange('receiver')}
              title="Phone Handset / Earpiece Mode"
              className={`p-2 rounded-xl transition-all flex items-center justify-center relative ${
                routingMode === 'receiver' 
                  ? 'bg-amber-500 text-white shadow-[0_0_8px_rgba(245,158,11,0.5)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              {routingMode === 'receiver' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-ping" />
              )}
            </button>

            {/* Phone Back speaker/mic */}
            <button
              onClick={() => onRoutingModeChange('speaker')}
              title="Rear Microphone & Speaker Mode"
              className={`p-2 rounded-xl transition-all flex items-center justify-center relative ${
                routingMode === 'speaker' 
                  ? 'bg-green-500 text-white shadow-[0_0_8px_rgba(34,197,94,0.5)]' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <CornerUpLeft className="w-4 h-4" />
              {routingMode === 'speaker' && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-ping" />
              )}
            </button>

          </div>

          {/* Theme Selectors */}
          <div className="hidden sm:flex items-center gap-1 bg-black/40 border border-white/10 px-2 py-1.5 rounded-xl">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => {
              const config = THEMES[id];
              const isSelected = currentTheme.id === id;
              return (
                <button
                  key={id}
                  onClick={() => onThemeSelect(id)}
                  title={config.name}
                  className={`w-3.5 h-3.5 rounded-full border transition-transform duration-200 active:scale-90 ${
                    isSelected ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: config.primary }}
                />
              );
            })}
          </div>

          {/* Shortcuts button */}
          <button
            onClick={onShowShortcuts}
            title="Keyboard Shortcuts"
            className="p-2 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-white transition active:scale-95 flex items-center gap-1 text-[11px]"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Info button */}
          <button
            onClick={onShowAbout}
            title="Information"
            className="p-2 rounded-xl bg-black/40 border border-white/10 text-gray-400 hover:text-white transition active:scale-95 flex items-center gap-1 text-[11px]"
          >
            <Info className="w-4 h-4" />
          </button>

          {/* 3-DOT MORE SETTINGS TRIGGERS */}
          <button
            onClick={onShowMoreSettings}
            id="more-options-button"
            className="p-2 rounded-xl bg-gradient-to-tr from-gray-900 to-gray-800 border border-white/10 text-gray-300 hover:text-white transition active:scale-95 flex items-center justify-center animate-pulse shadow-md hover:scale-102"
          >
            <MoreVertical className="w-4.5 h-4.5" />
          </button>

        </div>
      </div>
    </header>
  );
};
