import { useState, useEffect, useRef } from 'react';
import { 
  THEMES, 
  ThemeId, 
  ThemeConfig, 
  AudioPreset, 
  DeveloperSettings, 
  PRESET_LIST, 
  DEFAULT_DEV_SETTINGS,
  AudioRoutingMode
} from './types';
import { AudioEngine } from './lib/audioEngine';
import { openDB, saveRecord, getAllRecords, deleteRecord, LocalAudioRecord } from './lib/db';
import { 
  isFirebaseAvailable, 
  syncPresetToCloud, 
  fetchPresetsFromCloud, 
  deletePresetFromCloud,
  fetchRecordingsFromCloud
} from './lib/firebase';
import { Header } from './components/Header';
import { Waveform } from './components/Waveform';
import { EqualizerControls } from './components/EqualizerControls';
import { PresetsManager } from './components/PresetsManager';
import { RecordingsList } from './components/RecordingsList';
import { DeveloperMenu } from './components/DeveloperMenu';
import { PremiumSettingsDrawer } from './components/PremiumSettingsDrawer';
import { 
  Keyboard, 
  VolumeX, 
  ShieldAlert, 
  X, 
  SlidersHorizontal,
  Info,
  Headphones,
  Sparkles,
  HelpCircle,
  FileCheck,
  CloudCheck,
  Send,
  Crown,
  Settings,
  Unlock,
  Lock,
  Sliders,
  Sparkle
} from 'lucide-react';

