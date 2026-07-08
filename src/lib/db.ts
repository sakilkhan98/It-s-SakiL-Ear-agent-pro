export interface LocalAudioRecord {
  id: string;
  name: string;
  timestamp: number;
  duration: number;
  presetName: string;
  fileSize: number;
  audioBlob: Blob;
  isCloudSynced: boolean;
  encrypted: boolean;
  shareCode?: string;
}

const DB_NAME = 'EarAgentMicDB';
const DB_VERSION = 1;
const STORE_NAME = 'recordings';

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function saveRecord(record: LocalAudioRecord): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB save error:", err);
    return false;
  }
}

export async function getAllRecords(): Promise<LocalAudioRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // Sort by newest timestamp
        const records = request.result as LocalAudioRecord[];
        records.sort((a, b) => b.timestamp - a.timestamp);
        resolve(records);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB fetch error:", err);
    return [];
  }
}

export async function deleteRecord(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB delete error:", err);
    return false;
  }
}

export async function getRecordById(id: string): Promise<LocalAudioRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB getRecord error:", err);
    return null;
  }
}
