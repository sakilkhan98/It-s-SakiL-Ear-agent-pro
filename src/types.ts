export type ThemeId = 'spy-red' | 'cyber-green' | 'neon-blue' | 'gold-premium' | 'carbon-white';

export type AudioRoutingMode = 'headphones' | 'bluetooth' | 'receiver' | 'speaker';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  primary: string;
  primaryLight: string;
  accent: string;
  bgDark: string;
  bgCard: string;
  textPrimary: string;
  textSecondary: string;
  glow: string;
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  'spy-red': {
    id: 'spy-red',
    name: 'Classic Spy Red',
    primary: 'rgb(239, 68, 68)', // red-500
    primaryLight: 'rgba(239, 68, 68, 0.2)',
    accent: 'rgb(248, 113, 113)',
    bgDark: 'bg-[#121212]',
    bgCard: 'bg-[#1c1c1e]',
    textPrimary: 'text-gray-100',
    textSecondary: 'text-gray-400',
    glow: 'shadow-[0_0_15px_rgba(239,68,68,0.5)]',
  },
  'cyber-green': {
    id: 'cyber-green',
    name: 'Cyberpunk Green',
    primary: 'rgb(34, 197, 94)', // green-500
    primaryLight: 'rgba(34, 197, 94, 0.2)',
    accent: 'rgb(74, 222, 128)',
    bgDark: 'bg-[#0a0f0d]',
    bgCard: 'bg-[#111c17]',
    textPrimary: 'text-green-50',
    textSecondary: 'text-green-400/80',
    glow: 'shadow-[0_0_15px_rgba(34,197,94,0.5)]',
  },
  'neon-blue': {
    id: 'neon-blue',
    name: 'Deep Neon Blue',
    primary: 'rgb(59, 130, 246)', // blue-500
    primaryLight: 'rgba(59, 130, 246, 0.2)',
    accent: 'rgb(96, 165, 250)',
    bgDark: 'bg-[#0b132b]',
    bgCard: 'bg-[#1c2541]',
    textPrimary: 'text-blue-50',
    textSecondary: 'text-blue-300',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
  },
  'gold-premium': {
    id: 'gold-premium',
    name: 'Gold Premium',
    primary: 'rgb(234, 179, 8)', // yellow-500
    primaryLight: 'rgba(234, 179, 8, 0.2)',
    accent: 'rgb(250, 204, 21)',
    bgDark: 'bg-[#13110c]',
    bgCard: 'bg-[#221e14]',
    textPrimary: 'text-amber-50',
    textSecondary: 'text-amber-400/80',
    glow: 'shadow-[0_0_15px_rgba(234,179,8,0.5)]',
  },
  'carbon-white': {
    id: 'carbon-white',
    name: 'Carbon Silver',
    primary: 'rgb(226, 232, 240)', // slate-200
    primaryLight: 'rgba(255, 255, 255, 0.1)',
    accent: 'rgb(148, 163, 184)',
    bgDark: 'bg-[#0f172a]',
    bgCard: 'bg-[#1e293b]',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-400',
    glow: 'shadow-[0_0_15px_rgba(255,255,255,0.2)]',
  },
};

export interface AudioPreset {
  id: string;
  name: string;
  isCustom: boolean;
  gain: number; // Volume multiplier (1.0x - 5.0x)
  eq60: number;  // gain in dB (-12 to +12)
  eq230: number; // gain in dB (-12 to +12)
  eq910: number; // gain in dB (-12 to +12)
  eq3600: number; // gain in dB (-12 to +12)
  eq14000: number; // gain in dB (-12 to +12)
  noiseCancellation: boolean;
  noiseGateThreshold: number; // in dB (-100 to -20)
  compressorEnabled: boolean;
  reverbWet?: number; // 0 to 1 (reverb dry/wet mix)
  stereoHaas?: boolean; // Haas effect stereo width toggle
  studioHighFi?: boolean; // raw uncompressed 48khz audio toggle
  createdBy?: string;
  createdAt?: number;
}

export interface RecordingMetadata {
  id: string;
  name: string;
  timestamp: number;
  duration: number; // in seconds
  presetName: string;
  fileSize: number; // in bytes
  isCloudSynced: boolean;
  encrypted: boolean;
  shareCode?: string;
}

export interface DeveloperSettings {
  latencyHint: 'interactive' | 'balanced' | 'playback';
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  fftSize: 32 | 64 | 128 | 256 | 512 | 1024 | 2048 | 4096;
  compressorRatio: number; // 1 to 20
  compressorAttack: number; // 0 to 1 sec
  compressorRelease: number; // 0 to 1 sec
  highPassFilterFreq: number; // 0 to 300Hz
}

export const DEFAULT_DEV_SETTINGS: DeveloperSettings = {
  latencyHint: 'interactive',
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: false,
  fftSize: 512,
  compressorRatio: 4,
  compressorAttack: 0.003,
  compressorRelease: 0.25,
  highPassFilterFreq: 80, // Default filter to cut rumble noise
};

export const PRESET_LIST: AudioPreset[] = [
  {
    id: 'studio-pro',
    name: 'Studio Pro Live (Headphones)',
    isCustom: false,
    gain: 1.6,
    eq60: 3,
    eq230: 1,
    eq910: -1,
    eq3600: 6,
    eq14000: 8,
    noiseCancellation: true,
    noiseGateThreshold: -55,
    compressorEnabled: true,
    reverbWet: 0.12,
    stereoHaas: true,
    studioHighFi: true,
  },
  {
    id: 'default',
    name: 'Normal Ear Agent',
    isCustom: false,
    gain: 1.0,
    eq60: 0,
    eq230: 0,
    eq910: 0,
    eq3600: 0,
    eq14000: 0,
    noiseCancellation: true,
    noiseGateThreshold: -60,
    compressorEnabled: true,
    reverbWet: 0.0,
    stereoHaas: false,
    studioHighFi: false,
  },
  {
    id: 'spy-whisper',
    name: 'Spy Whisper Booster',
    isCustom: false,
    gain: 2.5,
    eq60: -6,
    eq230: -2,
    eq910: 4,
    eq3600: 8,
    eq14000: 4,
    noiseCancellation: true,
    noiseGateThreshold: -50,
    compressorEnabled: true,
    reverbWet: 0.05,
    stereoHaas: true,
    studioHighFi: false,
  },
  {
    id: '3d-cinema',
    name: '3D Immersive Room',
    isCustom: false,
    gain: 1.3,
    eq60: 6,
    eq230: 4,
    eq910: -2,
    eq3600: 3,
    eq14000: 5,
    noiseCancellation: true,
    noiseGateThreshold: -62,
    compressorEnabled: true,
    reverbWet: 0.28,
    stereoHaas: true,
    studioHighFi: true,
  },
  {
    id: 'noise-killer',
    name: 'Extreme Noise Killer',
    isCustom: false,
    gain: 1.5,
    eq60: -12,
    eq230: -6,
    eq910: 0,
    eq3600: 6,
    eq14000: -4,
    noiseCancellation: true,
    noiseGateThreshold: -40,
    compressorEnabled: true,
    reverbWet: 0.0,
    stereoHaas: false,
    studioHighFi: false,
  },
  {
    id: 'super-bass',
    name: 'Super Bass Booster',
    isCustom: false,
    gain: 1.2,
    eq60: 10,
    eq230: 6,
    eq910: -2,
    eq3600: -4,
    eq14000: -6,
    noiseCancellation: false,
    noiseGateThreshold: -70,
    compressorEnabled: false,
    reverbWet: 0.08,
    stereoHaas: true,
    studioHighFi: false,
  }
];