export default function App() {
  // Appearance & Themes
  const [activeTheme, setActiveTheme] = useState<ThemeConfig>(THEMES['spy-red']);
  
  // Audio Engine Core States
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingElapsed, setRecordingElapsed] = useState(0);
  const [currentPreset, setCurrentPreset] = useState<AudioPreset>(PRESET_LIST[0]);
  const [customPresets, setCustomPresets] = useState<AudioPreset[]>([]);
  const [devSettings, setDevSettings] = useState<DeveloperSettings>(DEFAULT_DEV_SETTINGS);
  
  // Database state
  const [records, setRecords] = useState<LocalAudioRecord[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState(isFirebaseAvailable);
  const [activeInputDeviceId, setActiveInputDeviceId] = useState('default');

  // Premium & Audio Routing States
  const [routingMode, setRoutingMode] = useState<AudioRoutingMode>('headphones');
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [showMoreSettings, setShowMoreSettings] = useState<boolean>(false);
  const [customEncryptionKey, setCustomEncryptionKey] = useState<string>('SakiL_VIP_2026');
  const [haasDelayMs, setHaasDelayMs] = useState<number>(18);
  const [highPassFreq, setHighPassFreq] = useState<number>(80);
  const [soundstageMultiplier, setSoundstageMultiplier] = useState<number>(1.0);

  // Interactive UI Modal triggers
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  // References
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const recordingTimerRef = useRef<number | null>(null);

  // Initialize AudioEngine reference
  if (!audioEngineRef.current) {
    audioEngineRef.current = new AudioEngine(currentPreset, devSettings);
  }

  // Load configuration and data on initial load
  useEffect(() => {
    // 1. Theme configuration and premium configuration
    const savedPremium = localStorage.getItem('ear-agent-premium') === 'true';
    if (savedPremium) {
      setIsPremium(true);
    }
    const savedTheme = localStorage.getItem('ear-agent-theme') as ThemeId;
    if (savedTheme && THEMES[savedTheme]) {
      setActiveTheme(THEMES[savedTheme]);
    } else if (savedPremium) {
      setActiveTheme(THEMES['gold-premium']);
    }

    // 2. Load custom presets from localStorage + Cloud
    const loadPresets = async () => {
      const localPresetsStr = localStorage.getItem('ear-agent-custom-presets');
      let localPresets: AudioPreset[] = localPresetsStr ? JSON.parse(localPresetsStr) : [];
      
      if (isFirebaseAvailable) {
        try {
          const cloudPresets = await fetchPresetsFromCloud();
          // Merge local and cloud presets (by id)
          const mergedMap = new Map<string, AudioPreset>();
          localPresets.forEach(p => mergedMap.set(p.id, p));
          cloudPresets.forEach(p => mergedMap.set(p.id, p));
          const finalPresets = Array.from(mergedMap.values());
          
          setCustomPresets(finalPresets);
          localStorage.setItem('ear-agent-custom-presets', JSON.stringify(finalPresets));
        } catch (err) {
          console.warn("Failed to sync presets from cloud on start:", err);
          setCustomPresets(localPresets);
        }
      } else {
        setCustomPresets(localPresets);
      }
    };

    // 3. Load recorded audio tracks from local IndexedDB
    const loadRecords = async () => {
      try {
        const list = await getAllRecords();
        setRecords(list);
      } catch (e) {
        console.error("Failed to load IndexedDB records:", e);
      }
    };

    loadPresets();
    loadRecords();
  }, []);

  // Sync Audio Engine on preset or development changes
  useEffect(() => {
    if (audioEngineRef.current && isActive) {
      audioEngineRef.current.updatePreset(currentPreset);
    }
  }, [currentPreset, isActive]);

  useEffect(() => {
    if (audioEngineRef.current && isActive) {
      audioEngineRef.current.updateDevSettings(devSettings);
    }
  }, [devSettings, isActive]);

  // Handle Mute changes
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setMute(isMuted);
    }
  }, [isMuted]);

  // Keyboard Shortcuts Subscriber
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid firing if focusing forms
      if (
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLTextAreaElement || 
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        handlePowerToggle();
      } else if (e.key === 'm' || e.key === 'M') {
        handleMuteToggle();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRecordingToggle();
      } else if (e.key === 'n' || e.key === 'N') {
        handleNoiseCancellationToggle();
      } else if (e.key === 'c' || e.key === 'C') {
        setShowShortcuts(prev => !prev);
      } else if (e.key === 'i' || e.key === 'I') {
        setShowAbout(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, isMuted, isRecording, currentPreset, devSettings]);

  // Timer updater during active recording sessions
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = window.setInterval(() => {
        if (audioEngineRef.current) {
          setRecordingElapsed(audioEngineRef.current.getRecordingElapsedSeconds());
        }
      }, 100);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setRecordingElapsed(0);
    }

    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Clean audio engine on component unmount
  useEffect(() => {
    return () => {
      if (audioEngineRef.current) {
        audioEngineRef.current.stop();
      }
    };
  }, []);

  // Power Button Switch Handler
  const handlePowerToggle = async () => {
    if (!audioEngineRef.current) return;

    if (isActive) {
      audioEngineRef.current.stop();
      setIsActive(false);
      setIsRecording(false);
    } else {
      const success = await audioEngineRef.current.start((activeState, error) => {
        setIsActive(activeState);
        if (error) {
          alert(`মাইক্রোফোন চালু করা যায়নি: ${error}\nহেডফোন প্লাগড-ইন এবং ব্রাউজারে মাইক পারমিশন দেয়া আছে কি না চেক করুন।`);
        }
      });
      if (success) {
        setIsActive(true);
        // Start engine with muted listening by default as safety precaution
        setIsMuted(true);
      }
    }
  };

  // Mute Switch Handler
  const handleMuteToggle = () => {
    setIsMuted(prev => !prev);
  };

  // Noise Cancellation toggles
  const handleNoiseCancellationToggle = () => {
    const updated = {
      ...currentPreset,
      noiseCancellation: !currentPreset.noiseCancellation
    };
    setCurrentPreset(updated);
    if (audioEngineRef.current) {
      audioEngineRef.current.updateNoiseCancellation(updated.noiseCancellation);
    }
  };

  // Recording Toggles (Start/Stop)
  const handleRecordingToggle = async () => {
    if (!isActive) {
      alert("রেকর্ড করার জন্য আগে বড় পাওয়ার বোতাম দিয়ে Ear Agent সক্রিয় করুন।");
      return;
    }

    if (!audioEngineRef.current) return;

    if (isRecording) {
      const result = await audioEngineRef.current.stopRecording();
      setIsRecording(false);

      if (result) {
        const timestamp = Date.now();
        const dateStr = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Grab values set in window by RecordingsList prior to stopping, fallback to custom user key
        const shouldEncrypt = (window as any).__lastSaveEncrypt || isPremium || false;
        const passphrase = (window as any).__lastSavePassphrase || customEncryptionKey || '';

        let audioBlob = result.blob;
        let encrypted = false;

        if (shouldEncrypt && passphrase) {
          const { encryptBlob } = await import('./lib/crypto');
          audioBlob = await encryptBlob(result.blob, passphrase);
          encrypted = true;
        }

        const newRecord: LocalAudioRecord = {
          id: `rec_${timestamp}`,
          name: `Tape #${records.length + 1} (${dateStr})`,
          timestamp,
          duration: result.duration,
          presetName: currentPreset.name,
          fileSize: audioBlob.size,
          audioBlob,
          isCloudSynced: false,
          encrypted,
        };

        const saved = await saveRecord(newRecord);
        if (saved) {
          setRecords(prev => [newRecord, ...prev]);
        }
      }
    } else {
      const started = audioEngineRef.current.startRecording();
      if (started) {
        setIsRecording(true);
      }
    }
  };

  // Eq band single change handler
  const handleEqBandChange = (freq: number, val: number) => {
    const updated = { ...currentPreset };
    if (freq === 60) updated.eq60 = val;
    else if (freq === 230) updated.eq230 = val;
    else if (freq === 910) updated.eq910 = val;
    else if (freq === 3600) updated.eq3600 = val;
    else if (freq === 14000) updated.eq14000 = val;
    
    // Select custom template if any changes are made to predefined modes
    if (!updated.isCustom) {
      updated.id = 'custom';
      updated.name = 'Custom Tuning';
      updated.isCustom = true;
    }

    setCurrentPreset(updated);
    if (audioEngineRef.current) {
      audioEngineRef.current.updateEqBand(freq, val);
    }
  };

  // Gain change handler
  const handleGainChange = (val: number) => {
    const updated = { ...currentPreset, gain: val };
    if (!updated.isCustom) {
      updated.id = 'custom';
      updated.name = 'Custom Tuning';
      updated.isCustom = true;
    }
    setCurrentPreset(updated);
    if (audioEngineRef.current) {
      audioEngineRef.current.updateGain(val);
    }
  };

  // Reverb level change handler
  const handleReverbChange = (val: number) => {
    const updated = { ...currentPreset, reverbWet: val };
    if (!updated.isCustom) {
      updated.id = 'custom';
      updated.name = 'Custom Tuning';
      updated.isCustom = true;
    }
    setCurrentPreset(updated);
    if (audioEngineRef.current) {
      audioEngineRef.current.updateReverbWet(val);
    }
  };

  // 3D Haas Stereo toggle handler
  const handleStereoToggle = () => {
    const updated = { ...currentPreset, stereoHaas: !currentPreset.stereoHaas };
    if (!updated.isCustom) {
      updated.id = 'custom';
      updated.name = 'Custom Tuning';
      updated.isCustom = true;
    }
    setCurrentPreset(updated);
    if (audioEngineRef.current) {
      audioEngineRef.current.updateStereoHaas(updated.stereoHaas);
    }
  };

  // Studio Raw Mic High-Fi mode toggle handler
  const handleHighFiToggle = async () => {
    const nextHighFi = !currentPreset.studioHighFi;
    const updated = { ...currentPreset, studioHighFi: nextHighFi };
    if (!updated.isCustom) {
      updated.id = 'custom';
      updated.name = 'Custom Tuning';
      updated.isCustom = true;
    }
    setCurrentPreset(updated);

    // If active, restart the engine stream so the browser's echo cancellation is updated
    if (isActive && audioEngineRef.current) {
      audioEngineRef.current.stop();
      setIsActive(false);

      setTimeout(async () => {
        if (audioEngineRef.current) {
          audioEngineRef.current.updatePreset(updated);
          const success = await audioEngineRef.current.start((activeState) => {
            setIsActive(activeState);
          });
          if (success) {
            setIsActive(true);
            setIsMuted(false); // keep listening active!
          }
        }
      }, 200);
    } else {
      if (audioEngineRef.current) {
        audioEngineRef.current.updatePreset(updated);
      }
    }
  };

  // Preset switch triggers
  const handlePresetSelect = (preset: AudioPreset) => {
    setCurrentPreset(preset);
    if (audioEngineRef.current) {
      audioEngineRef.current.updatePreset(preset);
    }
  };

  // Saving custom presets locally + syncing to cloud
  const handleSavePreset = async (name: string) => {
    const timestamp = Date.now();
    const newPreset: AudioPreset = {
      ...currentPreset,
      id: `preset_${timestamp}`,
      name,
      isCustom: true,
      createdAt: timestamp,
    };

    const list = [...customPresets, newPreset];
    setCustomPresets(list);
    localStorage.setItem('ear-agent-custom-presets', JSON.stringify(list));
    setCurrentPreset(newPreset);

    // Sync to Cloud Firestore in background
    if (isCloudConnected) {
      const synced = await syncPresetToCloud(newPreset);
      if (synced) {
        console.log("Preset synced to cloud successfully!");
      }
    }
  };

  // Deleting custom preset
  const handleDeletePreset = async (id: string) => {
    const filtered = customPresets.filter(p => p.id !== id);
    setCustomPresets(filtered);
    localStorage.setItem('ear-agent-custom-presets', JSON.stringify(filtered));

    if (currentPreset.id === id) {
      setCurrentPreset(PRESET_LIST[0]);
    }

    if (isCloudConnected) {
      await deletePresetFromCloud(id);
    }
  };

  // Deleting audio recording tape
  const handleDeleteRecord = async (id: string) => {
    const confirmed = confirm("আপনি কি নিশ্চিতভাবে এই রেকর্ড করা ফাইলটি মুছে ফেলতে চান?");
    if (!confirmed) return;

    const deleted = await deleteRecord(id);
    if (deleted) {
      setRecords(prev => prev.filter(r => r.id !== id));
      
      if (isCloudConnected) {
        const { deleteRecordingFromCloud } = await import('./lib/firebase');
        await deleteRecordingFromCloud(id);
      }
    }
  };

  // Refresh records list
  const handleRefreshRecords = async () => {
    try {
      const list = await getAllRecords();
      setRecords(list);
    } catch (e) {
      console.error(e);
    }
  };

  // Cloud Import Handler callback
  const handleAddLocalRecord = async (record: LocalAudioRecord) => {
    const saved = await saveRecord(record);
    if (saved) {
      setRecords(prev => [record, ...prev]);
    }
  };

  // Force Cloud backup trigger
  const handleForceSync = async () => {
    if (!isCloudConnected) {
      alert("ফায়ারবেস ক্লাউড কানেক্টেড নেই।");
      return;
    }
    
    // Backup any unsynced custom presets
    try {
      for (const preset of customPresets) {
        await syncPresetToCloud(preset);
      }
      alert("আপনার সকল কাস্টম প্রিসেট সফলভাবে ক্লাউড ডেটাবেজে ব্যাকআপ করা হয়েছে!");
    } catch (err) {
      console.error(err);
      alert("ব্যাকআপ করার সময় ত্রুটি ঘটেছে।");
    }
  };

  // Audio Device input change
  const handleDeviceChange = async (deviceId: string) => {
    setActiveInputDeviceId(deviceId);
    if (isActive && audioEngineRef.current) {
      // Restart engine with new device
      audioEngineRef.current.stop();
      setDevSettings(prev => ({
        ...prev,
        // Trigger clean restart
      }));
      setTimeout(async () => {
        if (audioEngineRef.current) {
          await audioEngineRef.current.start();
        }
      }, 300);
    }
  };

  const handleThemeChange = (themeId: ThemeId) => {
    if (THEMES[themeId]) {
      setActiveTheme(THEMES[themeId]);
      localStorage.setItem('ear-agent-theme', themeId);
    }
  };

  const handleRoutingModeChange = (mode: AudioRoutingMode) => {
    setRoutingMode(mode);
    if (audioEngineRef.current) {
      audioEngineRef.current.updateRoutingMode(mode);
    }
  };

  const handlePremiumToggle = (enabled: boolean) => {
    setIsPremium(enabled);
    localStorage.setItem('ear-agent-premium', enabled ? 'true' : 'false');
    if (enabled) {
      setActiveTheme(THEMES['gold-premium']);
      localStorage.setItem('ear-agent-theme', 'gold-premium');
    } else {
      setActiveTheme(THEMES['spy-red']);
      localStorage.setItem('ear-agent-theme', 'spy-red');
    }
  };

  const handleHaasDelayMsChange = (ms: number) => {
    setHaasDelayMs(ms);
    if (audioEngineRef.current) {
      const seconds = (ms / 1000) * (isPremium ? soundstageMultiplier : 1.0);
      audioEngineRef.current.updateHaasDelayTime(seconds);
    }
  };

  const handleHighPassFreqChange = (hz: number) => {
    setHighPassFreq(hz);
    const updatedSettings = { ...devSettings, highPassFilterFreq: hz };
    setDevSettings(updatedSettings);
    if (audioEngineRef.current) {
      audioEngineRef.current.updateDevSettings(updatedSettings);
    }
  };

  const handleFftSizeChange = (size: number) => {
    const updatedSettings = { ...devSettings, fftSize: size as any };
    setDevSettings(updatedSettings);
    if (audioEngineRef.current) {
      audioEngineRef.current.updateDevSettings(updatedSettings);
    }
  };

  const handleSoundstageMultiplierChange = (multiplier: number) => {
    setSoundstageMultiplier(multiplier);
    if (audioEngineRef.current) {
      const seconds = (haasDelayMs / 1000) * multiplier;
      audioEngineRef.current.updateHaasDelayTime(seconds);
    }
  };

  return (
    <div className={`min-h-screen ${activeTheme.bgDark} ${activeTheme.textPrimary} transition-all duration-300`}>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* PREMIUM BRANDED HEADER */}
        <Header 
          currentTheme={activeTheme}
          onThemeSelect={handleThemeChange}
          routingMode={routingMode}
          onRoutingModeChange={handleRoutingModeChange}
          isPremium={isPremium}
          onShowShortcuts={() => setShowShortcuts(true)}
          onShowAbout={() => setShowAbout(true)}
          onShowMoreSettings={() => setShowMoreSettings(true)}
        />

        {/* FEEDBACK ACOUSTIC DANGER LIGHT BANNER */}
        {isActive && isMuted && (
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200 flex flex-col sm:flex-row items-center justify-between gap-3 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold block">সেফটি মিউট সক্রিয় আছে! (Safety Monitor Muted)</span>
                <p className="opacity-80 mt-0.5">
                  স্পিকার অন থাকলে মাইক্রোফোনে তীব্র বাঁশির মতো শব্দ (Feedback) হতে পারে। শুনতে হেডফোন কানেক্ট করে Volume স্লাইডার বা Mute বাটন অন করুন।
                </p>
              </div>
            </div>
            <button
              onClick={handleMuteToggle}
              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-bold font-mono transition uppercase shrink-0"
            >
              Unmute Listening
            </button>
          </div>
        )}

        {/* INTERACTIVE REAL-TIME WAVEFORM */}
        <Waveform 
          analyser={audioEngineRef.current?.getAnalyser() || null}
          isActive={isActive}
          theme={activeTheme}
          isMuted={isMuted}
        />

        {/* DASHBOARD GRID CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* EQUALIZER, GAIN AND POWER BLOCK */}
          <div className="space-y-6">
            <EqualizerControls 
              preset={currentPreset}
              isActive={isActive}
              isMuted={isMuted}
              theme={activeTheme}
              onPowerToggle={handlePowerToggle}
              onMuteToggle={handleMuteToggle}
              onGainChange={handleGainChange}
              onEqBandChange={handleEqBandChange}
              onReverbChange={handleReverbChange}
              onStereoToggle={handleStereoToggle}
              onHighFiToggle={handleHighFiToggle}
            />
          </div>

          {/* AUDIO TAPE RECORDER & CUSTOM PRESETS */}
          <div className="space-y-6">
            <PresetsManager 
              currentPreset={currentPreset}
              customPresets={customPresets}
              theme={activeTheme}
              isCloudConnected={isCloudConnected}
              onSelectPreset={handlePresetSelect}
              onSavePreset={handleSavePreset}
              onDeletePreset={handleDeletePreset}
              onForceSync={handleForceSync}
            />

            <RecordingsList 
              records={records}
              isRecording={isRecording}
              recordingElapsed={recordingElapsed}
              theme={activeTheme}
              isActive={isActive}
              isCloudConnected={isCloudConnected}
              onStartRecord={handleRecordingToggle}
              onStopRecord={handleRecordingToggle}
              onDeleteRecord={handleDeleteRecord}
              onAddLocalRecord={handleAddLocalRecord}
              onRefreshRecords={handleRefreshRecords}
            />
          </div>

        </div>

        {/* ADVANCED CALIBRATION & HARDWARE SETTINGS */}
        <DeveloperMenu 
          settings={devSettings}
          theme={activeTheme}
          isActive={isActive}
          onSettingsChange={(newSet) => setDevSettings(newSet)}
          onDeviceChange={handleDeviceChange}
        />

        {/* FOOTER */}
        <footer className="text-center text-[10px] text-gray-500 font-mono pt-6 border-t border-white/5 space-y-1">
          <p>EAR AGENT PRO MIC ENGINE • VERSION 4.1.0 • SECURE PROXIED CLIENT</p>
          <p>© 2026 NAINFOMATICS LABS. ALL INTELLECTUAL RIGHTS SECURED.</p>
        </footer>

      </div>

      {/* --- OVERLAYS & MODALS --- */}

      {/* 1. KEYBOARD SHORTCUTS MODAL */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-white/10 p-6 rounded-2xl max-w-sm w-full relative">
            <button 
              onClick={() => setShowShortcuts(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <Keyboard className="w-5 h-5" style={{ color: activeTheme.primary }} />
              <h3 className="font-bold text-gray-100 uppercase tracking-wider text-sm">Keyboard Shortcuts</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-gray-400">Toggle Power Switch</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-gray-200">Space</kbd>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-gray-400">Mute/Unmute Speakers</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-gray-200">M</kbd>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-gray-400">Start/Stop Recorder</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-gray-200">R</kbd>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-gray-400">Toggle Noise Filter</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-gray-200">N</kbd>
              </div>
              <div className="flex justify-between items-center bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <span className="text-gray-400">Toggle Shortcuts Panel</span>
                <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-gray-200">C</kbd>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-500 mt-4 text-center leading-relaxed">
              * শর্টকাটগুলো দিয়ে কিবোর্ড ব্যবহার করে অতি দ্রুত স্পাই ডিভাইস অপারেট করা যায়।
            </p>
          </div>
        </div>
      )}

      {/* 2. ABOUT & GUIDES MODAL */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1c1c1e] border border-white/10 p-6 rounded-2xl max-w-md w-full relative max-h-[85vh] overflow-y-auto">
            <button 
              onClick={() => setShowAbout(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 animate-pulse" style={{ color: activeTheme.primary }} />
              <h3 className="font-bold text-gray-100 uppercase tracking-wider text-sm">Ear Agent PRO - নির্দেশিকা</h3>
            </div>

            <div className="space-y-4 text-xs text-gray-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-white mb-1">👂 এই অ্যাপটি কীভাবে কাজ করে?</h4>
                <p className="text-gray-400">
                  এটি একটি রিয়েল-টাইম অডিও অ্যামপ্লিফায়ার ও লিসেনিং ডিভাইস। এটি আপনার মাইক্রোফোন থেকে সাউন্ড ক্যাপচার করে তাতে অ্যাডভান্সড DSP (Digital Signal Processing) ফিল্টার অ্যাপ্লাই করে এবং হাই-কোয়ালিটি ভয়েস আউটপুট প্রদান করে।
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">🛡️ অ্যাডভান্সড ফিচারসমূহ:</h4>
                <ul className="list-disc pl-4 space-y-1 text-gray-400">
                  <li><strong>Noise Gate & Filter:</strong> চারপাশের অতিরিক্ত ফ্যান বা বাতাসের শোঁ শোঁ শব্দ দূর করে।</li>
                  <li><strong>5-Band Equalizer:</strong> নির্দিষ্ট ফ্রিকোয়েন্সির শব্দ বাড়াতে বা কমাতে সাহায্য করে (যেমন কম শব্দের ফিসফিসানি বুস্ট করা)।</li>
                  <li><strong>Symmetric Encryption (RC4):</strong> গোপনীয় অডিও ফাইলগুলো পাসওয়ার্ড দিয়ে এনক্রিপ্ট করার সুবিধা, যাতে পাসওয়ার্ড ছাড়া অন্য কেউ শুনতে না পারে।</li>
                  <li><strong>Firebase Cloud Sync & Collaboration:</strong> যেকোনো ফাইল ক্লাউড সার্ভারে সিঙ্ক করে ৬ সংখ্যার কোড দিয়ে অন্য যেকোনো ডিভাইসের সাথে শেয়ার করা যায়।</li>
                </ul>
              </div>

              <div className="bg-amber-950/20 border border-amber-500/20 p-2.5 rounded-lg text-amber-300 text-[11px]">
                <strong>⚠️ গুরুত্বপূর্ণ সতর্কতা (Acoustic Feedback):</strong><br />
                অ্যাপটি চালু করার আগে অবশ্যই আপনার মোবাইলে বা কম্পিউটারে হেডফোন (Wired বা Bluetooth) কানেক্ট করে নিবেন। হেডফোন ছাড়া স্পিকার অন থাকলে মাইক্রোফোন ও স্পিকারের মাঝে লুপ তৈরি হয়ে বিকট হুইসেল সাউন্ড হতে পারে।
              </div>
            </div>

            <button
              onClick={() => setShowAbout(false)}
              className="w-full mt-5 py-2 rounded-xl text-xs font-bold text-black transition hover:brightness-110"
              style={{ backgroundColor: activeTheme.accent }}
            >
              আমি বুজেছি, ধন্যবাদ!
            </button>
          </div>
        </div>
      )}

      {/* 3. PREMIUM ADVANCED SETTINGS SIDE DRAWER */}
      <PremiumSettingsDrawer
        isOpen={showMoreSettings}
        onClose={() => setShowMoreSettings(false)}
        theme={activeTheme}
        isPremium={isPremium}
        onPremiumToggle={handlePremiumToggle}
        haasDelayMs={haasDelayMs}
        onHaasDelayMsChange={handleHaasDelayMsChange}
        highPassFreq={highPassFreq}
        onHighPassFreqChange={handleHighPassFreqChange}
        fftSize={devSettings.fftSize}
        onFftSizeChange={handleFftSizeChange}
        encryptionKey={customEncryptionKey}
        onEncryptionKeyChange={setCustomEncryptionKey}
        soundstageMultiplier={soundstageMultiplier}
        onSoundstageMultiplierChange={handleSoundstageMultiplierChange}
      />

    </div>
  );
}
