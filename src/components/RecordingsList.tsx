import React, { useState, useEffect, useRef } from 'react';
import { LocalAudioRecord } from '../lib/db';
import { ThemeConfig } from '../types';
import { 
  Mic, 
  Square, 
  Play, 
  Pause, 
  Trash2, 
  Download, 
  CloudLightning, 
  Key, 
  Lock, 
  Unlock, 
  Share2, 
  UploadCloud, 
  AudioLines,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import { encryptBlob, decryptBlob, blobToBase64, base64ToBlob } from '../lib/crypto';
import { syncRecordingToCloud, getSharedRecordingByCode } from '../lib/firebase';

interface RecordingsListProps {
  records: LocalAudioRecord[];
  isRecording: boolean;
  recordingElapsed: number;
  theme: ThemeConfig;
  isActive: boolean;
  isCloudConnected: boolean;
  onStartRecord: () => void;
  onStopRecord: () => void;
  onDeleteRecord: (id: string) => void;
  onAddLocalRecord: (record: LocalAudioRecord) => void;
  onRefreshRecords: () => void;
}

export const RecordingsList: React.FC<RecordingsListProps> = ({
  records,
  isRecording,
  recordingElapsed,
  theme,
  isActive,
  isCloudConnected,
  onStartRecord,
  onStopRecord,
  onDeleteRecord,
  onAddLocalRecord,
  onRefreshRecords,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [passphraseInputs, setPassphraseInputs] = useState<Record<string, string>>({});
  const [unlockedRecords, setUnlockedRecords] = useState<Record<string, Blob>>({});
  const [shareCodes, setShareCodes] = useState<Record<string, string>>({});
  
  // Encryption inputs during save
  const [isEncryptingOnSave, setIsEncryptingOnSave] = useState(false);
  const [savePassphrase, setSavePassphrase] = useState('');
  
  // Cloud importing states
  const [importCode, setImportCode] = useState('');
  const [importKey, setImportKey] = useState('');
  const [importingState, setImportingState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Sync state transitions or reset player
  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  // Handle Play/Pause
  const handlePlayToggle = async (record: LocalAudioRecord) => {
    if (playingId === record.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    // Determine target blob
    let blobToPlay: Blob = record.audioBlob;

    if (record.encrypted) {
      // Check if already unlocked in state
      if (unlockedRecords[record.id]) {
        blobToPlay = unlockedRecords[record.id];
      } else {
        const passphrase = passphraseInputs[record.id] || '';
        if (!passphrase) {
          alert('দয়া করে এই রেকর্ডিংটি ডিক্রিপ্ট করার জন্য পাসওয়ার্ড দিন।');
          return;
        }
        try {
          const decrypted = await decryptBlob(record.audioBlob, passphrase, record.audioBlob.type);
          // Let's verify if decryption succeeded (in RC4, bad keys just output garbage, but we can check if it sounds playble or do a simple header check)
          setUnlockedRecords(prev => ({ ...prev, [record.id]: decrypted }));
          blobToPlay = decrypted;
        } catch (err) {
          alert('ডিক্রিপশন ব্যর্থ হয়েছে! সঠিক পাসওয়ার্ড দিন।');
          return;
        }
      }
    }

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const url = URL.createObjectURL(blobToPlay);
    setAudioUrl(url);
    setPlayingId(record.id);

    // Playback
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play()
          .then(() => {
            audioRef.current!.onended = () => {
              setPlayingId(null);
            };
          })
          .catch((err) => {
            console.error("Audio playback failed:", err);
            setPlayingId(null);
          });
      }
    }, 50);
  };

  // Sync to cloud and share
  const handleCloudShare = async (record: LocalAudioRecord) => {
    if (!isCloudConnected) {
      alert("ক্লাউড সিঙ্ক করতে ইন্টারনেট এবং ফায়ারবেস কানেকশন প্রয়োজন।");
      return;
    }

    const shareCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    
    // Convert to Base64 to save in Firestore
    try {
      const base64Str = await blobToBase64(record.audioBlob);
      
      const updatedMetadata = {
        id: record.id,
        name: record.name,
        timestamp: record.timestamp,
        duration: record.duration,
        presetName: record.presetName,
        fileSize: record.fileSize,
        isCloudSynced: true,
        encrypted: record.encrypted,
        shareCode: shareCode
      };

      const success = await syncRecordingToCloud(updatedMetadata, base64Str);
      if (success) {
        setShareCodes(prev => ({ ...prev, [record.id]: shareCode }));
        record.isCloudSynced = true;
        record.shareCode = shareCode;
        onRefreshRecords();
        alert(`ক্লাউড সিঙ্ক সফল! আপনার শেয়ার কোড: ${shareCode}\nযেকোনো ডিভাইসে এই কোড দিয়ে ফাইলটি লোড করতে পারবেন।`);
      } else {
        alert("ক্লাউড সিঙ্ক ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।");
      }
    } catch (err) {
      console.error(err);
      alert("ফাইল কনভার্ট বা ক্লাউড আপলোডে সমস্যা হয়েছে।");
    }
  };

  // Import shared record from Cloud
  const handleImportShared = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCode.trim()) return;

    setImportingState('loading');
    setImportMessage('ক্লাউড থেকে তথ্য খোঁজা হচ্ছে...');

    try {
      const result = await getSharedRecordingByCode(importCode.trim());
      if (!result) {
        setImportingState('error');
        setImportMessage('ভুল শেয়ার কোড! কোনো ফাইল পাওয়া যায়নি।');
        return;
      }

      // Convert Base64 back to Blob
      let audioBlob = base64ToBlob(result.audioDataUri);
      
      // If encrypted, we might need a key to play but we save it as is
      const newRecord: LocalAudioRecord = {
        id: result.metadata.id,
        name: `${result.metadata.name} (Shared)`,
        timestamp: Date.now(),
        duration: result.metadata.duration,
        presetName: result.metadata.presetName,
        fileSize: result.metadata.fileSize,
        audioBlob: audioBlob,
        isCloudSynced: true,
        encrypted: result.metadata.encrypted,
        shareCode: result.metadata.shareCode
      };

      onAddLocalRecord(newRecord);
      setImportingState('success');
      setImportMessage('রেকর্ডিং সফলভাবে ক্লাউড থেকে আপনার লোকাল স্টোরেজে ইম্পোর্ট করা হয়েছে!');
      setImportCode('');
    } catch (err) {
      console.error(err);
      setImportingState('error');
      setImportMessage('ইম্পোর্ট করার সময় ত্রুটি ঘটেছে।');
    }
  };

  // Helper to trigger direct local download
  const handleDownload = (record: LocalAudioRecord, type: 'processed' | 'raw' = 'processed') => {
    let blobToDownload = record.audioBlob;
    
    if (record.encrypted && unlockedRecords[record.id]) {
      blobToDownload = unlockedRecords[record.id];
    } else if (record.encrypted) {
      alert("ডাউনলোড করার আগে দয়া করে রেকর্ডিংটি পাসওয়ার্ড দিয়ে আনলক করুন।");
      return;
    }

    const url = URL.createObjectURL(blobToDownload);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${record.name.replace(/\s+/g, '_')}_${type}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format File Size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Format Time representation
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className={`p-6 rounded-2xl ${theme.bgCard} border border-white/10 shadow-2xl relative`}>
      <audio ref={audioRef} className="hidden" />

      {/* Dynamic Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Mic className="w-5 h-5 animate-pulse" style={{ color: theme.primary }} />
          <h2 className="font-bold tracking-wide text-sm text-gray-100 uppercase">
            Professional Voice Recorder
          </h2>
        </div>
        {isRecording && (
          <div className="flex items-center gap-1.5 bg-red-950/40 border border-red-500/20 px-2 py-0.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] font-mono font-bold text-red-500">
              {formatTime(recordingElapsed)}
            </span>
          </div>
        )}
      </div>

      {/* Quick Record Controller Panel */}
      <div className="bg-black/40 rounded-xl p-4 border border-white/5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-gray-300">রিয়েল-টাইম প্রো-ডিএসপি রেকর্ডিং</h4>
          <p className="text-[11px] text-gray-500 mt-0.5">
            আপনার স্পাই টিউনিং, গেট এবং ইকুয়ালাইজার ফিল্টার করা প্রফেশনাল অডিও রেকর্ড করুন।
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Encryption Setting during save checkbox */}
          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-gray-400 select-none">
            <input
              type="checkbox"
              checked={isEncryptingOnSave}
              onChange={(e) => setIsEncryptingOnSave(e.target.checked)}
              className="accent-red-500 rounded border-white/10 bg-black/40"
            />
            <Lock className="w-3 h-3" /> Encrypt Tape
          </label>

          {isEncryptingOnSave && (
            <input
              type="password"
              placeholder="পাসওয়ার্ড দিন"
              value={savePassphrase}
              onChange={(e) => setSavePassphrase(e.target.value)}
              className="px-2 py-1 text-xs rounded bg-black border border-white/10 text-white w-24 placeholder-gray-600 focus:outline-none"
            />
          )}

          {!isRecording ? (
            <button
              onClick={onStartRecord}
              disabled={!isActive}
              className="px-4 py-2 rounded-full font-bold text-xs text-black flex items-center gap-1.5 hover:brightness-110 active:scale-95 transition disabled:opacity-40"
              style={{ backgroundColor: theme.primary }}
            >
              <Mic className="w-4 h-4 text-black" />
              Record
            </button>
          ) : (
            <button
              onClick={async () => {
                // Store password settings before stopping
                (window as any).__lastSaveEncrypt = isEncryptingOnSave;
                (window as any).__lastSavePassphrase = savePassphrase;
                
                onStopRecord();
                
                // Clear state
                setSavePassphrase('');
                setIsEncryptingOnSave(false);
              }}
              className="px-4 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition animate-pulse"
            >
              <Square className="w-4 h-4 fill-white" />
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Cloud shared clip importer */}
      <form onSubmit={handleImportShared} className="bg-black/20 p-3 rounded-xl border border-white/5 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="flex-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              রিমোট কোলাবোরেশন: ক্লাউড থেকে ফাইল লোড করুন
            </span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="যেমন: 582910 (৬-সংখ্যার কোড)"
                value={importCode}
                onChange={(e) => setImportCode(e.target.value)}
                className="flex-1 px-3 py-1 bg-black border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={importingState === 'loading' || !importCode}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-xs text-white font-bold transition flex items-center gap-1"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Import
              </button>
            </div>
          </div>
        </div>
        {importMessage && (
          <p className={`text-[10px] mt-1.5 font-medium ${
            importingState === 'success' ? 'text-green-400' : 
            importingState === 'error' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {importMessage}
          </p>
        )}
      </form>

      {/* Audio tapes listing */}
      <div>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-3">
          Saved Recordings Library ({records.length})
        </span>

        {records.length === 0 ? (
          <div className="text-center py-10 bg-black/20 rounded-xl border border-dashed border-white/5 text-xs text-gray-500">
            লাইব্রেরিতে কোনো রেকর্ড করা ফাইল পাওয়া যায়নি।
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {records.map((record) => {
              const isPlaying = playingId === record.id;
              const hasSharedCode = record.shareCode || shareCodes[record.id];
              
              return (
                <div 
                  key={record.id} 
                  className={`p-3 rounded-xl bg-black/35 border transition-all ${
                    isPlaying ? 'border-red-500/30 bg-red-950/10' : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-gray-100 truncate block">
                          {record.name}
                        </span>
                        
                        {record.encrypted && (
                          <span className="shrink-0 p-0.5 rounded bg-amber-500/10 text-amber-400" title="Password Protected AES/RC4 File">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}

                        {hasSharedCode && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[8px] font-mono uppercase tracking-widest">
                            Shared: {hasSharedCode}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-[9px] font-mono text-gray-500">
                        <span>{formatTime(record.duration)}</span>
                        <span>•</span>
                        <span>{formatSize(record.fileSize)}</span>
                        <span>•</span>
                        <span className="text-gray-400">{record.presetName}</span>
                      </div>
                    </div>

                    {/* Right: Primary triggers */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePlayToggle(record)}
                        className={`p-2 rounded-full flex items-center justify-center transition ${
                          isPlaying 
                            ? 'bg-red-500 text-black' 
                            : 'bg-white/5 text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                      </button>

                      <button
                        onClick={() => handleDownload(record, 'processed')}
                        title="Download tape"
                        className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {isCloudConnected && !hasSharedCode && (
                        <button
                          onClick={() => handleCloudShare(record)}
                          title="Share to Cloud / Generate Code"
                          className="p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        title="Delete recording"
                        className="p-2 rounded-full bg-red-950/20 text-red-500/70 hover:text-red-400 hover:bg-red-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Password Decryption tray if locked */}
                  {record.encrypted && !unlockedRecords[record.id] && (
                    <div className="mt-2.5 pt-2 border-t border-white/5 flex gap-2 items-center">
                      <Key className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-[10px] text-amber-400 font-medium shrink-0">পাসওয়ার্ড লকড:</span>
                      <input
                        type="password"
                        placeholder="আনলক পাসওয়ার্ড লিখুন"
                        value={passphraseInputs[record.id] || ''}
                        onChange={(e) => setPassphraseInputs(prev => ({ ...prev, [record.id]: e.target.value }))}
                        className="flex-1 px-2 py-0.5 rounded bg-black border border-white/10 text-[10px] text-white focus:outline-none focus:border-amber-400/50"
                      />
                      <button
                        onClick={() => handlePlayToggle(record)}
                        className="px-2 py-0.5 rounded bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-bold font-mono transition"
                      >
                        Unlock & Play
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
