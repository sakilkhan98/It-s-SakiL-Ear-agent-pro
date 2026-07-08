import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  orderBy,
  where
} from 'firebase/firestore';
import { AudioPreset, RecordingMetadata } from '../types';

// Real Firebase credentials from firebase-applet-config.json
const firebaseConfig = {
  apiKey: "AIzaSyCXa3Ie6L9Xm2JLcqdppTXAM-Xw45acg-k",
  authDomain: "linen-setting-gjkt0.firebaseapp.com",
  projectId: "linen-setting-gjkt0",
  storageBucket: "linen-setting-gjkt0.firebasestorage.app",
  messagingSenderId: "647940891665",
  appId: "1:647940891665:web:1a58fd90cb628a0dc3fdb0"
};

const databaseId = "ai-studio-5af259f8-c20c-4d30-9aa8-88a6f922386f";

// Initialize Firebase
let app;
let db: any = null;
let isFirebaseAvailable = false;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  // Initialize firestore with the custom databaseId provided in our config
  db = getFirestore(app, databaseId);
  isFirebaseAvailable = true;
  console.log("Firebase initialized successfully with DB:", databaseId);
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { db, isFirebaseAvailable };

// --- Cloud Sync Helper Functions ---

/**
 * Saves a custom preset to the cloud
 */
export async function syncPresetToCloud(preset: AudioPreset, userId: string = "anonymous-agent") {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const presetRef = doc(db, 'presets', `${userId}_${preset.id}`);
    await setDoc(presetRef, {
      ...preset,
      userId,
      updatedAt: Date.now()
    }, { merge: true });
    return true;
  } catch (err) {
    console.error("Failed to sync preset to cloud:", err);
    return false;
  }
}

/**
 * Fetches all custom presets for a user from the cloud
 */
export async function fetchPresetsFromCloud(userId: string = "anonymous-agent"): Promise<AudioPreset[]> {
  if (!isFirebaseAvailable || !db) return [];
  try {
    const presetsCol = collection(db, 'presets');
    const q = query(presetsCol, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const presets: AudioPreset[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      presets.push({
        id: data.id,
        name: data.name,
        isCustom: true,
        gain: data.gain,
        eq60: data.eq60,
        eq230: data.eq230,
        eq910: data.eq910,
        eq3600: data.eq3600,
        eq14000: data.eq14000,
        noiseCancellation: data.noiseCancellation,
        noiseGateThreshold: data.noiseGateThreshold,
        compressorEnabled: data.compressorEnabled,
        createdAt: data.createdAt,
      });
    });
    return presets;
  } catch (err) {
    console.error("Failed to fetch presets from cloud:", err);
    return [];
  }
}

/**
 * Deletes a custom preset from the cloud
 */
export async function deletePresetFromCloud(presetId: string, userId: string = "anonymous-agent") {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const presetRef = doc(db, 'presets', `${userId}_${presetId}`);
    await deleteDoc(presetRef);
    return true;
  } catch (err) {
    console.error("Failed to delete preset from cloud:", err);
    return false;
  }
}

/**
 * Saves a recording metadata and its encrypted payload to the cloud
 */
export async function syncRecordingToCloud(
  metadata: RecordingMetadata, 
  audioDataUri: string, // Base64 / Data URI
  userId: string = "anonymous-agent"
) {
  if (!isFirebaseAvailable || !db) return false;
  try {
    // Save recording metadata + content
    const recordingRef = doc(db, 'recordings', `${userId}_${metadata.id}`);
    await setDoc(recordingRef, {
      ...metadata,
      audioDataUri, // Store data uri safely (for small professional clips)
      userId,
      isCloudSynced: true,
      updatedAt: Date.now()
    });
    return true;
  } catch (err) {
    console.error("Failed to sync recording to cloud:", err);
    return false;
  }
}

/**
 * Fetches all recordings metadata (and optionally data) from the cloud
 */
export async function fetchRecordingsFromCloud(
  userId: string = "anonymous-agent"
): Promise<{ metadata: RecordingMetadata; audioDataUri: string }[]> {
  if (!isFirebaseAvailable || !db) return [];
  try {
    const recordingsCol = collection(db, 'recordings');
    const q = query(recordingsCol, where("userId", "==", userId), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    const results: { metadata: RecordingMetadata; audioDataUri: string }[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      results.push({
        metadata: {
          id: data.id,
          name: data.name,
          timestamp: data.timestamp,
          duration: data.duration,
          presetName: data.presetName,
          fileSize: data.fileSize,
          isCloudSynced: true,
          encrypted: data.encrypted || false,
          shareCode: data.shareCode || undefined,
        },
        audioDataUri: data.audioDataUri
      });
    });
    return results;
  } catch (err) {
    console.error("Failed to fetch recordings from cloud:", err);
    return [];
  }
}

/**
 * Deletes a recording from the cloud
 */
export async function deleteRecordingFromCloud(recordingId: string, userId: string = "anonymous-agent") {
  if (!isFirebaseAvailable || !db) return false;
  try {
    const recordingRef = doc(db, 'recordings', `${userId}_${recordingId}`);
    await deleteDoc(recordingRef);
    return true;
  } catch (err) {
    console.error("Failed to delete recording from cloud:", err);
    return false;
  }
}

/**
 * Gets an encrypted shared recording by its unique shareCode
 */
export async function getSharedRecordingByCode(shareCode: string): Promise<{ metadata: RecordingMetadata; audioDataUri: string } | null> {
  if (!isFirebaseAvailable || !db) return null;
  try {
    const recordingsCol = collection(db, 'recordings');
    const q = query(recordingsCol, where("shareCode", "==", shareCode));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    
    let result: { metadata: RecordingMetadata; audioDataUri: string } | null = null;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      result = {
        metadata: {
          id: data.id,
          name: data.name,
          timestamp: data.timestamp,
          duration: data.duration,
          presetName: data.presetName,
          fileSize: data.fileSize,
          isCloudSynced: true,
          encrypted: data.encrypted || false,
          shareCode: data.shareCode || undefined,
        },
        audioDataUri: data.audioDataUri
      };
    });
    return result;
  } catch (err) {
    console.error("Failed to get shared recording:", err);
    return null;
  }
}
