/**
 * Custom High-Performance Audio Scrambler (RC4-based Stream Cipher)
 * Ensures 100% compatibility in secure (HTTPS) and insecure (HTTP) sandbox iframes.
 */

/**
 * Converts a password string into a 256-byte key schedule array
 */
function initializeKeySchedule(key: string): number[] {
  const S: number[] = Array.from({ length: 256 }, (_, i) => i);
  let j = 0;
  const keyBytes = new TextEncoder().encode(key);
  const keyLength = keyBytes.length;

  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + keyBytes[i % keyLength]) % 256;
    // Swap S[i] and S[j]
    const temp = S[i];
    S[i] = S[j];
    S[j] = temp;
  }
  return S;
}

/**
 * Encrypts or Decrypts a Uint8Array using RC4 stream cipher
 */
export function cryptBytes(data: Uint8Array, key: string): Uint8Array {
  if (!key) return data;
  
  const S = initializeKeySchedule(key);
  const output = new Uint8Array(data.length);
  let i = 0;
  let j = 0;

  for (let offset = 0; offset < data.length; offset++) {
    i = (i + 1) % 256;
    j = (j + S[i]) % 256;
    
    // Swap S[i] and S[j]
    const temp = S[i];
    S[i] = S[j];
    S[j] = temp;

    const K = S[(S[i] + S[j]) % 256];
    output[offset] = data[offset] ^ K;
  }

  return output;
}

/**
 * Encrypts a Blob with a password
 */
export async function encryptBlob(blob: Blob, key: string): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const encryptedBytes = cryptBytes(uint8, key);
  return new Blob([encryptedBytes], { type: 'application/octet-stream' });
}

/**
 * Decrypts a password-encrypted Blob back to its original mime type
 */
export async function decryptBlob(blob: Blob, key: string, originalMimeType: string = 'audio/webm'): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer();
  const uint8 = new Uint8Array(arrayBuffer);
  const decryptedBytes = cryptBytes(uint8, key);
  return new Blob([decryptedBytes], { type: originalMimeType });
}

/**
 * Helper to convert Blob to Base64 String for Cloud/Firestore storage sync
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Helper to convert Base64 String back to Blob
 */
export function base64ToBlob(base64Uri: string, defaultType: string = 'audio/webm'): Blob {
  const parts = base64Uri.split(';base64,');
  const contentType = parts[0].split(':')[1] || defaultType;
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}
