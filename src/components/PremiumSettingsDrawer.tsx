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
  const [typedCode, setTypedCode] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');

  if (!isOpen) return null;

  const handleActivateClick = () => {
    setErrorMsg('');
    setSuccessMsg('');
    const code = typedCode.trim().toUpperCase();
    if (code === 'SAKIL' || code === 'SAKIL_PRO_MIC' || code === 'SAKIL_VIP_2026' || code === 'SAKIL-VIP-99') {
      onPremiumToggle(true);
      setSuccessMsg('🎉 VIP Premium Successful Activated! Golden Theme loaded.');
      setTypedCode('');
    } else if (!code) {
      setErrorMsg('অনুগ্রহ করে একটি অ্যাক্টিভেশন কোড দিন। (Please enter an activation code)');
    } else {
      setErrorMsg('ভুল কোড! সঠিক কোড পেতে অ্যাপ মেকার SakiL khan এর সাথে যোগাযোগ করুন।');
    }
  };

  const handleDeactivate = () => {
    onPremiumToggle(false);
    setSuccessMsg('');
    setErrorMsg('');
  };

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

            <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
              নতুন প্রফেশনাল স্পাই অডিও রিসিভার, অ্যাক্টিভেশন কোড এবং আপডেট পেতে আমাদের অফিসিয়াল টেলিগ্রাম চ্যানেলে যুক্ত হয়ে যান!
            </p>

            <a 
              href="https://t.me/Sharechat_ns_098"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(6,182,212,0.3)] active:scale-98"
            >
              <Send className="w-4 h-4 shrink-0 animate-bounce" />
              <span>টেলিগ্রামে জয়েন করুন (Join Telegram)</span>
            </a>
          </div>

          {/* ========================================================
              PREMIUM VERSION ENABLE (TOGGLE SECTION)
              ======================================================= */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isPremium 
              ? 'bg-gradient-to-tr from-yellow-950/30 to-amber-950/20 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.15)]' 
              : 'bg-black/45 border-white/5'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Crown className={`w-5 h-5 ${isPremium ? 'text-yellow-400 animate-spin-slow' : 'text-gray-400'}`} />
                <div>
                  <h3 className="text-xs font-extrabold uppercase text-white tracking-wider">
                    Premium VIP Status
                  </h3>
                  <span className={`text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded ${
                    isPremium ? 'bg-yellow-500/20 text-yellow-300' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {isPremium ? '💎 ACTIVE VIP UNLOCKED' : '🔒 STANDARD VERSION (LOCKED)'}
                  </span>
                </div>
              </div>

              {isPremium && (
                <button
                  onClick={handleDeactivate}
                  className="px-2.5 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/20 transition-all active:scale-95 uppercase"
                >
                  Lock Pro
                </button>
              )}
            </div>

            {/* If NOT premium, show beautiful Activation Lock overlay */}
            {!isPremium ? (
              <div className="mt-3 pt-3 border-t border-white/5 space-y-3.5">
                <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-200">
                  <p className="font-bold mb-1">🔒 VIP Premium ফিচারসমূহ লক করা আছে!</p>
                  <p className="text-[10px] leading-relaxed opacity-90">
                    প্রিমিয়াম অ্যাক্টিভেট করলে আপনি পাবেন: ৩ডি কসমিক সাউন্ডস্টেজ, এক্সট্রিম ইয়ার স্প্লিটার হাই-গেইন এমপ্লিফায়ার বুস্ট (12x MAX), পেশাদার নয়েজ গেট এবং ল্যাগ-মুক্ত হাই-কোয়ালিটি লাইভ সাউন্ড, যা হেডফোন কানেক্ট করলেই কান ফেটে যাওয়ার মতো লাউড ও ক্রিস্টাল ক্লিয়ার সাউন্ড প্রদান করবে!
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                    Enter VIP Activation Key (অ্যাক্টিভেশন কোড দিন)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={typedCode}
                      onChange={(e) => setTypedCode(e.target.value)}
                      placeholder="অ্যাক্টিভেশন পাসওয়ার্ড বা কোড দিন..."
                      className="flex-1 text-xs px-3 py-2 rounded-xl bg-black border border-white/10 text-white font-mono outline-none focus:border-yellow-500/30"
                    />
                    <button
                      onClick={handleActivateClick}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black text-xs font-extrabold rounded-xl transition-all shadow-[0_0_12px_rgba(234,179,8,0.3)] active:scale-95"
                    >
                      Unlock
                    </button>
                  </div>
                  {errorMsg && (
                    <p className="text-[10px] font-bold text-red-400 bg-red-950/30 px-2 py-1 rounded border border-red-500/10">
                      ⚠️ {errorMsg}
                    </p>
                  )}
                  {successMsg && (
                    <p className="text-[10px] font-bold text-green-400 bg-green-950/30 px-2 py-1 rounded border border-green-500/10">
                      {successMsg}
                    </p>
                  )}
                </div>

                <div className="text-center pt-1">
                  <p className="text-[10px] text-gray-400">
                    কোড পেতে অথবা প্রিমিয়াম মোড কিনতে সরাসরি ডেভেলাপার বা মেকার <span className="text-yellow-400 font-bold underline">SakiL khan</span> এর সাথে টেলিগ্রামে যোগাযোগ করুন!
                  </p>
                  <a
                    href="https://t.me/Sharechat_ns_098"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[10px] font-bold text-white transition active:scale-95"
                  >
                    <Send className="w-3 h-3 text-cyan-400" />
                    Contact App Maker (SakiL Khan)
                  </a>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-200">
                <p className="font-bold flex items-center gap-1 text-yellow-400">
                  <Sparkles className="w-4 h-4 text-yellow-400 animate-spin-slow" /> 
                  💎 VIP PREMIUM FEATURES UNLOCKED!
                </p>
                <p className="text-[10px] leading-relaxed opacity-90 mt-1">
                  সমস্ত প্রফেশনাল সাউন্ডস্টেজ মাল্টিপ্লায়ার, আল্ট্রা-গেইন এমপ্লিফায়ার বুস্ট (১২ গুন পর্যন্ত), এবং ভিআইপি গোল্ডেন থিম সফলভাবে সক্রিয় করা হয়েছে। ধন্যবাদ SakiL Khan VIP Studio ব্যবহার করার জন্য!
                </p>
              </div>
            )}
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
