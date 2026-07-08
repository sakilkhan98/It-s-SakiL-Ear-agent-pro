import React from 'react';
import { ThemeConfig, AudioRoutingMode } from '../types';
import { 
  X, 
  Crown, 
  Send, 
  Sliders, 
  Lock, 
  Unlock, 
  Shield, 
  Sparkles, 
  Music, 
  Compass, 
  KeyRound, 
  VolumeX, 
  HelpCircle,
  Radio
} from 'lucide-react';

interface PremiumSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeConfig;
  isPremium: boolean;
  onPremiumToggle: (enabled: boolean) => void;
  haasDelayMs: number;
  onHaasDelayMsChange: (ms: number) => void;
  highPassFreq: number;
  onHighPassFreqChange: (hz: number) => void;
  fftSize: number;
  onFftSizeChange: (size: number) => void;
  encryptionKey: string;
  onEncryptionKeyChange: (key: string) => void;
  soundstageMultiplier: number;
  onSoundstageMultiplierChange: (mult: number) => void;
}

export const PremiumSettingsDrawer: React.FC<PremiumSettingsDrawerProps> = ({
  isOpen,
  onClose,
  theme,
  isPremium,
  onPremiumToggle,
  haasDelayMs,
  onHaasDelayMsChange,
  highPassFreq,
  onHighPassFreqChange,
  fftSize,
  onFftSizeChange,
  encryptionKey,
  onEncryptionKeyChange,
  soundstageMultiplier,
  onSoundstageMultiplierChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop blur overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
      />

      {/* Drawer Body Container */}
      <div className="relative w-full max-w-md h-full bg-[#141416] border-l border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-y-auto flex flex-col z-50 animate-slide-in">
        
        {/* Carbon grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />

        {/* Top Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40 relative z-10">
          <div className="flex items-center gap-2">
            <Crown className={`w-5 h-5 ${isPremium ? 'text-yellow-400 animate-pulse' : 'text-gray-400'}`} />
            <div>
              <h2 className="font-extrabold text-sm tracking-widest text-white uppercase font-sans">
                SakiL Khan VIP Studio
              </h2>
              <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
                PRO Studio & Calibration Panel
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 border border-white/15 text-gray-400 hover:text-white transition active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-6 space-y-6 flex-1 relative z-10">
          
          {/* ========================================================
              EXCLUSIVE TELEGRAM MEMBERSHIP HUB
              ======================================================== */}
          <div className="bg-gradient-to-tr from-[#1a2e40] to-[#0a1520] border border-cyan-500/20 rounded-2xl p-4 space-y-3 shadow-lg relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl" />
            
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
                <Send className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">
                  SakiL Khan Telegram Channel
                </h3>
                <p className="text-[10px] text-cyan-300 font-mono">
                  t.me/Sharechat_ns_098
                </p>
              </div>
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed">
              নতুন নতুন প্রফেশনাল স্পাই এবং অডিও রিসিভার আপডেট পেতে আমাদের অফিসিয়াল টেলিগ্রাম চ্যানেলে যুক্ত হয়ে যান!
            </p>

            <a 
              href="https://t.me/Sharechat_ns_098"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(6,182,212,0.3)] active:scale-98"
            >
              <Send className="w-4 h-4 shrink-0 animate-bounce" />
              <span>টেলিগ্রামে জয়েন করুন (Join Channel)</span>
            </a>
          </div>

          {/* ========================================================
              PREMIUM VERSION ENABLE (TOGGLE SECTION)
              ======================================================== */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isPremium 
              ? 'bg-gradient-to-tr from-yellow-950/30 to-amber-950/20 border-yellow-500/30' 
              : 'bg-black/45 border-white/5'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className={`w-5 h-5 ${isPremium ? 'text-yellow-400 animate-spin-slow' : 'text-gray-400'}`} />
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-white tracking-wider">
                    Premium Version Status
                  </h3>
                  <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                    isPremium ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {isPremium ? '💎 ACTIVE VIP UNLOCKED' : '🔒 STANDARD VERSION'}
                  </span>
                </div>
              </div>

              {/* IOS Styled Switch */}
              <button
                onClick={() => onPremiumToggle(!isPremium)}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-300 focus:outline-none flex items-center ${
                  isPremium ? 'bg-yellow-500' : 'bg-gray-800'
                }`}
              >
                <div className={`bg-black w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                  isPremium ? 'translate-x-6' : 'translate-x-0'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-yellow-400' : 'bg-gray-600'}`} />
                </div>
              </button>
            </div>

            <p className="text-[10px] text-gray-400 leading-relaxed">
              প্রিমিয়াম মোড সক্রিয় করলে সম্পূর্ণ ইন্টারফেস গোল্ডেন থিমে রূপান্তরিত হবে, এবং কসমিক ৩ডি স্টেরিও সাউন্ডস্টেজ ও এনক্রিপশন স্পেসিফিকেশনসমূহ আনলক হবে।
            </p>
          </div>

          {/* ========================================================
              MORE SETTINGS: AUDIO CALIBRATION SLIDERS
              ======================================================== */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block border-b border-white/5 pb-1 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              More Advanced Studio Settings (অডিও ক্যালিব্রেশন)
            </h3>

            {/* HAAS DELAY CONTROLLER */}
            <div className="bg-black/35 p-3 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-cyan-400" /> Haas delay (স্টেরিও চওড়া করার ল্যাটেন্সি)
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {haasDelayMs} ms
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="1"
                value={haasDelayMs}
                onChange={(e) => onHaasDelayMsChange(parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-black rounded"
              />
              <span className="text-[9px] text-gray-500 block">
                * ১০-৪০ মিলি-সেকেন্ডের ব্যবধানে বাম ও ডান কানের শব্দের মধ্যে ডাইমেনশনাল ৩ডি স্টেজ তৈরি হয়।
              </span>
            </div>

            {/* TAPE ENCRYPTION KEY MANAGER */}
            <div className="bg-black/35 p-3 rounded-xl border border-white/5 space-y-2">
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-pink-400" />
                <span className="text-xs font-semibold text-gray-300">
                  Tape Secure Encryption Key (এনক্রিপশন কোড)
                </span>
              </div>
              <input
                type="text"
                value={encryptionKey}
                onChange={(e) => onEncryptionKeyChange(e.target.value)}
                placeholder="মাস্টার পাসওয়ার্ড দিন..."
                className="w-full text-xs px-3 py-1.5 rounded-lg bg-black/60 border border-white/10 text-white font-mono outline-none focus:border-pink-500/30"
              />
              <span className="text-[9px] text-gray-500 block">
                * রেকর্ড করা টেপগুলো সুরক্ষিতভাবে লক করার জন্য এই কাস্টম মাস্টার কি চিপ ব্যবহৃত হবে।
              </span>
            </div>

            {/* EXCLUSIVE VIP SOUNDSTAGE MULTIPLIER (Requires Premium) */}
            <div className="bg-black/35 p-3 rounded-xl border border-white/5 space-y-2 relative overflow-hidden">
              {!isPremium && (
                <div className="absolute inset-0 bg-black/85 backdrop-blur-[1px] flex flex-col items-center justify-center z-20 space-y-1">
                  <Lock className="w-4 h-4 text-yellow-400 animate-bounce" />
                  <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">
                    Unlock Premium to Enable
                  </span>
                </div>
              )}
              
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-yellow-400" /> VIP Binaural Soundstage Multiplier
                </span>
              </div>

              <select
                value={soundstageMultiplier}
                onChange={(e) => onSoundstageMultiplierChange(parseFloat(e.target.value))}
                className="w-full text-xs px-3 py-2 rounded-lg bg-black border border-white/10 text-yellow-400 outline-none focus:border-yellow-400/40"
              >
                <option value="1.0">Normal Studio (1.0x width)</option>
                <option value="1.8">Super Wide (1.8x width)</option>
                <option value="3.0">Extreme IMAX Hall (3.0x width)</option>
                <option value="5.0">SakiL khan Cosmic Soundstage (5.0x VIP width!)</option>
              </select>
              <span className="text-[9px] text-gray-500 block">
                * ৩ডি স্টেরিও সাউন্ডকে বহুগুণে চওড়া করে চারপাশের অ্যাম্বিয়েন্স আরও স্পষ্টভাবে শোনাবে।
              </span>
            </div>

            {/* FFT SIZE SELECTOR */}
            <div className="bg-black/35 p-3 rounded-xl border border-white/5 space-y-2">
              <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-purple-400" /> DSP FFT Sampling Precision
              </span>
              <select
                value={fftSize}
                onChange={(e) => onFftSizeChange(parseInt(e.target.value))}
                className="w-full text-xs px-3 py-1.5 rounded-lg bg-black border border-white/10 text-white outline-none focus:border-white/20"
              >
                <option value="128">128 samples (Fastest / Lower Quality)</option>
                <option value="256">256 samples (Optimized / Live Mode)</option>
                <option value="512">512 samples (Standard Studio Pro)</option>
                <option value="1024">1024 samples (Ultra-Precision HD)</option>
                <option value="2048">2048 samples (Extreme Mastering Quality)</option>
              </select>
              <span className="text-[9px] text-gray-500 block">
                * বেশি স্যাম্পলিং উইন্ডো সাইজ বেশি স্পষ্ট সাউন্ড সিগন্যাল রিডিং প্রদান করবে।
              </span>
            </div>

            {/* HIGHPASS LOW CUT FREQ */}
            <div className="bg-black/35 p-3 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-emerald-400" /> Rumble Cut / Highpass Cutoff
                </span>
                <span className="text-xs font-mono font-bold text-white">
                  {highPassFreq} Hz
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="300"
                step="10"
                value={highPassFreq}
                onChange={(e) => onHighPassFreqChange(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-black rounded"
              />
              <span className="text-[9px] text-gray-500 block">
                * চারপাশের ফ্যান, এসি, বা রম্বল নয়েজ কাটার জন্য নির্দিষ্ট হার্জের নিচের সাব-ফ্রিকোয়েন্সি ব্লক করবে।
              </span>
            </div>

          </div>

          {/* SAKIL KHAN BRAND BANNER SIGNATURE */}
          <div className="border-t border-white/10 pt-6 text-center space-y-1 bg-black/20 rounded-2xl p-4">
            <Crown className="w-5 h-5 text-yellow-400 mx-auto animate-pulse" />
            <p className="text-xs font-black tracking-widest text-white uppercase font-mono">
              Designed by SakiL khan
            </p>
            <p className="text-[10px] text-cyan-400 font-mono">
              JOIN CHANNEL • t.me/Sharechat_ns_098
            </p>
            <p className="text-[9px] text-gray-600 font-mono mt-2">
              Ear Agent Pro VIP Framework v4.2.0 • Secured DSP Core
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
