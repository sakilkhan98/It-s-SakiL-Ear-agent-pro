import React, { useEffect, useState } from 'react';
import { DeveloperSettings, ThemeConfig } from '../types';
import { Settings, Sliders, ShieldCheck, Info, Cpu } from 'lucide-react';

interface DeveloperMenuProps {
  settings: DeveloperSettings;
  theme: ThemeConfig;
  isActive: boolean;
  onSettingsChange: (settings: DeveloperSettings) => void;
  onDeviceChange: (deviceId: string) => void;
}

export const DeveloperMenu: React.FC<DeveloperMenuProps> = ({
  settings,
  theme,
  isActive,
  onSettingsChange,
  onDeviceChange,
}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('default');
  const [sampleRate, setSampleRate] = useState<number>(48000);

  // Load available audio input devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        const list = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = list.filter(device => device.kind === 'audioinput');
        setDevices(audioInputs);
      } catch (err) {
        console.warn("Failed to list audio devices:", err);
      }
    };

    getDevices();
    // Add event listener for device changes
    navigator.mediaDevices.addEventListener('devicechange', getDevices);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getDevices);
    };
  }, []);

  // Set simulated sample rate based on active audio context or default
  useEffect(() => {
    if (isActive && (window as any).AudioContext) {
      try {
        const mockCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setSampleRate(mockCtx.sampleRate);
        mockCtx.close();
      } catch (e) {}
    }
  }, [isActive]);

  const handleDeviceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedDeviceId(id);
    onDeviceChange(id);
  };

  const updateSetting = <K extends keyof DeveloperSettings>(key: K, value: DeveloperSettings[K]) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className={`p-6 rounded-2xl ${theme.bgCard} border border-white/10 shadow-2xl relative`}>
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-4 mb-4">
        <Cpu className="w-5 h-5" style={{ color: theme.primary }} />
        <h2 className="font-bold tracking-wide text-sm text-gray-100 uppercase">
          Developer Calibration & Diagnostics
        </h2>
      </div>

      {/* Input Source Selector - matching the top dropdown in the user screenshot */}
      <div className="mb-6">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
          Active Mic Source / Input Device
        </label>
        <select
          value={selectedDeviceId}
          onChange={handleDeviceSelect}
          className="w-full text-xs px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-white outline-none focus:border-white/30"
        >
          {devices.length === 0 ? (
            <>
              <option value="default">Default Mic (Wired / Internal)</option>
              <option value="bluetooth">Bluetooth Headset Mic (Auto-detect)</option>
            </>
          ) : (
            devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microphone ${device.deviceId.slice(0, 5)}`}
              </option>
            ))
          )}
        </select>
        <span className="text-[9px] text-gray-500 mt-1 block">
          * হেডফোন বা ব্লুটুথ কানেক্ট করলে রিয়েল-টাইম লো-ল্যাটেন্সি মোড স্বয়ংক্রিয়ভাবে সক্রিয় হবে।
        </span>
      </div>

      {/* Grid for parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Hardware & Stream settings */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block border-b border-white/5 pb-1">
            Hardware & DSP Hardware Filters
          </span>

          {/* High pass filter */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Low-Cut / Highpass Filter:</span>
              <span className="font-mono text-gray-200">{settings.highPassFilterFreq} Hz</span>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              step="10"
              value={settings.highPassFilterFreq}
              onChange={(e) => updateSetting('highPassFilterFreq', parseInt(e.target.value))}
              className="w-full accent-red-500 cursor-pointer h-1 bg-black rounded"
            />
          </div>

          {/* FFT Buffer Size */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-400">FFT Buffer / Window Size:</span>
            <select
              value={settings.fftSize}
              onChange={(e) => updateSetting('fftSize', parseInt(e.target.value) as any)}
              className="bg-black border border-white/10 rounded px-2 py-0.5 text-xs text-white"
            >
              <option value="256">256 (Ultra Low Latency)</option>
              <option value="512">512 (Recommended)</option>
              <option value="1024">1024 (High Quality)</option>
              <option value="2048">2048 (Studio Master)</option>
            </select>
          </div>

          {/* Native hardware options */}
          <div className="space-y-2 pt-1 text-xs text-gray-400">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.echoCancellation}
                onChange={(e) => updateSetting('echoCancellation', e.target.checked)}
                className="accent-red-500 rounded border-white/10 bg-black/40"
              />
              Hardware Echo Cancellation
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.noiseSuppression}
                onChange={(e) => updateSetting('noiseSuppression', e.target.checked)}
                className="accent-red-500 rounded border-white/10 bg-black/40"
              />
              Hardware Noise Suppression
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoGainControl}
                onChange={(e) => updateSetting('autoGainControl', e.target.checked)}
                className="accent-red-500 rounded border-white/10 bg-black/40"
              />
              Hardware Auto Gain Control
            </label>
          </div>
        </div>

        {/* Studio Compressor calibration */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block border-b border-white/5 pb-1">
            Whisper Compressor Calibration
          </span>

          {/* Compressor Ratio */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Ratio (Squeeze Strength):</span>
              <span className="font-mono text-gray-200">{settings.compressorRatio}:1</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              step="1"
              value={settings.compressorRatio}
              onChange={(e) => updateSetting('compressorRatio', parseInt(e.target.value))}
              className="w-full accent-red-500 cursor-pointer h-1 bg-black rounded"
            />
          </div>

          {/* Compressor Attack */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Attack Time (Gate Speed):</span>
              <span className="font-mono text-gray-200">{(settings.compressorAttack * 1000).toFixed(0)} ms</span>
            </div>
            <input
              type="range"
              min="0.001"
              max="0.1"
              step="0.002"
              value={settings.compressorAttack}
              onChange={(e) => updateSetting('compressorAttack', parseFloat(e.target.value))}
              className="w-full accent-red-500 cursor-pointer h-1 bg-black rounded"
            />
          </div>

          {/* Compressor Release */}
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Release Time (Hold Speed):</span>
              <span className="font-mono text-gray-200">{(settings.compressorRelease * 1000).toFixed(0)} ms</span>
            </div>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.05"
              value={settings.compressorRelease}
              onChange={(e) => updateSetting('compressorRelease', parseFloat(e.target.value))}
              className="w-full accent-red-500 cursor-pointer h-1 bg-black rounded"
            />
          </div>
        </div>

      </div>

      {/* Diagnostics Readout Tray */}
      <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-3 bg-black/30 p-3 rounded-xl border border-white/5">
        <div>
          <span className="text-[9px] text-gray-500 uppercase block">Sample Rate</span>
          <span className="text-xs font-mono font-bold text-gray-300">{sampleRate} Hz</span>
        </div>
        <div>
          <span className="text-[9px] text-gray-500 uppercase block">Audio Latency Mode</span>
          <span className="text-xs font-mono font-bold text-gray-300 capitalize">{settings.latencyHint}</span>
        </div>
        <div>
          <span className="text-[9px] text-gray-500 uppercase block">Audio Driver Channel</span>
          <span className="text-xs font-mono font-bold text-gray-300">Mono Input</span>
        </div>
        <div>
          <span className="text-[9px] text-gray-500 uppercase block">System Performance</span>
          <span className="text-xs font-mono font-bold text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
            Stable
          </span>
        </div>
      </div>
    </div>
  );
};
