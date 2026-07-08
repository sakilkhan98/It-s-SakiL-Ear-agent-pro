import React, { useState } from 'react';
import { AudioPreset, ThemeConfig, PRESET_LIST } from '../types';
import { Save, Trash2, Cloud, CloudOff, RefreshCw, AudioLines } from 'lucide-react';

interface PresetsManagerProps {
  currentPreset: AudioPreset;
  customPresets: AudioPreset[];
  theme: ThemeConfig;
  isCloudConnected: boolean;
  onSelectPreset: (preset: AudioPreset) => void;
  onSavePreset: (name: string) => void;
  onDeletePreset: (id: string) => void;
  onForceSync: () => void;
}

export const PresetsManager: React.FC<PresetsManagerProps> = ({
  currentPreset,
  customPresets,
  theme,
  isCloudConnected,
  onSelectPreset,
  onSavePreset,
  onDeletePreset,
  onForceSync,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    setIsSaving(true);
    onSavePreset(newPresetName);
    setNewPresetName('');
    setTimeout(() => setIsSaving(false), 600);
  };

  return (
    <div className={`p-6 rounded-2xl ${theme.bgCard} border border-white/10 shadow-2xl relative`}>
      {/* Sync Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <AudioLines className="w-5 h-5" style={{ color: theme.primary }} />
          <h2 className="font-bold tracking-wide text-sm text-gray-100 uppercase">
            Presets & Cloud Sync
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full ${
            isCloudConnected ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
          }`}>
            {isCloudConnected ? <Cloud className="w-3 h-3" /> : <CloudOff className="w-3 h-3" />}
            {isCloudConnected ? 'Cloud Sync Active' : 'Local Mode'}
          </span>
          <button 
            onClick={onForceSync}
            title="Sync presets and files"
            className="p-1 rounded bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 active:scale-95 transition"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Preset Lists Grid */}
      <div className="space-y-4">
        {/* Built-in Presets */}
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
            Default Spy Modes
          </span>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PRESET_LIST.map((preset) => {
              const isSelected = currentPreset.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => onSelectPreset(preset)}
                  className={`px-3 py-2 text-left rounded-lg text-xs font-medium border transition-all ${
                    isSelected
                      ? `border-white/10 ${theme.glow} text-white`
                      : 'border-white/5 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  style={{
                    backgroundColor: isSelected ? theme.primary : undefined,
                  }}
                >
                  <p className="font-bold tracking-tight truncate">{preset.name}</p>
                  <p className="text-[9px] opacity-80 font-mono mt-0.5">
                    Gain: {preset.gain}x | NC: {preset.noiseCancellation ? 'On' : 'Off'}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Presets Section */}
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-2">
            My Custom Profiles {customPresets.length > 0 && `(${customPresets.length})`}
          </span>

          {customPresets.length === 0 ? (
            <div className="text-center py-4 bg-black/20 rounded-lg border border-dashed border-white/5 text-xs text-gray-500">
              কোন কাস্টম প্রিসেট সেভ করা নেই। নিচে সেভ করুন।
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
              {customPresets.map((preset) => {
                const isSelected = currentPreset.id === preset.id;
                return (
                  <div 
                    key={preset.id}
                    className="group relative flex items-center justify-between rounded-lg border border-white/5 bg-black/25 overflow-hidden"
                  >
                    <button
                      onClick={() => onSelectPreset(preset)}
                      className={`flex-1 px-3 py-2 text-left text-xs font-medium transition-all truncate ${
                        isSelected ? 'text-white' : 'text-gray-300 hover:text-white'
                      }`}
                      style={{
                        backgroundColor: isSelected ? theme.primary : undefined,
                      }}
                    >
                      <p className="font-bold tracking-tight truncate">{preset.name}</p>
                      <p className="text-[9px] opacity-80 font-mono mt-0.5">
                        Gain: {preset.gain}x
                      </p>
                    </button>
                    <button
                      onClick={() => onDeletePreset(preset.id)}
                      className="absolute right-1 opacity-0 group-hover:opacity-100 p-1 rounded bg-red-950/80 text-red-400 hover:text-red-300 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save Current Preset Form */}
        <form onSubmit={handleSave} className="pt-2 border-t border-white/5">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
            সেভ কাস্টম প্রিসেট (বর্তমান টিউনিং)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="যেমন: My Super Spy Room, Clear Voice, ইত্যাদি..."
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-black/40 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-white/30"
            />
            <button
              type="submit"
              disabled={isSaving || !newPresetName.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-black flex items-center gap-1 hover:brightness-110 active:scale-95 transition disabled:opacity-40"
              style={{ backgroundColor: theme.accent }}
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
