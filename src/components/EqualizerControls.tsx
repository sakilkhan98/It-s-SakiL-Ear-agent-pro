import React from 'react';
import { AudioPreset, ThemeConfig } from '../types';
import { Power, VolumeX, Volume2, ShieldAlert, Sparkles, Zap, Radio, Music } from 'lucide-react';

interface EqualizerControlsProps {
  preset: AudioPreset;
  isActive: boolean;
  isMuted: boolean;
  theme: ThemeConfig;
  onPowerToggle: () => void;
  onMuteToggle: () => void;
  onGainChange: (val: number) => void;
  onEqBandChange: (freq: number, val: number) => void;
  onReverbChange: (val: number) => void;
  onStereoToggle: () => void;
  onHighFiToggle: () => void;
}

export const EqualizerControls: React.FC<EqualizerControlsProps> = ({
  preset,
  isActive,
  isMuted,
  theme,
  onPowerToggle,
  onMuteToggle,
  onGainChange,
  onEqBandChange,
  onReverbChange,
  onStereoToggle,
  onHighFiToggle,
}) => {
  const bands = [
    { freq: 60, label: '60 Hz', value: preset.eq60 },
    { freq: 230, label: '230 Hz', value: preset.eq230 },
    { freq: 910, label: '910 Hz', value: preset.eq910 },
    { freq: 3600, label: '3.6 kHz', value: preset.eq3600 },
    { freq: 14000, label: '14 kHz', value: preset.eq14000 },
  ];

  const currentReverbWet = preset.reverbWet !== undefined ? preset.reverbWet : 0;
  const currentStereoHaas = !!preset.stereoHaas;
  const currentStudioHighFi = !!preset.studioHighFi;

  return (
    <div className={`p-6 rounded-3xl ${theme.bgCard} border border-white/10 shadow-2xl relative overflow-hidden`}>
      {/* Carbon fiber grid texture overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff02_1px,transparent_1px)] [background-size:14px_14px] pointer-events-none opacity-45" />

      {/* Rack Mount Top Ears Accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Top Slider Panel & Power Section */}
      <div className="grid grid-cols-3 items-center justify-items-center gap-4 mb-8 relative z-10">
        
        {/* LEFT SLIDER: GAIN BOOSTER */}
        <div className="flex flex-col items-center">
          <div className="h-44 flex items-center justify-center relative">
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.1"
              value={preset.gain}
              onChange={(e) => onGainChange(parseFloat(e.target.value))}
              className="vertical-range accent-red-500 bg-black/40 h-36 rounded-lg appearance-none cursor-pointer"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical',
                width: '8px',
              }}
            />
            {/* Range Track highlighting line (simulated) */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-5 top-5 w-1 bg-black/50 rounded-full pointer-events-none">
              <div 
                className="absolute bottom-0 left-0 right-0 rounded-full" 
                style={{ 
                  top: `${100 - ((preset.gain - 0.5) / 4.5) * 100}%`,
                  backgroundColor: theme.primary 
                }} 
              />
            </div>
          </div>
          <span className="text-xs font-bold tracking-wider uppercase mt-3" style={{ color: theme.primary }}>
            Gain / বুস্ট
          </span>
          <span className="text-[10px] font-mono mt-0.5 text-gray-400">
            {preset.gain.toFixed(1)}x
          </span>
        </div>

        {/* CENTER: BIG METALLIC POWER BUTTON */}
        <div className="flex flex-col items-center">
          <button
            onClick={onPowerToggle}
            id="power-button"
            className={`w-28 h-28 rounded-full flex items-center justify-center relative transition-all duration-300 outline-none
              ${isActive 
                ? `${theme.glow} border-4 border-white/20 bg-gradient-to-br from-gray-700 via-gray-900 to-black` 
                : 'border-4 border-gray-800 bg-gradient-to-br from-gray-800 via-gray-900 to-black hover:scale-102'
              }
              shadow-[inset_0_4px_10px_rgba(255,255,255,0.05),_0_10px_20px_rgba(0,0,0,0.4)]
            `}
          >
            {/* Inner Metallic Bezel */}
            <div className="absolute inset-2 rounded-full border border-white/5 bg-gradient-to-tr from-gray-900 to-gray-800 flex items-center justify-center">
              {/* Outer LED status dot */}
              <div 
                className={`absolute top-4 w-2 h-2 rounded-full transition-all duration-300 ${
                  isActive ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-gray-600'
                }`}
                style={{ backgroundColor: isActive ? theme.primary : '#4b5563' }}
              />
              
              <Power 
                className={`w-10 h-10 transition-all duration-300 ${
                  isActive ? 'scale-110' : 'opacity-40'
                }`}
                style={{ color: isActive ? theme.primary : '#9ca3af' }}
              />
            </div>
          </button>
          
          <span className="text-[11px] font-bold tracking-wider text-gray-300 mt-4 uppercase">
            {isActive ? 'Ear Agent Active' : 'Press to Start'}
          </span>
        </div>

        {/* RIGHT SLIDER: OUTPUT MONITOR LEVEL */}
        <div className="flex flex-col items-center">
          <div className="h-44 flex items-center justify-center relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : 1}
              disabled={!isActive}
              onChange={(e) => {
                if (parseFloat(e.target.value) === 0) {
                  if (!isMuted) onMuteToggle();
                } else {
                  if (isMuted) onMuteToggle();
                }
              }}
              className="vertical-range accent-red-500 bg-black/40 h-36 rounded-lg appearance-none cursor-pointer disabled:opacity-30"
              style={{
                writingMode: 'bt-lr',
                WebkitAppearance: 'slider-vertical',
                width: '8px',
              }}
            />
            {/* Custom Track Highlight */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-5 top-5 w-1 bg-black/50 rounded-full pointer-events-none">
              <div 
                className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-200" 
                style={{ 
                  top: isMuted || !isActive ? '100%' : '0%',
                  backgroundColor: theme.primary 
                }} 
              />
            </div>
          </div>
          
          <button 
            disabled={!isActive}
            onClick={onMuteToggle}
            className={`mt-2 p-1.5 rounded-full transition-colors ${
              isMuted ? 'bg-red-950/40 text-red-400' : 'bg-white/5 text-gray-400 hover:text-white'
            } disabled:opacity-20`}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          <span className="text-xs font-bold tracking-wider uppercase mt-1.5 text-gray-400">
            Volume / সাউন্ড
          </span>
        </div>

      </div>

      {/* FEEDBACK WARNING TIP */}
      {!isMuted && isActive && (
        <div className="mb-6 flex items-center gap-2 bg-amber-950/30 border border-amber-500/20 px-3 py-2.5 rounded-xl text-[11px] text-amber-300 relative overflow-hidden animate-pulse">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 animate-pulse" />
          <ShieldAlert className="w-4.5 h-4.5 text-amber-400 shrink-0" />
          <p className="leading-tight">
            <strong>হেডফোন ব্যবহার করুন!</strong> স্পিকার অন থাকলে মাইক্রোফোনে তীব্র লুপ বা হুইসেল সাউন্ড হতে পারে।
          </p>
        </div>
      )}

      {/* ========================================================
          ULTRA PRO LIVE HEADPHONES STUDIO SUITE (NEW SECTION)
          ======================================================== */}
      <div className="border-t border-white/5 pt-5 mb-5 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 animate-spin-slow" style={{ color: theme.primary }} />
          <h3 className="text-xs font-extrabold tracking-widest text-gray-300 uppercase">
            Headphone Studio Pro FX (হেডফোন অপ্টিমাইজেশান)
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          
          {/* 3D SPATIALIZER (HAAS STEREO) */}
          <div className="bg-black/45 p-3 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Zap className="w-3 h-3 text-yellow-500" /> 3D Live Spatializer
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${currentStereoHaas && isActive ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-gray-700'}`} />
            </div>
            <p className="text-[9px] text-gray-500 leading-tight mb-3">
              অ্যাম্বিয়েন্ট ৩ডি সাউন্ড স্টেজ যা মনো মাইক্রোফোনকে হেডফোনে স্টেরিও চওড়া করে দেয়।
            </p>
            <button
              disabled={!isActive}
              onClick={onStereoToggle}
              className={`w-full py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all border
                ${currentStereoHaas 
                  ? 'bg-gradient-to-r from-red-600 to-red-500 text-white border-red-400/20 shadow-[0_2px_8px_rgba(239,68,68,0.25)]' 
                  : 'bg-white/5 text-gray-400 hover:text-white border-white/5'
                } disabled:opacity-20`}
              style={{ 
                backgroundColor: currentStereoHaas && isActive ? theme.primary : '',
                borderColor: currentStereoHaas && isActive ? theme.accent : ''
              }}
            >
              {currentStereoHaas ? '3D Spatial ACTIVE' : 'Activate 3D Space'}
            </button>
          </div>

          {/* RAW HIGH-FI BYPASS */}
          <div className="bg-black/45 p-3 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                <Radio className="w-3 h-3 text-cyan-400" /> Studio High-Fi Mic
              </span>
              <div className={`w-1.5 h-1.5 rounded-full ${currentStudioHighFi && isActive ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-gray-700'}`} />
            </div>
            <p className="text-[9px] text-gray-500 leading-tight mb-3">
              ব্রাউজারের লো-কোয়ালিটি কমপ্রেশন বাইপাস করে ফুল-ব্যান্ড (48kHz) ক্রিস্টাল ক্লিয়ার মাইক ইনপুট।
            </p>
            <button
              disabled={!isActive}
              onClick={onHighFiToggle}
              className={`w-full py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all border
                ${currentStudioHighFi 
                  ? 'bg-gradient-to-r from-cyan-600 to-cyan-500 text-white border-cyan-400/20 shadow-[0_2px_8px_rgba(6,182,212,0.25)]' 
                  : 'bg-white/5 text-gray-400 hover:text-white border-white/5'
                } disabled:opacity-20`}
            >
              {currentStudioHighFi ? 'RAW HIGH-FI ACTIVE' : 'Enable Raw Mic'}
            </button>
          </div>

        </div>

        {/* LUSH STUDIO REVERB */}
        <div className="bg-black/45 p-3.5 rounded-2xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Music className="w-3.5 h-3.5 text-pink-400" /> Studio Lush Reverb (একো ও এমবিয়েন্স)
            </span>
            <span className="text-[10px] font-mono text-gray-400 font-bold">
              {Math.round(currentReverbWet * 100)}% wet
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-[9px] text-gray-600 uppercase font-bold">Dry</span>
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min="0"
                max="0.6"
                step="0.02"
                value={currentReverbWet}
                disabled={!isActive}
                onChange={(e) => onReverbChange(parseFloat(e.target.value))}
                className="w-full accent-red-500 cursor-pointer h-1.5 bg-black rounded-lg disabled:opacity-20"
              />
              <div 
                className="absolute left-0 h-1.5 rounded-full pointer-events-none"
                style={{ 
                  width: `${(currentReverbWet / 0.6) * 100}%`,
                  backgroundColor: theme.primary 
                }}
              />
            </div>
            <span className="text-[9px] text-gray-400 uppercase font-bold">Lush Reverb</span>
          </div>
          <span className="text-[9px] text-gray-500 block leading-none">
            * এটি ব্যবহার করলে মনে হবে আপনি একটি বিলাসবহুল লাইভ স্টুডিও রুমে বসে গান গাচ্ছেন বা কথা বলছেন।
          </span>
        </div>
      </div>

      {/* Equalizer Header */}
      <div className="border-t border-white/5 pt-5 mb-4">
        <h3 className="text-xs font-bold tracking-widest text-center text-gray-400 uppercase">
          Studio 5-Band Audio Equalizer
        </h3>
      </div>

      {/* BOTTOM SLIDERS: 5-BAND EQUALIZER */}
      <div className="grid grid-cols-5 gap-1 md:gap-3 justify-items-center relative z-10">
        {bands.map((band) => (
          <div key={band.freq} className="flex flex-col items-center w-full">
            <div className="h-36 flex items-center justify-center relative">
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={band.value}
                onChange={(e) => onEqBandChange(band.freq, parseInt(e.target.value))}
                className="vertical-range accent-red-500 bg-black/40 h-28 rounded-lg appearance-none cursor-pointer"
                style={{
                  writingMode: 'bt-lr',
                  WebkitAppearance: 'slider-vertical',
                  width: '6px',
                }}
              />
              {/* Highlight EQ Band level */}
              <div className="absolute left-1/2 -translate-x-1/2 bottom-5 top-5 w-1 bg-black/50 rounded-full pointer-events-none">
                <div 
                  className="absolute left-0 right-0 rounded-full" 
                  style={{ 
                    // Maps -12..12 to 0%..100%
                    bottom: band.value >= 0 ? '50%' : `${50 + (band.value / 12) * 50}%`,
                    top: band.value >= 0 ? `${50 - (band.value / 12) * 50}%` : '50%',
                    backgroundColor: theme.primary 
                  }} 
                />
              </div>
            </div>
            
            <span className="text-[10px] font-mono text-gray-300 mt-2 font-bold">
              {band.value > 0 ? `+${band.value}` : band.value}
            </span>
            <span className="text-[9px] font-semibold text-gray-500 mt-1 uppercase tracking-tighter">
              {band.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
