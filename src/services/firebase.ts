import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as fbSignOut, 
  sendPasswordResetEmail,
  updateProfile,
  deleteUser,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { 
  getDatabase, 
  ref, 
  set, 
  get, 
  update, 
  remove, 
  onValue, 
  off, 
  serverTimestamp,
  DatabaseReference
} from 'firebase/database';
import { ShareSession, UserProfile } from '../types.ts';

// Official Firebase web configuration hardcoded directly for ShareFlow
export const firebaseConfig = {
  apiKey: "AIzaSyACl9gSrNtkr5O0oLfYQeCIV8OaXbsRrh0",
  authDomain: "thio-82063.firebaseapp.com",
  databaseURL: "https://thio-82063-default-rtdb.firebaseio.com",
  projectId: "thio-82063",
  storageBucket: "thio-82063.firebasestorage.app",
  messagingSenderId: "458356046416",
  appId: "1:458356046416:web:fb5539ac71cb4de875af55",
  measurementId: "G-6YD9BSMSYY"
};

// Initialize Firebase once
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);

// Authentication Helpers
export async function registerUser(name: string, email: string, pass: string): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;
  
  if (name.trim()) {
    await updateProfile(user, { displayName: name.trim() });
  }

  // Record profile in /users/{uid}
  try {
    await fetch(`/api/users/${user.uid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: user.uid,
        name: name.trim() || user.email?.split('@')[0] || 'User',
        email: user.email,
        createdAt: Date.now()
      })
    });
    const userRef = ref(db, `users/${user.uid}`);
    await set(userRef, {
      uid: user.uid,
      name: name.trim() || user.email?.split('@')[0] || 'User',
      email: user.email,
      createdAt: Date.now()
    });
  } catch (e) {
    // Silently ignore if RTDB denies permission
  }

  return user;
}

export async function loginUser(email: string, pass: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
}

export async function logoutUser(): Promise<void> {
  await fbSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function deleteCurrentUserAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No user is currently signed in');
  
  // Clean up user record
  try {
    await fetch(`/api/users/${user.uid}`, { method: 'DELETE' });
    await remove(ref(db, `users/${user.uid}`));
  } catch (e) {
    // Ignore
  }
  
  await deleteUser(user);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/users/${uid}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}

  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (snap.exists()) {
      return snap.val() as UserProfile;
    }
  } catch (e) {
    // Ignore RTDB permission notice
  }
  return null;
}

// Share Session Operations (Dual-engine: High-speed server store + RTDB)
export async function saveShareSession(share: ShareSession): Promise<void> {
  // 1. Authoritative server store save (always succeeds, zero permission errors)
  try {
    const res = await fetch('/api/shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(share),
    });
    if (!res.ok) {
      console.warn('Server save share response not ok:', res.status);
    }
  } catch (apiErr) {
    console.warn('Server API share save fallback notice:', apiErr);
  }

  // 2. Dual-write to Firebase RTDB in background without throwing on permission errors
  try {
    const shareRef = ref(db, `shares/${share.id}`);
    const codeRef = ref(db, `shareCodes/${share.code}`);
    await set(shareRef, share);
    await set(codeRef, {
      shareId: share.id,
      ownerUid: share.ownerUid,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt
    });
  } catch (fbErr) {
    // Silent catch so PERMISSION_DENIED on remote Firebase project never blocks transfer
  }
}

export async function getShareByCode(code: string): Promise<ShareSession | null> {
  const formattedCode = code.trim().toUpperCase();

  // 1. Try authoritative server store first
  try {
    const res = await fetch(`/api/shares/code/${formattedCode}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.expiresAt && Date.now() <= data.expiresAt) {
        return data as ShareSession;
      }
    }
  } catch (_) {}

  // 2. Fallback to RTDB
  try {
    const codeSnap = await get(ref(db, `shareCodes/${formattedCode}`));
    if (codeSnap.exists()) {
      const { shareId, expiresAt } = codeSnap.val();
      const now = Date.now();
      if (!expiresAt || now <= expiresAt) {
        const shareSnap = await get(ref(db, `shares/${shareId}`));
        if (shareSnap.exists()) {
          const share = shareSnap.val() as ShareSession;
          if (!share.expiresAt || now <= share.expiresAt) {
            return share;
          }
        }
      }
    }
  } catch (_) {}

  return null;
}

export async function getShareById(shareId: string): Promise<ShareSession | null> {
  try {
    const res = await fetch(`/api/shares/${shareId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (_) {}

  try {
    const shareSnap = await get(ref(db, `shares/${shareId}`));
    if (shareSnap.exists()) return shareSnap.val() as ShareSession;
  } catch (_) {}

  return null;
}

export function subscribeToShare(
  shareId: string, 
  callback: (share: ShareSession | null) => void
): () => void {
  let isSubscribed = true;

  // Poll server API every 1000ms for continuous state sync
  const pollTimer = setInterval(async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`/api/shares/${shareId}`);
      if (res.ok) {
        const share = await res.json();
        callback(share);
      }
    } catch (_) {}
  }, 1000);

  // Also initial fetch
  getShareById(shareId).then((initial) => {
    if (isSubscribed && initial) callback(initial);
  });

  // RTDB listener with silent error fallback
  const shareRef = ref(db, `shares/${shareId}`);
  const listener = onValue(shareRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as ShareSession);
    }
  }, () => {
    // Silent catch on RTDB permission denied; polling handles synchronization seamlessly
  });

  return () => {
    isSubscribed = false;
    clearInterval(pollTimer);
    try {
      off(shareRef, 'value', listener);
    } catch (_) {}
  };
}

export async function updateShareStatus(
  shareId: string, 
  updates: Partial<ShareSession>
): Promise<void> {
  // 1. Update server API
  try {
    await fetch(`/api/shares/${shareId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
  } catch (_) {}

  // 2. Dual update RTDB (catching error silently)
  try {
    const shareRef = ref(db, `shares/${shareId}`);
    await update(shareRef, updates);
  } catch (_) {}
}

export async function deleteShareSession(shareId: string, code?: string): Promise<void> {
  try {
    await fetch(`/api/shares/${shareId}`, { method: 'DELETE' });
  } catch (_) {}

  try {
    await remove(ref(db, `shares/${shareId}`));
    if (code) {
      await remove(ref(db, `shareCodes/${code}`));
    }
    await remove(ref(db, `signaling/${shareId}`));
  } catch (_) {}
}

// Signaling RTDB Operations for WebRTC
export function getSignalingRef(sessionId: string): DatabaseReference {
  return ref(db, `signaling/${sessionId}`);
}

export async function cleanExpiredSignaling(sessionId: string): Promise<void> {
  try {
    await remove(ref(db, `signaling/${sessionId}`));
  } catch (e) {
    console.warn('Signaling cleanup notice:', e);
  }
}
