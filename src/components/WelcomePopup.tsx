import React, { useState, useEffect, useRef } from 'react';
import { ThemeConfig } from '../types';
import { verifyActivationKey } from '../lib/crypto';
import { 
  Crown, 
  Send, 
  X, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  ShieldCheck, 
  Play, 
  Lock, 
  Smartphone, 
  Flame,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
// @ts-ignore
import sakilLogo from '../assets/images/sakil_logo_1783502503446.jpg';

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onPremiumUnlock: () => void;
  theme: ThemeConfig;
  isPremium: boolean;
}

type LangTab = 'en' | 'hi' | 'bn';

export const WelcomePopup: React.FC<WelcomePopupProps> = ({
  isOpen,
  onClose,
  onPremiumUnlock,
  theme,
  isPremium,
}) => {
  const [activeTab, setActiveTab] = useState<LangTab>('bn');
  const [hasInteracted, setHasInteracted] = useState(false);
  const [activationCode, setActivationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [musicPlaying, setMusicPlaying] = useState(true);

  // Web Audio Nodes references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const synthNodesRef = useRef<{
    oscillators: OscillatorNode[];
    gainNode: GainNode | null;
    filterNode: BiquadFilterNode | null;
  }>({ oscillators: [], gainNode: null, filterNode: null });
  const pluckTimerRef = useRef<number | null>(null);

  const cleanupAudio = () => {
    // Clear pluck timers
    if (pluckTimerRef.current) {
      clearInterval(pluckTimerRef.current);
      pluckTimerRef.current = null;
    }

    // Cancel text speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Stop and close Web Audio Context
    try {
      if (synthNodesRef.current) {
        synthNodesRef.current.oscillators.forEach(osc => {
          try { osc.stop(); } catch(e){}
        });
        synthNodesRef.current.oscillators = [];
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    } catch (err) {
      console.warn("Audio cleanup error", err);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      cleanupAudio();
    }
    return () => cleanupAudio();
  }, [isOpen]);

  if (!isOpen) return null;

  // Web Audio Ambient Synthesizer
  const startAmbientSynth = () => {
    try {
      // Create context
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      // Master Gain for ambient hum
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.08, ctx.currentTime); // Soft volume

      // Resonance filter sweep
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      filter.Q.setValueAtTime(5, ctx.currentTime);

      // Sweep the filter frequency slowly up and down to create space sweep effect
      let direction = 1;
      const filterSweep = setInterval(() => {
        if (ctx.state === 'closed') {
          clearInterval(filterSweep);
          return;
        }
        const now = ctx.currentTime;
        const currentFreq = filter.frequency.value;
        let nextFreq = currentFreq + (direction * 15);
        if (nextFreq > 900) {
          direction = -1;
          nextFreq = 900;
        } else if (nextFreq < 200) {
          direction = 1;
          nextFreq = 200;
        }
        filter.frequency.setValueAtTime(nextFreq, now);
      }, 80);

      // Warm background drone chords
      const freqArray = [110.00, 164.81, 220.00, 329.63]; // A minor drone (A2, E3, A3, E4)
      const oscillators: OscillatorNode[] = [];

      freqArray.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        
        // Detune slightly for lush chorus feel
        osc.detune.setValueAtTime((Math.random() - 0.5) * 15, ctx.currentTime);
        
        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0.25, ctx.currentTime);
        
        osc.connect(oscGain);
        oscGain.connect(filter);
        osc.start();
        oscillators.push(osc);
      });

      // Simple echo / delay loop simulation via rhythmic plucks
      const triggerPluck = () => {
        if (ctx.state === 'closed') return;
        
        const now = ctx.currentTime;
        const noteFreqs = [440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00]; // Pentatonic notes
        const randomNote = noteFreqs[Math.floor(Math.random() * noteFreqs.length)];

        const pluckOsc = ctx.createOscillator();
        const pluckGain = ctx.createGain();
        
        pluckOsc.type = 'sine';
        pluckOsc.frequency.setValueAtTime(randomNote, now);
        
        pluckGain.gain.setValueAtTime(0.0, now);
        pluckGain.gain.linearRampToValueAtTime(0.05, now + 0.05);
        pluckGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        // Routing
        pluckOsc.connect(pluckGain);
        
        // Connect to a delay node to make it feel cyber spacey
        const delay = ctx.createDelay();
        delay.delayTime.setValueAtTime(0.4, now);
        const delayFeedback = ctx.createGain();
        delayFeedback.gain.setValueAtTime(0.4, now);

        pluckGain.connect(masterGain);
        pluckGain.connect(delay);
        delay.connect(delayFeedback);
        delayFeedback.connect(delay);
        delay.connect(masterGain);

        pluckOsc.start(now);
        pluckOsc.stop(now + 3.0);
      };

      filter.connect(masterGain);
      masterGain.connect(ctx.destination);

      synthNodesRef.current = {
        oscillators,
        gainNode: masterGain,
        filterNode: filter
      };

      // Periodic melody plucks
      pluckTimerRef.current = window.setInterval(triggerPluck, 1500) as unknown as number;
      triggerPluck();

    } catch (err) {
      console.warn("Failed to initialize custom synth audio engine", err);
    }
  };

  const speakWelcomeVoice = () => {
    try {
      if ('speechSynthesis' in window) {
        // Cancel any pending speech first
        window.speechSynthesis.cancel();

        const speechText = "Welcome to the world of N S SakiL Khan! Developed especially for Sharechat Fighters. Heavy live sound amplification activated. Put on your headphones and welcome to my world!";
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 0.95; // Mechanical futuristic cyber pace
        utterance.pitch = 0.95; // Heavy bass/masculine mechanical feel
        utterance.volume = 1.0;

        // Try to find a premium English voice
        const voices = window.speechSynthesis.getVoices();
        const techVoice = voices.find(v => v.name.includes("Google US English") || v.name.includes("Premium") || v.name.includes("Male"));
        if (techVoice) {
          utterance.voice = techVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    } catch (err) {
      console.warn("Speech synthesis failed", err);
    }
  };

  const handleEnterClick = () => {
    setHasInteracted(true);
    startAmbientSynth();
    speakWelcomeVoice();
  };

  const toggleMusicMute = () => {
    if (synthNodesRef.current.gainNode && audioCtxRef.current) {
      if (musicPlaying) {
        synthNodesRef.current.gainNode.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
        setMusicPlaying(false);
      } else {
        synthNodesRef.current.gainNode.gain.setValueAtTime(0.08, audioCtxRef.current.currentTime);
        setMusicPlaying(true);
      }
    }
  };

  const handleActivateCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const code = activationCode.trim();

    if (!code) {
      setErrorMsg('অনুগ্রহ করে একটি কোড টাইপ করুন। (Please enter code)');
      return;
    }

    if (verifyActivationKey(code)) {
      onPremiumUnlock();
      setSuccessMsg('🎉 VIP PREMIUM SUCCESSFULLY UNLOCKED! Golden Theme loaded.');
      setActivationCode('');
      // Trigger success alert sound
      try {
        if (audioCtxRef.current) {
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(523.25, audioCtxRef.current.currentTime); // C5
          osc.frequency.setValueAtTime(659.25, audioCtxRef.current.currentTime + 0.15); // E5
          osc.frequency.setValueAtTime(783.99, audioCtxRef.current.currentTime + 0.3); // G5
          osc.frequency.setValueAtTime(1046.50, audioCtxRef.current.currentTime + 0.45); // C6
          gain.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
          gain.gain.linearRampToValueAtTime(0.1, audioCtxRef.current.currentTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.8);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 1.0);
        }
      } catch (err){}
    } else {
      setErrorMsg('ভুল অ্যাক্টিভেশন কোড! সঠিক কোড পেতে SakiL Khan এর সাথে যোগাযোগ করুন।');
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      
      {/* Background neon light rings */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/10 blur-[80px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/10 blur-[80px] pointer-events-none animate-pulse delay-700" />

      {/* BEFORE INTERACTION - GATEWAY BUTTON TO BYPASS AUTO-PLAY SECURITY */}
      {!hasInteracted ? (
        <div className="relative w-full max-w-lg bg-[#0e0e11] border border-white/10 rounded-3xl p-8 text-center shadow-[0_0_60px_rgba(0,0,0,0.9)] animate-scale-up z-10 overflow-hidden">
          {/* Carbon Fiber Accent Grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none opacity-40" />
          
          <div className="absolute -top-16 -left-16 w-32 h-32 bg-cyan-500/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-amber-500/20 rounded-full blur-2xl" />

          {/* Logo container with neon ring */}
          <div className="relative w-40 h-40 mx-auto mb-6 rounded-full p-1 bg-gradient-to-r from-cyan-500 via-amber-500 to-red-500 shadow-[0_0_30px_rgba(234,179,8,0.25)] animate-spin-slow">
            <div className="w-full h-full rounded-full bg-black overflow-hidden flex items-center justify-center">
              <img 
                src={sakilLogo} 
                alt="SakiL Khan Logo" 
                className="w-full h-full object-cover scale-102"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <h1 className="text-xl font-extrabold uppercase bg-gradient-to-r from-cyan-400 via-yellow-300 to-amber-500 bg-clip-text text-transparent tracking-widest mb-2 font-sans">
            It's SakiL Khan 01
          </h1>
          <p className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase mb-6 animate-pulse">
            ★ Special VIP Soundstage Monitor & Receiver ★
          </p>

          <p className="text-sm text-gray-300 font-sans leading-relaxed mb-8 max-w-sm mx-auto">
            Experience military-grade extreme audio amplification built specifically for the ultimate combat and audio monitoring power!
          </p>

          <button
            onClick={handleEnterClick}
            className="group relative w-full py-4 bg-gradient-to-r from-cyan-500 via-yellow-400 to-amber-500 text-black font-extrabold text-sm rounded-2xl uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(234,179,8,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] active:scale-95 flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current shrink-0 group-hover:scale-110 transition-transform" />
            <span>Enter SakiL Khan's World</span>
          </button>

          <div className="mt-4 flex items-center justify-center gap-2 text-gray-500 text-[10px] font-mono">
            <Smartphone className="w-3 h-3 text-cyan-500" />
            <span>Connect earphones/headset for heavy sound boost</span>
          </div>
        </div>
      ) : (
        /* AFTER INTERACTION: EXQUISITE MULTILINGUAL WELCOME POPUP */
        <div className="relative w-full max-w-xl bg-[#0d0d10] border-2 border-yellow-500/30 rounded-[28px] shadow-[0_0_60px_rgba(234,179,8,0.15)] p-6 md:p-8 animate-scale-up z-10 max-h-[90vh] overflow-y-auto">
          
          {/* Top Sound Indicator Controls */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={toggleMusicMute}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
              title={musicPlaying ? "Mute Ambient Synth" : "Unmute Ambient Synth"}
            >
              {musicPlaying ? <Volume2 className="w-4 h-4 text-yellow-400" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Header Badge */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent px-3 py-1.5 rounded-full border border-yellow-500/20 w-fit mb-4">
            <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
            <span className="text-[10px] font-bold text-yellow-300 uppercase tracking-wider font-mono">
              Specially Calibrated for Sharechat Fighters 🔥
            </span>
          </div>

          {/* Main Welcome Center */}
          <div className="flex flex-col md:flex-row gap-6 items-center mb-6">
            
            {/* Holographic Logo Shield */}
            <div className="relative w-28 h-28 md:w-32 md:h-32 rounded-full p-0.5 bg-gradient-to-tr from-cyan-500 via-yellow-400 to-amber-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] shrink-0 select-none animate-pulse">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500 to-amber-500 opacity-20 blur-md hover:opacity-40 transition-opacity" />
              <div className="w-full h-full rounded-full bg-[#08080a] overflow-hidden flex items-center justify-center border border-white/5 relative">
                <img 
                  src={sakilLogo} 
                  alt="SakiL Khan Pro Logo" 
                  className="w-full h-full object-cover scale-102"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              {/* VIP Badge Overlay */}
              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-500 to-amber-600 border border-yellow-300/40 text-black text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded-md shadow-lg flex items-center gap-0.5">
                <Crown className="w-2.5 h-2.5" />
                <span>VIP</span>
              </div>
            </div>

            <div className="text-center md:text-left flex-1">
              <h2 className="text-xl md:text-2xl font-black bg-gradient-to-r from-yellow-300 via-amber-400 to-red-500 bg-clip-text text-transparent tracking-tight font-sans">
                IT'S SAKIL KHAN 01
              </h2>
              <p className="text-xs text-gray-400 font-mono mt-0.5 leading-relaxed">
                Welcome to SakiL Khan's world! <span className="text-cyan-400 font-bold">World me welcome 🤗</span>. Experience highly immersive premium features, ultra heavy gain boosts, and zero-latency sound monitoring.
              </p>
            </div>
          </div>

          {/* LANGUAGE TRANSLATIONS TABS */}
          <div className="mb-6 bg-black/40 rounded-2xl p-4 border border-white/5">
            {/* Tab Selectors */}
            <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-4 border border-white/5">
              <button
                onClick={() => setActiveTab('bn')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'bn' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                বাংলা (Bengali)
              </button>
              <button
                onClick={() => setActiveTab('hi')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'hi' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                हिंदी (Hindi)
              </button>
              <button
                onClick={() => setActiveTab('en')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'en' ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black shadow-md' : 'text-gray-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            {/* Tab Contents */}
            <div className="min-h-[100px] text-xs text-gray-300 leading-relaxed font-sans">
              {activeTab === 'bn' && (
                <div className="space-y-2 animate-fade-in">
                  <p className="font-bold text-yellow-400 text-sm">🔥 চরম ক্ষমতা সম্পন্ন রিসিভার ও লাইভ স্পাই সাউন্ড</p>
                  <p>
                    সাকিল খানের স্পেশাল এডিশনে স্বাগতম! হেডফোন বা হেডসেট কানেক্ট করে লাইভ সাউন্ড অন করার সাথে সাথেই চরম লেভেলের ক্রিস্টাল ক্লিয়ার এবং লাউড সাউন্ড উপভোগ করতে পারবেন (যেন কান ফেটে যায় এমন তীব্র পাওয়ার!)। এটি বিশেষভাবে তৈরি করা হয়েছে শেয়ারচ্যাট ফাইটারদের জন্য যাতে তারা লাইভ রুমে ও কলিং এ একচ্ছত্র আধিপত্য বজায় রাখতে পারে। কোনো ফালতু ফিচার নেই, শুধুমাত্র রিয়েল আল্ট্রা-বুস্ট এমপ্লিফিকেশন!
                  </p>
                </div>
              )}
              {activeTab === 'hi' && (
                <div className="space-y-2 animate-fade-in">
                  <p className="font-bold text-yellow-400 text-sm">🔥 चरम शक्ति और लाइव स्पाई साउंड बूस्टर</p>
                  <p>
                    साकिल खान के स्पेशल एडिशन में आपका स्वागत है! हेडफ़ोन या हेडसेट कनेक्ट करके लाइव साउंड ऑन करते ही चरम स्तर की क्रिस्टल क्लियर और भारी आवाज़ (इतनी लाउड कि कान फट जाए!) महसूस करें। इसे विशेष रूप से शेयरचैट फाइटर्स के लिए बनाया गया है ताकि वे लाइव रूम और कॉलिंग में तबाही मचा सकें। कोई फालतू कचरा फीचर नहीं, केवल असली हाई-फाई डीएसपी पावर!
                  </p>
                </div>
              )}
              {activeTab === 'en' && (
                <div className="space-y-2 animate-fade-in">
                  <p className="font-bold text-yellow-400 text-sm">🔥 Extreme Live Amplification & Heavy Soundstage</p>
                  <p>
                    Welcome to SakiL Khan's premium environment! Once you connect your headphones or headset and turn on the Live Sound, you will experience an astronomical, crystal-clear, and ultra-loud audio boost (extreme enough to blow your ears!). Specially engineered for Sharechat Fighters to dominate live streams and audio rooms with zero latency. No useless features, just pure acoustic warfare power!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* DYNAMIC ACTIVATION SECTION */}
          <div className={`p-4 rounded-2xl border transition-all mb-6 ${
            isPremium 
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
              : 'bg-black/50 border-white/5'
          }`}>
            {isPremium ? (
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-yellow-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-extrabold text-yellow-400 uppercase tracking-widest">💎 VIP PREMIUM STATUS ACTIVE</p>
                  <p className="text-gray-400 text-[10px] mt-0.5 leading-relaxed">
                    VIP গোল্ডেন থিম, ১২ গুণ পর্যন্ত এক্সট্রিম অডিও বুস্টার এবং ৩ডি কসমিক সাউন্ডস্টেজ সফলভাবে আনলক করা হয়েছে। ধন্যবাদ SakiL Khan VIP Studio ব্যবহার করার জন্য!
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleActivateCodeSubmit} className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-red-500" /> Unlock VIP Premium Feature Suite
                  </span>
                  <span className="text-[9px] font-mono font-bold bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded border border-red-500/20 uppercase tracking-tighter">
                    LOCKED (সীমিত ভার্সন)
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="অ্যাক্টিভেশন পাসওয়ার্ড বা কোড দিন..."
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-[#08080a] border border-white/10 text-white font-mono placeholder-gray-600 outline-none focus:border-yellow-500/30 transition-all text-center"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black text-xs font-black rounded-xl transition-all shadow-[0_4px_15px_rgba(234,179,8,0.3)] active:scale-95 shrink-0"
                  >
                    Unlock VIP
                  </button>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-bold bg-red-950/20 px-2.5 py-1.5 rounded-lg border border-red-500/10">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold bg-green-950/20 px-2.5 py-1.5 rounded-lg border border-green-500/10">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <p className="text-[10px] text-gray-500 leading-relaxed text-center">
                  প্রিমিয়াম কোড বা অ্যাক্টিভেশন পাসওয়ার্ড কেনার জন্য সরাসরি নিচে মেকার <span className="text-yellow-400 font-bold underline">SakiL khan</span> এর সাথে যোগাযোগ করুন!
                </p>
              </form>
            )}
          </div>

          {/* ACTION BUTTONS FOOTER */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/5">
            <a
              href="https://t.me/Sharechat_ns_098"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl transition-all shadow-[0_4px_15px_rgba(6,182,212,0.2)] active:scale-95"
            >
              <Send className="w-4 h-4 text-white animate-bounce" />
              <span>Contact SakiL Khan (Telegram)</span>
            </a>

            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold rounded-xl border border-white/10 transition-all active:scale-95"
            >
              Skip & Continue to App
            </button>
          </div>

          <p className="text-[9px] text-gray-600 text-center mt-4 font-mono uppercase tracking-widest">
            Developed by Sakil Khan © 2026. All rights reserved.
          </p>
        </div>
      )}
    </div>
  );
};
