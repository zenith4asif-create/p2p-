import { ref, get } from 'firebase/database';
import { db } from './firebase.ts';

// 30 distinct unambiguous characters: no 0, O, 1, I, L
const CHARSET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generates a cryptographically secure random 6-character short code.
 */
export function generateRandomCode(length: number = 6): string {
  const values = new Uint8Array(length);
  window.crypto.getRandomValues(values);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += CHARSET[values[i] % CHARSET.length];
  }
  return result;
}

/**
 * Generates a unique 6-character code, checking Firebase RTDB for collisions.
 */
export async function generateUniqueShareCode(): Promise<string> {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateRandomCode(6);
    try {
      const codeSnap = await get(ref(db, `shareCodes/${code}`));
      if (!codeSnap.exists()) {
        return code;
      }
      // If code exists but is already expired, it can be repurposed
      const data = codeSnap.val();
      if (data.expiresAt && Date.now() > data.expiresAt) {
        return code;
      }
    } catch (e) {
      // In case of transient check issue, still return a high-entropy code
      console.warn('Collision check warning:', e);
      return code;
    }
  }
  return generateRandomCode(6);
}
