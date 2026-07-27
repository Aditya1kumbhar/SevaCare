/**
 * Client-side encryption utility for SevaCare privacy features.
 * Uses Web Crypto API (SubtleCrypto) with AES-256-GCM.
 */

// Generate a random salt or IV
export function generateSalt(length = 16): Uint8Array {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.getRandomValues) {
    throw new Error('Web Crypto API not available');
  }
  return window.crypto.getRandomValues(new Uint8Array(length));
}

// Derive a key from a passphrase using PBKDF2
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }

  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// Encrypt plaintext with passphrase. Returns base64(salt + iv + ciphertext)
export async function encrypt(plaintext: string, passphrase: string): Promise<string> {
  try {
    const salt = generateSalt(16);
    const iv = generateSalt(12); // standard for GCM
    const key = await deriveKey(passphrase, salt);

    const enc = new TextEncoder();
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      enc.encode(plaintext)
    );

    // Combine salt, iv, and ciphertext
    const encryptedContentArray = new Uint8Array(encryptedContent);
    const combined = new Uint8Array(salt.length + iv.length + encryptedContentArray.length);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(encryptedContentArray, salt.length + iv.length);

    return bufferToBase64(combined.buffer);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt base64(salt + iv + ciphertext) using passphrase
export async function decrypt(ciphertextBase64: string, passphrase: string): Promise<string> {
  try {
    const combinedBuffer = base64ToBuffer(ciphertextBase64);
    const combined = new Uint8Array(combinedBuffer);

    // Extract salt, iv, and ciphertext
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28); // 16 + 12
    const ciphertext = combined.slice(28);

    const key = await deriveKey(passphrase, salt);

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data. Invalid passphrase or corrupted data.');
  }
}

// Generate SHA-256 hash for audit logs
export async function hashData(data: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API not available');
  }
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
